import { DateTime } from 'luxon';

// Valid format: string
export function validateTitle(title) {
  if (title == null) {
    return 'Title is required';
  }
  if (typeof title !== 'string' || title.trim() === '') {
    return 'Title should not be empty';
  }
  return null;
}

// Valid format: positive number
export function validateAmount(amount) {
  if (amount == null) {
    return 'Amount is required';
  }
  if (isNaN(amount)) {
    return 'Amount should be a number';
  }
  if (amount <= 0) {
    return 'Amount should be greater than 0';
  }
  return null;
}

// Valid format: yyyy-MM-dd
export function validateDateFormat(dateStr) {
  if (!dateStr) {
    return 'Date is required';
  }

  const date = DateTime.fromFormat(dateStr, 'yyyy-MM-dd');
  if (!date.isValid) {
    return 'Invalid date format or value (expected YYYY-MM-DD)';
  }
  return null;
}