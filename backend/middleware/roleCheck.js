import { getEffectiveRole } from '../utils/authz.js';

export const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const effectiveRole = getEffectiveRole(req);

    if (!allowedRoles.includes(effectiveRole)) {
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.',
        required: allowedRoles,
        current: effectiveRole
      });
    }

    next();
  };
};
