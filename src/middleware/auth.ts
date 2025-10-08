import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { config } from '../config/env';
import { verifyToken } from '../utils/jwt';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';

/**
 * Admin authentication middleware using X-Admin-Secret header
 */
export function requireAdminSecret(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const adminSecret = req.headers['x-admin-secret'];
    
    if (!adminSecret || adminSecret !== config.adminSecret) {
      throw new UnauthorizedError('Invalid admin secret');
    }
    
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * JWT authentication middleware
 */
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = extractToken(req);
    
    if (!token) {
      throw new UnauthorizedError('No token provided');
    }
    
    const payload = verifyToken(token);
    req.admin = payload;
    
    next();
  } catch (error) {
    next(new UnauthorizedError('Invalid or expired token'));
  }
}

/**
 * Role-based authorization middleware
 */
export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.admin) {
        throw new UnauthorizedError('Not authenticated');
      }
      
      if (!roles.includes(req.admin.role)) {
        throw new ForbiddenError('Insufficient permissions');
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Extract token from Authorization header
 */
function extractToken(req: AuthRequest): string | null {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return null;
  }
  
  const parts = authHeader.split(' ');
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
}

/**
 * Optional authentication - doesn't fail if no token provided
 */
export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = extractToken(req);
    
    if (token) {
      const payload = verifyToken(token);
      req.admin = payload;
    }
    
    next();
  } catch (error) {
    // Ignore token errors for optional auth
    next();
  }
}

