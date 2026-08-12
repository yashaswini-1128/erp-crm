import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../config/prisma";
import { asyncHandler, ApiError } from "../middleware/errorHandler";
import { AuthRequest } from "../middleware/auth";

export const customerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  mobile: z.string().min(10, "Mobile number must be at least 10 digits"),
  email: z.string().email().optional().or(z.literal("")),
  businessName: z.string().optional(),
  gstNumber: z.string().optional(),
  customerType: z.enum(["RETAIL", "WHOLESALE", "DISTRIBUTOR"]).default("RETAIL"),
  address: z.string().optional(),
  status: z.enum(["LEAD", "ACTIVE", "INACTIVE"]).default("LEAD"),
  followUpDate: z.string().datetime().optional().or(z.literal("")),
  notes: z.string().optional(),
});

export const customerUpdateSchema = customerSchema.partial();

export const followUpSchema = z.object({
  note: z.string().min(1, "Note is required"),
  followUpAt: z.string().datetime().optional(),
});

// GET /customers?search=&status=&type=&page=&limit=
export const listCustomers = asyncHandler(async (req: Request, res: Response) => {
  const { search, status, type } = req.query as Record<string, string>;
  const page = Math.max(parseInt(req.query.page as string) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

  const where: any = {};
  if (status) where.status = status;
  if (type) where.customerType = type;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { mobile: { contains: search, mode: "insensitive" } },
      { businessName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.customer.count({ where }),
  ]);

  res.status(200).json({
    success: true,
    data: items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

export const getCustomer = asyncHandler(async (req: Request, res: Response) => {
  const customer = await prisma.customer.findUnique({
    where: { id: req.params.id },
    include: {
      followUps: { orderBy: { followUpAt: "desc" }, include: { createdBy: { select: { name: true } } } },
      challans: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
  if (!customer) throw new ApiError(404, "Customer not found");
  res.status(200).json({ success: true, data: customer });
});

export const createCustomer = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body;
  const customer = await prisma.customer.create({
    data: {
      ...data,
      email: data.email || null,
      followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
    },
  });
  res.status(201).json({ success: true, data: customer });
});

export const updateCustomer = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body;
  const existing = await prisma.customer.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, "Customer not found");

  const customer = await prisma.customer.update({
    where: { id: req.params.id },
    data: {
      ...data,
      followUpDate: data.followUpDate ? new Date(data.followUpDate) : undefined,
    },
  });
  res.status(200).json({ success: true, data: customer });
});

export const addFollowUp = asyncHandler(async (req: AuthRequest, res: Response) => {
  const existing = await prisma.customer.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, "Customer not found");

  const followUp = await prisma.followUp.create({
    data: {
      customerId: req.params.id,
      note: req.body.note,
      followUpAt: req.body.followUpAt ? new Date(req.body.followUpAt) : new Date(),
      createdById: req.user!.userId,
    },
  });

  res.status(201).json({ success: true, data: followUp });
});
