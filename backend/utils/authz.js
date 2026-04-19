export const getEffectiveRole = (req) => (
  req.context?.isSystemAdmin ? 'admin' : (req.context?.currentRole || req.user?.role)
);

export const hasEffectiveRole = (req, allowedRoles = []) => allowedRoles.includes(getEffectiveRole(req));
