import jwt from 'jsonwebtoken';

// Token configuration
const ACCESS_TOKEN_EXPIRY = '1h';  // Reduced from 24h for better security
const REFRESH_TOKEN_EXPIRY = '24h';  // Reduced from 7d for better security

export const generateAccessToken = (userId, role, ip = null) => {
  const payload = { userId, role };
  
  // Include IP address for validation (optional, can be null)
  if (ip) {
    payload.ip = ip;
  }
  
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
};

export const generateRefreshToken = (userId, ip = null) => {
  const payload = { userId };
  
  // Include IP for refresh token tracking
  if (ip) {
    payload.ip = ip;
  }
  
  return jwt.sign(
    payload,
    process.env.REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
};

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.REFRESH_SECRET);
  } catch (error) {
    return null;
  }
};