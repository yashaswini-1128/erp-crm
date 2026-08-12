import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/authRoutes";
import customerRoutes from "./routes/customerRoutes";
import productRoutes from "./routes/productRoutes";
import challanRoutes from "./routes/challanRoutes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: (process.env.CORS_ORIGIN || "*").split(","),
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === "development" ? "dev" : "combined"));

// Basic rate limiting on auth to slow down brute force attempts
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });
app.use("/api/auth/login", authLimiter);

app.get("/api/health", (_req, res) => res.status(200).json({ success: true, message: "OK" }));

app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/challans", challanRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
