import { Request, Response } from "express";
import { z } from "zod";
import { Prisma, Product } from "@prisma/client";
import prisma from "../config/prisma";
import { asyncHandler, ApiError } from "../middleware/errorHandler";
import { AuthRequest } from "../middleware/auth";

export const productSchema = z.object({
  name: z.string().min(2),
  sku: z.string().min(2),
  category: z.string().optional(),
  unitPrice: z.number().positive(),
  currentStock: z.number().int().min(0).default(0),
  minStockAlert: z.number().int().min(0).default(0),
  location: z.string().optional(),
});

export const productUpdateSchema = productSchema.partial();

export const stockAdjustSchema = z.object({
  quantity: z.number().int().positive(),
  movementType: z.enum(["IN", "OUT"]),
  reason: z.string().min(1),
});

// GET /products?search=&category=&lowStock=true&page=&limit=
export const listProducts = asyncHandler(async (req: Request, res: Response) => {
  const { search, category, lowStock } = req.query as Record<string, string>;
  const page = Math.max(parseInt(req.query.page as string) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

  const where: any = { isActive: true };
  if (category) where.category = category;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
    ];
  }

  let items = await prisma.product.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: "desc" },
  });
  const total = await prisma.product.count({ where });

  if (lowStock === "true") {
    items = items.filter((p: Product) => p.currentStock <= p.minStockAlert);
  }

  res.status(200).json({
    success: true,
    data: items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { stockMovements: { orderBy: { createdAt: "desc" }, take: 20, include: { createdBy: { select: { name: true } } } } },
  });
  if (!product) throw new ApiError(404, "Product not found");
  res.status(200).json({ success: true, data: product });
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await prisma.product.create({ data: req.body });
  res.status(201).json({ success: true, data: product });
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, "Product not found");
  const product = await prisma.product.update({ where: { id: req.params.id }, data: req.body });
  res.status(200).json({ success: true, data: product });
});

// POST /products/:id/stock-movements - manual stock IN/OUT adjustment (warehouse team)
export const adjustStock = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { quantity, movementType, reason } = req.body;

  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const product = await tx.product.findUnique({ where: { id: req.params.id } });
    if (!product) throw new ApiError(404, "Product not found");

    const newStock = movementType === "IN" ? product.currentStock + quantity : product.currentStock - quantity;

    if (newStock < 0) {
      throw new ApiError(400, `Insufficient stock. Current stock is ${product.currentStock}, cannot remove ${quantity}.`);
    }

    const updated = await tx.product.update({
      where: { id: req.params.id },
      data: { currentStock: newStock },
    });

    const movement = await tx.stockMovement.create({
      data: {
        productId: req.params.id,
        quantity,
        movementType,
        reason,
        createdById: req.user!.userId,
      },
    });

    return { product: updated, movement };
  });

  res.status(201).json({ success: true, data: result });
});
