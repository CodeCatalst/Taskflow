import jwt from 'jsonwebtoken';

const getAccessSecret = () => process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET;
const getRefreshSecret = () => process.env.REFRESH_SECRET || process.env.JWT_REFRESH_SECRET;

export const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    getAccessSecret(),
    { expiresIn: '15m' }
  );
};

export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    getRefreshSecret(),
    { expiresIn: '7d' }
  );
};

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, getAccessSecret());
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, getRefreshSecret());
  } catch (error) {
    return null;
  }
};