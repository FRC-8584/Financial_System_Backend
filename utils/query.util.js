import { Op } from 'sequelize';
import { getDateRange, getTimeRange } from './time.util.js';

export function buildKeywordDateClause({ keyword, time, startDate, endDate }, searchableFields = []) {
  const where = {};

  // time
  if (time) {
    const range = getTimeRange(time);
    if (range) where.createdAt = { [Op.between]: [range.start, range.end] };
  }
  else if (startDate || endDate) {
    const range = getDateRange(startDate, endDate);
    if (range.start || range.end) {
      where.createdAt = {};
      if (range.start) where.createdAt[Op.gte] = range.start;
      if (range.end) where.createdAt[Op.lte] = range.end;
    }
  }

  // keyword
  if (keyword && searchableFields.length > 0) {
    where[Op.or] = searchableFields.map(field => ({
      [field]: { [Op.like]: `%${keyword}%` }
    }));
  }

  return where;
}

/**
 * build db search where clause
 * @param {Object} options
 * @param {string[]} options.fields
 * @param {string} [options.keyword] - keyword
 * @param {string} [options.startDate] - start date (format: yyyy-MM-dd or yyyy-MM or yyyy, UTC+8)
 * @param {string} [options.endDate] - end date (format: yyyy-MM-dd or yyyy-MM or yyyy, UTC+8)
 * @param {Object} [options.extra] - the other extra search requirements (status, amount...)
 * @returns {Object} Sequelize where clause
 */
export function buildReimbursementSearchClause({ fields, keyword, startDate, endDate }) {
  const where = {};

  // Keyword
  if (keyword && fields.length > 0) {
    where[Op.or] = fields.map(field => ({
      [field]: { [Op.like]: `%${keyword}%` }
    }));
  }

  // Time
  if (startDate || endDate) {
    const range = getDateRange(startDate, endDate);// get JSDate and convert UTC+8 to UTC+0
    if (range.start || range.end) {
      where.createdAt = {};
      if (range.start) where.createdAt[Op.gte] = range.start;
      if (range.end) where.createdAt[Op.lte] = range.end;
    }
  }

  // Extra Requirements
  if (extra && typeof extra === "object") {
    Object.assign(where, extra);
  }

  return where;
}