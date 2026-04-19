import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import RevokedToken from '../models/RevokedToken.js';

// Token configuration - balanced for user experience and security
const ACCESS_TOKEN_EXPIRY = '1h';  // 1 hour - balanced for UX and security
const REFRESH_TOKEN_EXPIRY = '24h';  // 24 hours - reasonable refresh window

const getValidatedSecret = (secret, envName) => {
  if (!secret || typeof secret !== 'string') {
    throw new Error(`${envName} is not configured`);
  }

  const normalizedSecret = secret.trim();
  const minimumBytes = process.env.NODE_ENV === 'production' ? 32 : 16;
  if (Buffer.byteLength(normalizedSecret, 'utf8') < minimumBytes) {
    throw new Error(`${envName} must be at least ${minimumBytes} bytes long`);
  }

  return normalizedSecret;
};

const getExpiryDateFromToken = (token) => {
  const decoded = jwt.decode(token);

  if (!decoded || typeof decoded !== 'object' || !decoded.exp) {
    return null;
  }

  return new Date(decoded.exp * 1000);
};

const decodeTokenMetadata = (token) => {
  const decoded = jwt.decode(token);

  if (!decoded || typeof decoded !== 'object' || !decoded.jti || !decoded.exp) {
    return null;
  }

  return decoded;
};

export const generateAccessToken = (userId, role, ip = null) => {
  const payload = { 
    userId, 
    role,
    iat: Math.floor(Date.now() / 1000),
    jti: crypto.randomUUID()  // Unique token ID for revocation
  };
  
  // Bind IP to token for additional security (stricter in production)
  if (ip && process.env.NODE_ENV === 'production') {
    payload.ip = ip;
  }
  
  const signingKey = getValidatedSecret(process.env.JWT_SECRET, 'JWT_SECRET');
  return jwt.sign(payload, signingKey, { 
    expiresIn: ACCESS_TOKEN_EXPIRY,
    algorithm: 'HS256'
  });
};

export const generateRefreshToken = (userId, ip = null, expiry = null) => {
  const payload = { 
    userId,
    iat: Math.floor(Date.now() / 1000),
    jti: crypto.randomUUID(),
    type: 'refresh'
  };
  
  // Bind IP to refresh token
  if (ip && process.env.NODE_ENV === 'production') {
    payload.ip = ip;
  }
  
  const signingKey = getValidatedSecret(process.env.REFRESH_SECRET, 'REFRESH_SECRET');
  return jwt.sign(payload, signingKey, {
    expiresIn: expiry || REFRESH_TOKEN_EXPIRY,
    algorithm: 'HS256'
  });
};

export const verifyAccessToken = (token, clientIP = null) => {
  try {
    const signingKey = getValidatedSecret(process.env.JWT_SECRET, 'JWT_SECRET');
    const decoded = jwt.verify(token, signingKey, { algorithms: ['HS256'] });
    
    // In production, verify IP bound to token
    if (clientIP && process.env.NODE_ENV === 'production' && decoded.ip) {
      // Simple subnet match (last 2 octets)
      const tokenIP = decoded.ip;
      if (!clientIP.endsWith(tokenIP.split('.').slice(-2).join('.'))) {
        return null;
      }
    }

    return decoded;
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token, clientIP = null) => {
  try {
    const signingKey = getValidatedSecret(process.env.REFRESH_SECRET, 'REFRESH_SECRET');
    const decoded = jwt.verify(token, signingKey, { algorithms: ['HS256'] });
    
    // In production, verify IP bound to token
    if (clientIP && process.env.NODE_ENV === 'production' && decoded.ip) {
      const tokenIP = decoded.ip;
      if (!clientIP.endsWith(tokenIP.split('.').slice(-2).join('.'))) {
        return null;
      }
    }

    return decoded;
  } catch (error) {
    return null;
  }
};

export const blacklistToken = async ({
  jti,
  tokenType = 'access',
  userId = null,
  expiresAt,
  reason = 'revoked',
}) => {
  if (!jti || !expiresAt) {
    return;
  }

  await RevokedToken.findOneAndUpdate(
    { jti },
    {
      jti,
      tokenType,
      userId,
      expiresAt,
      reason,
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );
};

export const blacklistTokenByValue = async (token, tokenType = 'access', reason = 'revoked') => {
  const metadata = decodeTokenMetadata(token);
  if (!metadata) {
    return;
  }

  await blacklistToken({
    jti: metadata.jti,
    tokenType,
    userId: metadata.userId || null,
    expiresAt: new Date(metadata.exp * 1000),
    reason,
  });
};

export const isTokenBlacklisted = async (jti) => {
  if (!jti) {
    return false;
  }

  const revokedToken = await RevokedToken.findOne({ jti }).select('_id').lean();
  return Boolean(revokedToken);
};

export const getTokenExpiry = getExpiryDateFromToken;
