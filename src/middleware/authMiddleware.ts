import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { errorResponse } from "../utils/responses.js";

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  console.log("Authorization authHeader : ", authHeader);
  if (!authHeader?.startsWith("Bearer "))
    return res.status(401).json(errorResponse("unauthorized"));

  const token = authHeader.split(" ")[1] || "";

  try {
    const decoded = jwt.verify(token!, process.env.JWT_SECRET!) as JwtPayload;

    req.user = {
      userId: decoded.userId,
      username: decoded.username,
    };

    next();
  } catch (error) {
    return res.status(401).json(errorResponse("invalid token"));
  }
}
