import { Request, Response } from "express";
import PDFDocument from "pdfkit";
import prisma from "../config/prisma";
import { asyncHandler, ApiError } from "../middleware/errorHandler";

// GET /challans/:id/invoice - streams a PDF invoice (bonus feature)
export const downloadInvoice = asyncHandler(async (req: Request, res: Response) => {
  const challan = await prisma.challan.findUnique({
    where: { id: req.params.id },
    include: { customer: true, items: true },
  });
  if (!challan) throw new ApiError(404, "Challan not found");

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${challan.challanNumber}.pdf"`);

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);

  doc.fontSize(20).text("SALES CHALLAN / INVOICE", { align: "center" });
  doc.moveDown();
  doc.fontSize(11).text(`Challan No: ${challan.challanNumber}`);
  doc.text(`Status: ${challan.status}`);
  doc.text(`Date: ${challan.createdAt.toDateString()}`);
  doc.moveDown();

  doc.fontSize(13).text("Bill To:", { underline: true });
  doc.fontSize(11).text(challan.customer.name);
  if (challan.customer.businessName) doc.text(challan.customer.businessName);
  doc.text(challan.customer.mobile);
  if (challan.customer.address) doc.text(challan.customer.address);
  if (challan.customer.gstNumber) doc.text(`GSTIN: ${challan.customer.gstNumber}`);
  doc.moveDown();

  doc.fontSize(13).text("Items:", { underline: true });
  doc.moveDown(0.5);

  const tableTop = doc.y;
  doc.fontSize(10);
  doc.text("Product", 50, tableTop);
  doc.text("SKU", 220, tableTop);
  doc.text("Qty", 320, tableTop);
  doc.text("Unit Price", 380, tableTop);
  doc.text("Line Total", 460, tableTop);
  doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

  let y = tableTop + 25;
  let grandTotal = 0;
  for (const item of challan.items) {
    doc.text(item.productNameSnap, 50, y);
    doc.text(item.productSkuSnap, 220, y);
    doc.text(String(item.quantity), 320, y);
    doc.text(`Rs ${Number(item.unitPriceSnap).toFixed(2)}`, 380, y);
    doc.text(`Rs ${Number(item.lineTotal).toFixed(2)}`, 460, y);
    grandTotal += Number(item.lineTotal);
    y += 20;
  }

  doc.moveTo(50, y + 5).lineTo(550, y + 5).stroke();
  doc.fontSize(12).text(`Grand Total: Rs ${grandTotal.toFixed(2)}`, 380, y + 15);

  doc.end();
});
