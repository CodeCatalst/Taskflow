import mongoose from 'mongoose';

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

export const isValidObjectIdString = (value) =>
  typeof value === 'string' && OBJECT_ID_PATTERN.test(value) && mongoose.Types.ObjectId.isValid(value);

export const requireObjectId = (value, fieldName) => {
  if (!isValidObjectIdString(value)) {
    throw new Error(`Invalid ${fieldName}`);
  }

  return value;
};

export const normalizeObjectIdArray = (values, fieldName, { maxItems = 100 } = {}) => {
  if (!Array.isArray(values)) {
    throw new Error(`${fieldName} must be an array`);
  }

  if (values.length === 0) {
    throw new Error(`${fieldName} must not be empty`);
  }

  if (values.length > maxItems) {
    throw new Error(`${fieldName} exceeds the maximum allowed size of ${maxItems}`);
  }

  const normalized = [...new Set(values.map((value) => {
    if (!isValidObjectIdString(value)) {
      throw new Error(`Invalid ${fieldName} entry`);
    }

    return value;
  }))];

  return normalized;
};

export const normalizePlainText = (value, fieldName, { maxLength = 5000, allowEmpty = false } = {}) => {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }

  const normalized = value.trim();
  if (!allowEmpty && normalized.length === 0) {
    throw new Error(`${fieldName} is required`);
  }

  if (normalized.length > maxLength) {
    throw new Error(`${fieldName} exceeds the maximum length of ${maxLength}`);
  }

  return normalized;
};

export const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
