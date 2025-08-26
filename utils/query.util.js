import { Op } from 'sequelize';
import { getDateRange, getTimeRange } from './time.util.js';

const VALID_BUDGET_STATUS = ['pending', 'approved', 'rejected', 'settled'];
const VALID_REIMBURSEMENT_STATUS = ['pending', 'approved', 'rejected', 'settled'];
const VALID_REIMBURSEMENT_SOURCE_TYPES = ['budget', 'direct'];

const withField = (key, value) => (value ? { [key]: value } : {});

export function buildSearchClause_ByConditions({ fields, keyword, startDate, endDate }) {
  const searchClause = {};

  // Keyword
  if (keyword && fields.length > 0) {
    searchClause[Op.or] = fields.map(field => ({
      [field]: { [Op.like]: `%${keyword}%` }
    }));
  }

  // Time
  if (startDate || endDate) {
    const range = getDateRange(startDate, endDate);// get JSDate and convert UTC+8 to UTC+0
    if (range.start || range.end) {
      searchClause.createdAt = {};
      if (range.start) searchClause.createdAt[Op.gte] = range.start;
      if (range.end) searchClause.createdAt[Op.lte] = range.end;
    }
  }

  return searchClause;
}

export function buildSearchClause_ById(id, limit = 64) {
  if (!id) return {};
  const ids = Array.isArray(id) ? id : [id];
  if (ids.length > limit) {
    throw new Error(`Too many IDs in request (max ${limit})`);
  }
  return { id: ids };
}

export function buildSearchClause_ForBudget({ id, status, keyword, startDate, endDate }, myUserId) {
  // Validate
  if (status && !VALID_BUDGET_STATUS.includes(status)) {
    throw new Error("Invalid status filter");
  }

  let clause = {};
  
  if (id) { // Search by Ids
    clause = {
      ...buildSearchClause_ById(id),
      ...withField("userId", myUserId),
    };
  }
  else { // Search by some conditions
    clause = {
      ...buildSearchClause_ByConditions({ fields: ["title", "description"], keyword, startDate, endDate }),
      ...withField("status", status),
      ...withField("userId", myUserId)
    }
  }

  return clause;
}

export function buildSearchClause_ForReimbursement({ id, budgetId, status, sourceType, keyword, startDate, endDate }, myUserId) {
  // Validate
  if (status && !VALID_REIMBURSEMENT_STATUS.includes(status)) {
    throw new Error("Invalid status filter");
  }
  if (sourceType && !VALID_REIMBURSEMENT_SOURCE_TYPES.includes(sourceType)) {
    throw new Error("Invalid sourceType filter");
  }

  let clause = {};
  
  if (id || budgetId) { // Search by Ids or BudgetId
    clause = {
      ...buildSearchClause_ById(id),
      ...withField("budgetId", budgetId),
      ...withField("userId", myUserId),
    };
  }
  else { // Search by some conditions
    clause = {
      ...buildSearchClause_ByConditions({ fields: ["title", "description"], keyword, startDate, endDate }),
      ...withField("status", status),
      ...withField("sourceType", sourceType),
      ...withField("userId", myUserId)
    }
  }

  return clause;
}

export function buildSearchClause_ForDisbursement({ id, reimbursementId, keyword, startDate, endDate }, myUserId) {
  let clause = {};

  if (id || reimbursementId) { // Search by Ids or reimbursementId
    clause = {
      ...buildSearchClause_ById(id),
      ...withField("reimbursementId", reimbursementId),
      ...withField("userId", myUserId),
    };
  }
  else { // Search by some conditions
    clause = {
      ...buildSearchClause_ByConditions({ fields: ["title", "description"], keyword, startDate, endDate }),
      ...withField("userId", myUserId)
    }
  }

  return clause;
}