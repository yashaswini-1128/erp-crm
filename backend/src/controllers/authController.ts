import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../config/prisma";
import { comparePassword, signToken } from "../utils/auth";
import { asyncHandler, ApiError } from "../middleware/errorHandler";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    throw new ApiError(401, "Invalid email or password");
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = signToken({ userId: user.id, role: user.role, email: user.email });

  res.status(200).json({
    success: true,
    data: {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    },
  });
});

export const me = asyncHandler(async (req: any, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
  });
  if (!user) throw new ApiError(404, "User not found");
  res.status(200).json({ success: true, data: user });
});
