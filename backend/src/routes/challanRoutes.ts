import { Router } from "express";
import {
  listChallans,
  getChallan,
  createChallan,
  confirmChallan,
  cancelChallan,
  createChallanSchema,
} from "../controllers/challanController";
import { validateBody } from "../middleware/validate";
import { authenticate, authorize } from "../middleware/auth";
import { downloadInvoice } from "../controllers/invoiceController";

const router = Router();

router.use(authenticate);

router.get("/", listChallans);
router.get("/:id", getChallan);
router.get("/:id/invoice", downloadInvoice); // bonus: PDF export

// Sales and Admin create/confirm/cancel challans
router.post("/", authorize("ADMIN", "SALES"), validateBody(createChallanSchema), createChallan);
router.patch("/:id/confirm", authorize("ADMIN", "SALES"), confirmChallan);
router.patch("/:id/cancel", authorize("ADMIN", "SALES", "WAREHOUSE"), cancelChallan);

export default router;
