import { PrismaClient } from "@prisma/client";

// Single shared Prisma instance (avoids exhausting DB connections in dev with hot reload)
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

export default prisma;
