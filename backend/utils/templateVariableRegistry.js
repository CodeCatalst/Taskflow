/**
 * Template Variable Registry
 * Defines required and optional variables for each email template
 * Used for validation and UI auto-generation
 */

export const TEMPLATE_VARIABLE_REGISTRY = {
  // Existing templates
  WELCOME: {
    required: ['workspaceName', 'fullName', 'email', 'password', 'loginUrl', 'supportEmail', 'companyName'],
    optional: []
  },
  LEAVE_APPROVED: {
    required: ['workspaceName', 'fullName', 'leaveType', 'startDate', 'endDate', 'days', 'approvedBy', 'remainingDays', 'loginUrl', 'supportEmail'],
    optional: []
  },
  LEAVE_REJECTED: {
    required: ['workspaceName', 'fullName', 'leaveType', 'startDate', 'endDate', 'reason', 'loginUrl', 'supportEmail'],
    optional: []
  },
  ATTENDANCE_REMINDER: {
    required: ['workspaceName', 'fullName', 'date', 'loginUrl', 'supportEmail'],
    optional: []
  },
  EMPLOYEE_ACTIVATED: {
    required: ['workspaceName', 'fullName', 'loginUrl', 'supportEmail'],
    optional: []
  },
  EMPLOYEE_DEACTIVATED: {
    required: ['workspaceName', 'fullName', 'reason', 'supportEmail'],
    optional: []
  },

  // New HR templates from Email Drafts.docx
  HIRING_APPLIED: {
    required: ['candidateName', 'websiteUrl', 'discordUrl', 'linkedinUrl'],
    optional: []
  },
  CONTACT_ACK: {
    required: ['name', 'timeline', 'websiteUrl', 'discordUrl', 'linkedinUrl'],
    optional: []
  },
  INTERVIEW_ONLINE: {
    required: ['candidateName', 'date', 'time', 'meetLink', 'interviewers', 'hrName', 'designation'],
    optional: []
  },
  INTERVIEW_OFFLINE: {
    required: ['candidateName', 'date', 'time', 'venue', 'interviewers'],
    optional: []
  },
  INTERVIEW_RESCHEDULED: {
    required: ['candidateName', 'date', 'time', 'venue', 'interviewers'],
    optional: []
  },
  INTERVIEW_NO_SHOW: {
    required: ['name', 'whatsappUrl', 'discordUrl', 'instagramUrl', 'linkedinUrl'],
    optional: []
  },
  HIRED: {
    required: ['candidateName', 'domainName', 'discordLink', 'hrName', 'designation', 'linkedinPageUrl'],
    optional: []
  },
  NOT_HIRED: {
    required: ['candidateName', 'whatsappUrl', 'discordUrl', 'instagramUrl', 'linkedinUrl'],
    optional: []
  },
  INACTIVITY_WARNING: {
    required: ['candidateName', 'hrName', 'designation'],
    optional: []
  },
  SERVER_JOIN_REMINDER: {
    required: ['name', 'discordUrl', 'hrName', 'hrTeam'],
    optional: []
  },
  TEAM_CHOICE_INTERVIEWED: {
    required: ['studentName'],
    optional: []
  },
  TEAM_CHOICE_NOT_INTERVIEWED: {
    required: [],
    optional: []
  },
  RESIGNATION_ACK: {
    required: ['memberName', 'hrFullName', 'hrRole', 'supportEmail'],
    optional: []
  },
  TERMINATION_NOTICE: {
    required: ['memberName', 'currentDate', 'teamName', 'gameTitle', 'managementName', 'period'],
    optional: []
  },
  REJOIN_INVITE: {
    required: ['name'],
    optional: []
  }
};

/**
 * Get required variables for a template code
 * @param {string} templateCode - The template code
 * @returns {string[]} Array of required variable names
 */
export function getRequiredVariables(templateCode) {
  const registry = TEMPLATE_VARIABLE_REGISTRY[templateCode.toUpperCase()];
  return registry ? registry.required : [];
}

/**
 * Get optional variables for a template code
 * @param {string} templateCode - The template code
 * @returns {string[]} Array of optional variable names
 */
export function getOptionalVariables(templateCode) {
  const registry = TEMPLATE_VARIABLE_REGISTRY[templateCode.toUpperCase()];
  return registry ? registry.optional : [];
}

/**
 * Validate that all required variables are provided
 * @param {string} templateCode - The template code
 * @param {Object} variables - The provided variables
 * @returns {Object} { isValid: boolean, missing: string[] }
 */
export function validateTemplateVariables(templateCode, variables = {}) {
  const required = getRequiredVariables(templateCode);
  const provided = Object.keys(variables);
  const missing = required.filter(varName => !provided.includes(varName));

  return {
    isValid: missing.length === 0,
    missing
  };
}