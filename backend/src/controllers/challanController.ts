import { Request, Response } from "express";
import { z } from "zod";
import { Prisma, Product } from "@prisma/client";
import prisma from "../config/prisma";
import { asyncHandler, ApiError } from "../middleware/errorHandler";
import { AuthRequest } from "../middleware/auth";
import { generateChallanNumber } from "../utils/challanNumber";

export const challanItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export const createChallanSchema = z.object({
  customerId: z.string().uuid(),
  items: z.array(challanItemSchema).min(1, "At least one product line is required"),
  status: z.enum(["DRAFT", "CONFIRMED"]).default("DRAFT"),
});

// GET /challans?status=&customerId=&page=&limit=
export const listChallans = asyncHandler(async (req: Request, res: Response) => {
  const { status, customerId } = req.query as Record<string, string>;
  const page = Math.max(parseInt(req.query.page as string) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

  const where: any = {};
  if (status) where.status = status;
  if (customerId) where.customerId = customerId;

  const [items, total] = await Promise.all([
    prisma.challan.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { customer: { select: { name: true, mobile: true } }, items: true },
    }),
    prisma.challan.count({ where }),
  ]);

  res.status(200).json({
    success: true,
    data: items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

export const getChallan = asyncHandler(async (req: Request, res: Response) => {
  const challan = await prisma.challan.findUnique({
    where: { id: req.params.id },
    include: { customer: true, items: true, createdBy: { select: { name: true, role: true } } },
  });
  if (!challan) throw new ApiError(404, "Challan not found");
  res.status(200).json({ success: true, data: challan });
});

// Core business logic:
// - Product snapshot (name/sku/price) is frozen onto each ChallanItem at creation time.
// - If status = CONFIRMED, stock is deducted immediately, inside the same transaction.
// - Stock is never allowed to go negative - the whole transaction rolls back if any
//   line item has insufficient stock, so a challan is never left half-applied.
export const createChallan = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { customerId, items, status } = req.body;

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) throw new ApiError(404, "Customer not found");

  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const productIds = items.map((i: any) => i.productId);
    const products = await tx.product.findMany({ where: { id: { in: productIds } } });

    if (products.length !== productIds.length) {
      throw new ApiError(404, "One or more products were not found");
    }

    const productMap = new Map(products.map((p: Product) => [p.id, p]));
    let totalQuantity = 0;

    const itemsData = items.map((item: any) => {
      const product = productMap.get(item.productId)!;

      if (status === "CONFIRMED" && product.currentStock < item.quantity) {
        throw new ApiError(
          400,
          `Insufficient stock for "${product.name}" (SKU ${product.sku}). Available: ${product.currentStock}, requested: ${item.quantity}.`
        );
      }

      totalQuantity += item.quantity;

      return {
        productId: product.id,
        productNameSnap: product.name,
        productSkuSnap: product.sku,
        unitPriceSnap: product.unitPrice,
        quantity: item.quantity,
        lineTotal: Number(product.unitPrice) * item.quantity,
      };
    });

    const challanNumber = await generateChallanNumber(tx);

    const challan = await tx.challan.create({
      data: {
        challanNumber,
        customerId,
        status,
        totalQuantity,
        createdById: req.user!.userId,
        confirmedAt: status === "CONFIRMED" ? new Date() : null,
        items: { create: itemsData },
      },
      include: { items: true, customer: true },
    });

    // Deduct stock + log movement only when confirmed at creation time
    if (status === "CONFIRMED") {
      for (const item of items) {
        const product = productMap.get(item.productId)!;
        await tx.product.update({
          where: { id: product.id },
          data: { currentStock: product.currentStock - item.quantity },
        });
        await tx.stockMovement.create({
          data: {
            productId: product.id,
            quantity: item.quantity,
            movementType: "OUT",
            reason: `Sales challan ${challanNumber}`,
            createdById: req.user!.userId,
            refChallanId: challan.id,
          },
        });
      }
    }

    return challan;
  });

  res.status(201).json({ success: true, data: result });
});

// PATCH /challans/:id/confirm - transitions DRAFT -> CONFIRMED, deducting stock now
export const confirmChallan = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const challan = await tx.challan.findUnique({ where: { id: req.params.id }, include: { items: true } });
    if (!challan) throw new ApiError(404, "Challan not found");
    if (challan.status !== "DRAFT") {
      throw new ApiError(400, `Only DRAFT challans can be confirmed. Current status: ${challan.status}`);
    }

    for (const item of challan.items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product) throw new ApiError(404, `Product ${item.productSkuSnap} no longer exists`);
      if (product.currentStock < item.quantity) {
        throw new ApiError(
          400,
          `Insufficient stock for "${product.name}". Available: ${product.currentStock}, required: ${item.quantity}.`
        );
      }
    }

    for (const item of challan.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { currentStock: { decrement: item.quantity } },
      });
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          quantity: item.quantity,
          movementType: "OUT",
          reason: `Sales challan ${challan.challanNumber} confirmed`,
          createdById: req.user!.userId,
          refChallanId: challan.id,
        },
      });
    }

    return tx.challan.update({
      where: { id: challan.id },
      data: { status: "CONFIRMED", confirmedAt: new Date() },
      include: { items: true, customer: true },
    });
  });

  res.status(200).json({ success: true, data: result });
});

// PATCH /challans/:id/cancel - cancels a challan; if it was CONFIRMED, stock is restored
export const cancelChallan = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const challan = await tx.challan.findUnique({ where: { id: req.params.id }, include: { items: true } });
    if (!challan) throw new ApiError(404, "Challan not found");
    if (challan.status === "CANCELLED") {
      throw new ApiError(400, "Challan is already cancelled");
    }

    if (challan.status === "CONFIRMED") {
      for (const item of challan.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { increment: item.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            movementType: "IN",
            reason: `Sales challan ${challan.challanNumber} cancelled - stock restored`,
            createdById: req.user!.userId,
            refChallanId: challan.id,
          },
        });
      }
    }

    return tx.challan.update({
      where: { id: challan.id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
      include: { items: true, customer: true },
    });
  });

  res.status(200).json({ success: true, data: result });
});
