import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("Password@123", 10);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@erpcrm.test" },
      update: {},
      create: { name: "Admin User", email: "admin@erpcrm.test", passwordHash: password, role: "ADMIN" },
    }),
    prisma.user.upsert({
      where: { email: "sales@erpcrm.test" },
      update: {},
      create: { name: "Sales User", email: "sales@erpcrm.test", passwordHash: password, role: "SALES" },
    }),
    prisma.user.upsert({
      where: { email: "warehouse@erpcrm.test" },
      update: {},
      create: { name: "Warehouse User", email: "warehouse@erpcrm.test", passwordHash: password, role: "WAREHOUSE" },
    }),
    prisma.user.upsert({
      where: { email: "accounts@erpcrm.test" },
      update: {},
      create: { name: "Accounts User", email: "accounts@erpcrm.test", passwordHash: password, role: "ACCOUNTS" },
    }),
  ]);

  const admin = users[0];

  const customer1 = await prisma.customer.create({
    data: {
      name: "Ravi Kumar",
      mobile: "9876543210",
      email: "ravi@wholesalemart.in",
      businessName: "Wholesale Mart",
      gstNumber: "29ABCDE1234F1Z5",
      customerType: "WHOLESALE",
      address: "MG Road, Bangalore",
      status: "ACTIVE",
      notes: "Regular bulk buyer, prefers monthly billing.",
    },
  });

  await prisma.customer.create({
    data: {
      name: "Priya Distributors",
      mobile: "9123456780",
      businessName: "Priya Distribution Co.",
      customerType: "DISTRIBUTOR",
      address: "Whitefield, Bangalore",
      status: "LEAD",
      followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      notes: "Interested in electronics category, follow up next week.",
    },
  });

  const product1 = await prisma.product.create({
    data: {
      name: "LED Bulb 9W",
      sku: "LED-9W-001",
      category: "Electricals",
      unitPrice: 120.0,
      currentStock: 500,
      minStockAlert: 50,
      location: "Warehouse A - Rack 3",
    },
  });

  const product2 = await prisma.product.create({
    data: {
      name: "Ceiling Fan 48in",
      sku: "FAN-48-002",
      category: "Electricals",
      unitPrice: 1450.0,
      currentStock: 40,
      minStockAlert: 10,
      location: "Warehouse A - Rack 7",
    },
  });

  await prisma.product.create({
    data: {
      name: "Extension Board 6-Socket",
      sku: "EXT-6S-003",
      category: "Electricals",
      unitPrice: 350.0,
      currentStock: 8,
      minStockAlert: 15, // deliberately below alert to demo low-stock UI
      location: "Warehouse B - Rack 1",
    },
  });

  // Sample confirmed challan to demonstrate stock deduction + snapshot
  await prisma.challan.create({
    data: {
      challanNumber: "CH-2026-000001",
      customerId: customer1.id,
      status: "CONFIRMED",
      totalQuantity: 20,
      createdById: admin.id,
      confirmedAt: new Date(),
      items: {
        create: [
          {
            productId: product1.id,
            productNameSnap: product1.name,
            productSkuSnap: product1.sku,
            unitPriceSnap: product1.unitPrice,
            quantity: 15,
            lineTotal: 15 * Number(product1.unitPrice),
          },
          {
            productId: product2.id,
            productNameSnap: product2.name,
            productSkuSnap: product2.sku,
            unitPriceSnap: product2.unitPrice,
            quantity: 5,
            lineTotal: 5 * Number(product2.unitPrice),
          },
        ],
      },
    },
  });

  await prisma.product.update({ where: { id: product1.id }, data: { currentStock: { decrement: 15 } } });
  await prisma.product.update({ where: { id: product2.id }, data: { currentStock: { decrement: 5 } } });

  console.log("Seed complete. Demo logins (password for all: Password@123):");
  console.log("  admin@erpcrm.test");
  console.log("  sales@erpcrm.test");
  console.log("  warehouse@erpcrm.test");
  console.log("  accounts@erpcrm.test");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
