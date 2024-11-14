// Enhanced AuthMiddleware.js
import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) return res.status(401).send("You are not authenticated!");
  
  jwt.verify(token, process.env.JWT_KEY, async (err, payload) => {
    if (err) return res.status(403).send("Token is not valid!");
    req.userId = payload?.userId;
    req.userRole = payload?.role; // Add role to request object
    next();
  });
};

// Add a role-based middleware
export const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.userRole) return res.status(403).send("Role not found!");
    if (allowedRoles.includes(req.userRole)) {
      next();
    } else {
      res.status(403).send("You don't have permission to access this resource!");
    }
  };
};