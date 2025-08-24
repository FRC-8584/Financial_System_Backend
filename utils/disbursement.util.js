import db from '../models/index.js'
import { validateTitle, validateAmount, validateDateFormat } from './validators.js';

const createDisbursement = async (
  title, amount, description,
  userId, settledAt, reimbursementId) =>
{
  const titleError = validateTitle(title);
  if(titleError) throw new Error(titleError);
  const amountError = validateAmount(amount);
  if(amountError) throw new Error(amountError);
  const timeError = validateDateFormat(settledAt);
  if(timeError) throw new Error(timeError);

  try {
    const [reimbursement, user] = await Promise.all([
      db.Reimbursement.findByPk(reimbursementId),
      db.User.findByPk(userId)
    ]);
    if (!reimbursement) throw new Error(`Reimbursement with ID ${reimbursementId} not found`);
    if (!user) throw new Error(`User ID ${userId} not found`);

    // Create a new disbursement
    const disbursement = await db.Disbursement.create({
      title: title.trim(),
      amount,
      description: description?.trim() || "",
      userId,
      settledAt,
      reimbursementId
    });

    return disbursement;
  } catch (err) {
    throw err;
  }
}

export default createDisbursement;