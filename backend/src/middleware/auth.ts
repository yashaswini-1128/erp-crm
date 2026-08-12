import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload } from "../utils/auth";

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Missing or invalid Authorization header" });
  }
  const token = header.split(" ")[1];
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}

// Usage: authorize("ADMIN", "SALES")
export function authorize(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not permitted to perform this action`,
      });
    }
    next();
  };
}
