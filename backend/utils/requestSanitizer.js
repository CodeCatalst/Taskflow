const DANGEROUS_KEY_PATTERN = /(^\$)|\./;

const sanitizePrimitive = (value) => {
  if (typeof value === 'string') {
    return value.replace(/\u0000/g, '');
  }

  return value;
};

export const sanitizeForStorage = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForStorage(item));
  }

  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.entries(value).reduce((accumulator, [key, nestedValue]) => {
      if (DANGEROUS_KEY_PATTERN.test(key)) {
        return accumulator;
      }

      accumulator[key] = sanitizeForStorage(nestedValue);
      return accumulator;
    }, {});
  }

  return sanitizePrimitive(value);
};

export const sanitizeRequestInputs = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeForStorage(req.body);
  }

  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeForStorage(req.query);
  }

  next();
};
