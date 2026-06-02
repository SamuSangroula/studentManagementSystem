import jwt from 'jsonwebtoken';
import { findActiveUserById } from '../models/userModel.js';

const secret = process.env.JWT_SECRET || 'change_me';

export function createToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, secret, { expiresIn: '7d' });
}

export async function authRequired(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const payload = jwt.verify(token, secret);
    const user = await findActiveUserById(payload.sub);

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    req.user = { id: user.id, role: user.role, name: user.name, email: user.email };
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

export function allowRoles(...roles) {
  return function roleGuard(req, res, next) {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    return next();
  };
}
