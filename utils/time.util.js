import { DateTime } from 'luxon';

// yyyy, yyyy-MM, yyyy-MM-dd
export function getTimeRange(time) {
  let dt = DateTime.fromISO(time, { zone: 'Asia/Taipei' });

  if (!dt.isValid) {
    // yyyy
    dt = DateTime.fromFormat(time, 'yyyy', { zone: 'Asia/Taipei' });
    if (!dt.isValid) return null;
    return {
      start: dt.startOf('year').toUTC().toJSDate(),
      end: dt.endOf('year').toUTC().toJSDate()
    };
  }

  // yyyy-MM-dd (length = 10)
  if (time.length === 10) {
    return {
      start: dt.startOf('day').toUTC().toJSDate(),
      end: dt.endOf('day').toUTC().toJSDate()
    };
  }

  // yyyy-MM (length = 7)
  if (time.length === 7) {
    return {
      start: dt.startOf('month').toUTC().toJSDate(),
      end: dt.endOf('month').toUTC().toJSDate()
    };
  }

  return null;
}

// yyyy-mm-dd
export function getDateRange(startDate, endDate) {
  const range = {};
  if (startDate) {
    const dt = DateTime.fromISO(startDate, { zone: 'Asia/Taipei' });
    if (dt.isValid) range.start = dt.startOf('day').toUTC().toJSDate();
  }
  if (endDate) {
    const dt = DateTime.fromISO(endDate, { zone: 'Asia/Taipei' });
    if (dt.isValid) range.end = dt.endOf('day').toUTC().toJSDate();
  }
  return range;
}

export function convertTaiwanToUTC(dateStr, isEnd = false) {
  const dt = DateTime.fromISO(dateStr, { zone: 'Asia/Taipei' });
  if (!dt.isValid) return null;
  const result = isEnd ? dt.endOf('day') : dt.startOf('day');
  return result.toUTC().toJSDate();
}

export function formatAsTaiwanTime(date, format = 'yyyy-MM-dd HH:mm:ss') {
  return DateTime.fromJSDate(date, { zone: 'UTC' })
    .setZone('Asia/Taipei')
    .toFormat(format);
}