import { Prisma, PrismaClient } from "@prisma/client";

type TxClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

// Generates a sequential challan number per calendar year, e.g. CH-2026-000123
// Uses count of challans created this year + 1 inside the same transaction the
// caller wraps this in, so it stays consistent even under concurrent creation
// (the unique constraint on challanNumber acts as the final safety net).
export async function generateChallanNumber(tx: TxClient): Promise<string> {
  const year = new Date().getFullYear();
  const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
  const endOfYear = new Date(`${year + 1}-01-01T00:00:00.000Z`);

  const countThisYear = await tx.challan.count({
    where: { createdAt: { gte: startOfYear, lt: endOfYear } },
  });

  const sequence = String(countThisYear + 1).padStart(6, "0");
  return `CH-${year}-${sequence}`;
}
