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