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

export const sanitizeUser = (user) => {
  if (!user) return null;
  const u = user.toObject ? user.toObject() : user;

  const { password_hash, __v, ...rest } = u;
  return {
    ...rest,
    _id: u._id?.toString(),
    team_id: u.team_id?._id?.toString() || u.team_id?.toString() || u.team_id,
    teams: u.teams ? u.teams.map(t => t._id?.toString() || t.toString()) : u.teams,
  };
};

export const sanitizeTeam = (team) => {
  if (!team) return null;
  const t = team.toObject ? team.toObject() : team;

  const { __v, ...rest } = t;
  return {
    ...rest,
    _id: t._id?.toString(),
    hr_id: t.hr_id?._id?.toString() || t.hr_id?.toString() || t.hr_id,
    lead_id: t.lead_id?._id?.toString() || t.lead_id?.toString() || t.lead_id,
    members: t.members ? t.members.map(m => m._id?.toString() || m.toString()) : t.members,
  };
};
