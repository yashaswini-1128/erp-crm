import { Router } from "express";
import {
  listCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  addFollowUp,
  customerSchema,
  customerUpdateSchema,
  followUpSchema,
} from "../controllers/customerController";
import { validateBody } from "../middleware/validate";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.use(authenticate);

// All internal roles can view customers
router.get("/", listCustomers);
router.get("/:id", getCustomer);

// Sales and Admin can create/edit customers and log follow-ups
router.post("/", authorize("ADMIN", "SALES"), validateBody(customerSchema), createCustomer);
router.put("/:id", authorize("ADMIN", "SALES"), validateBody(customerUpdateSchema), updateCustomer);
router.post("/:id/follow-ups", authorize("ADMIN", "SALES"), validateBody(followUpSchema), addFollowUp);

export default router;
