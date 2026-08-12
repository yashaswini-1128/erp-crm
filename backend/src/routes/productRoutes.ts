import { Router } from "express";
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  adjustStock,
  productSchema,
  productUpdateSchema,
  stockAdjustSchema,
} from "../controllers/productController";
import { validateBody } from "../middleware/validate";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/", listProducts);
router.get("/:id", getProduct);

// Admin and Warehouse manage the product catalog and stock
router.post("/", authorize("ADMIN", "WAREHOUSE"), validateBody(productSchema), createProduct);
router.put("/:id", authorize("ADMIN", "WAREHOUSE"), validateBody(productUpdateSchema), updateProduct);
router.post(
  "/:id/stock-movements",
  authorize("ADMIN", "WAREHOUSE"),
  validateBody(stockAdjustSchema),
  adjustStock
);

export default router;
