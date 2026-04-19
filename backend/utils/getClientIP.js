/**
 * Extract the real client IP address from a request
 * Handles various proxy configurations and header formats
 */
const getClientIP = (req) => {
  let ip = req.ip || req.ips?.[0];

  if (!ip) {
    ip = req.socket?.remoteAddress ||
         req.connection?.remoteAddress || 
         req.connection?.socket?.remoteAddress;
  }

  if (!ip) {
    return 'Unknown';
  }

  // Clean up the IP address
  // Remove IPv6 prefix (::ffff:) for IPv4-mapped IPv6 addresses
  ip = ip.replace(/^::ffff:/, '');
  
  // Convert IPv6 localhost to IPv4 localhost for readability
  if (ip === '::1') {
    ip = '127.0.0.1';
  }

  return ip;
};

export default getClientIP;
