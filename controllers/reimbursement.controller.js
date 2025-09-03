import db from '../models/index.js';
import ExcelJS from 'exceljs';
import path from 'path';
import { DateTime } from 'luxon';
import { validateTitle, validateAmount } from '../utils/validators.js';
import { buildSearchClause_ForReimbursement } from '../utils/query.util.js';
import { formatAsTaiwanTime } from '../utils/time.util.js';
import { deleteFileIfExists } from '../utils/file.util.js';

const BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:3000';

const validVerifyStatus = ['pending', 'approved', 'rejected'];
const validStatus = ['pending', 'approved', 'rejected', 'settled'];
const validSourceType = ['budget', 'direct']

const createReimbursement = async (req, res) => {
  const { title, amount, description, budgetId } = req.body;

  try {
    // Link budget (if budgetId != null)
    let fromBudget = false;
    if (budgetId) {
      const budget = await db.Budget.findByPk(budgetId);
      if (!budget) {
        return res.status(404).json({ message: 'Linked budget not found' });
      }
      if (budget.status !== 'approved') {
        return res.status(400).json({ message: 'Linked budget must be approved' });
      }
      fromBudget = true;
    }

    // Basic validation
    if (!req.file) {
      return res.status(400).json({ message: 'Receipt image is required' });
    }
    const receiptPath = req.file.path;

    const titleError = validateTitle(title);
    if (titleError) {
      await deleteFileIfExists(receiptPath);
      return res.status(400).json({ message: titleError });
    }

    const amountError = validateAmount(amount);
    if (amountError) {
      await deleteFileIfExists(receiptPath);
      return res.status(400).json({ message: amountError });
    }

    // Create a new reimbursement
    const reimbursement = await db.Reimbursement.create({
      title: title.trim(),
      amount,
      description: description ?? "",
      receiptPath,
      userId: req.user.id,
      status: 'pending',
      // Budget info
      sourceType: fromBudget? 'budget': 'direct',
      budgetId: budgetId || null
    });

    // Transform data
    const result = {
      id: reimbursement.id,
      title: reimbursement.title,
      amount: reimbursement.amount,
      description: reimbursement.description,
      status: reimbursement.status,
      createdAt: formatAsTaiwanTime(reimbursement.createdAt),
      updatedAt: formatAsTaiwanTime(reimbursement.updatedAt),
      sourceType: reimbursement.sourceType,
      budgetId: reimbursement.budgetId || null,
    };

    res.status(201).json({ message: 'Reimbursement created', result });
  } catch (err) {
    await deleteFileIfExists(receiptPath);
    res.status(500).json({ message: 'Failed to create reimbursement', error: err.message });
  }
};

const getAllReimbursements = async (req, res) => {
  try {
    // Whereclause construction
    const whereClause = buildSearchClause_ForReimbursement(req.query, null);

    // Get data
    const reimbursements = await db.Reimbursement.findAll({
      where: whereClause,
      include: {
        model: db.User,
        attributes: ['id', 'name', 'email']
      },
      order: [['createdAt', 'DESC']]
    });

    // Check data exists (by ID search)
    if (req.query.id && reimbursements.length === 0) {
      return res.status(404).json({ message: 'Reimbursement not found' });
    }

    // Transform data
    const result = reimbursements.map(r => ({
      id: r.id,
      title: r.title,
      amount: r.amount,
      description: r.description,
      createdAt: formatAsTaiwanTime(r.createdAt),
      updatedAt: formatAsTaiwanTime(r.updatedAt),
      receiptUrl: r.receiptPath 
        ? `${BASE_URL}/uploads/${path.basename(r.receiptPath)}` : null,
      sourceType: r.sourceType,
      budgetId: r.budgetId || null,
      user: {
        id: r.User.id,
        name: r.User.name,
        email: r.User.email
      },
      status: r.status,
    }));

    res.status(200).json(result);
  } catch (err) {
    if (err.message.includes('Too many IDs') || err.message.includes('Invalid')) {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Failed to fetch reimbursements', error: err.message });
  }
};

const getMyReimbursements = async (req, res) => {
  try {
    // Whereclause construction
    const whereClause = buildSearchClause_ForReimbursement(req.query, req.user.id);

    // Get data
    const reimbursements = await db.Reimbursement.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });

    // Check data exists (by ID search)
    if (req.query.id && reimbursements.length === 0) {
      return res.status(404).json({ message: 'Reimbursement not found' });
    }

    // Transform data
    const result = reimbursements.map(r => ({
      id: r.id,
      title: r.title,
      amount: r.amount,
      description: r.description,
      createdAt: formatAsTaiwanTime(r.createdAt),
      updatedAt: formatAsTaiwanTime(r.updatedAt),
      receiptUrl: r.receiptPath 
        ? `${BASE_URL}/uploads/${path.basename(r.receiptPath)}` : null,
      sourceType: r.sourceType,
      budgetId: r.budgetId || null,
      status: r.status,
    }));

    res.status(200).json(result);
  } catch (err) {
    if (err.message.includes('Too many IDs') || err.message.includes('Invalid')) {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Failed to fetch reimbursements', error: err.message });
  }
};

const updateReimbursement = async (req, res) => {
  const { id } = req.params;
  const { title, amount, description } = req.body;
  const file = req.file;

  try {
    // Check db data exists
    const reimbursement = await db.Reimbursement.findByPk(id, {
      include: {
        model: db.User,
        attributes: ['id', 'name', 'email']
      }
    });
    if(!reimbursement) {
      await deleteFileIfExists(file.path);
      return res.status(404).json({ message: 'Reimbursement not found' });
    }

    // Check permission
    if(req.user.id === reimbursement.userId) {// user him/herself
      if(reimbursement.status === 'settled') {
        await deleteFileIfExists(file.path);
        return res.status(409).json({ message: 'Cannot edit settled reimbursement' });
      }
      if(reimbursement.status === 'approved') {
        await deleteFileIfExists(file.path);
        return res.status(409).json({ message: 'Cannot edit approved reimbursement' });
      }
    }
    else if(req.user.role === 'manager' || req.user.role === 'admin') {// manager or admin
      if(reimbursement.status === 'settled') {
        await deleteFileIfExists(file.path);
        return res.status(409).json({ message: 'Cannot edit settled reimbursement' });
      }
    }
    else {// the others
      await deleteFileIfExists(file.path);
      return res.status(403).json({ message: 'Unauthorized to edit this reimbursement' });
    }

    // Check update data
    const hasUpdate = 
      title != null ||
      amount != null ||
      description != null ||
      file != null;
    if (!hasUpdate) {
      return res.status(400).json({ message: 'Nothing to update' });
    }
    if(!title?.trim()) {
      await deleteFileIfExists(file.path);
      return res.status(400).json({ message: 'Title should not be empty' });
    }
    if(isNaN(amount)) {
      await deleteFileIfExists(file.path);
      return res.status(400).json({ message: 'Amount should be a number' });
    }
    if(amount <= 0) {
      await deleteFileIfExists(file.path);
      return res.status(400).json({ message: 'Amount should be greater than 0' });
    }

    // Update data
    let update = {
      title: title?.trim() ?? reimbursement.title,
      amount: amount ?? reimbursement.amount,
      description: description ?? reimbursement.description,
      status: 'pending'
    };
    if (file) {
      deleteFileIfExists(reimbursement.receiptPath);
      update.receiptPath = file.path;
    }
    await reimbursement.update(update);

    // Transform data
    let result = {
      id: reimbursement.id,
      title: reimbursement.title,
      amount: reimbursement.amount,
      description: reimbursement.description,
      createdAt: formatAsTaiwanTime(reimbursement.createdAt),
      updatedAt: formatAsTaiwanTime(reimbursement.updatedAt),
      receiptUrl: reimbursement.receiptPath 
        ? `${BASE_URL}/uploads/${path.basename(reimbursement.receiptPath)}` : null,
      sourceType: reimbursement.sourceType,
      budgetId: reimbursement.budgetId || null,
      status: reimbursement.status,
    };

    if(!(req.user.id === reimbursement.userId)) {
      result.user = {
        id: reimbursement.User.id,
        name: reimbursement.User.name,
        email: reimbursement.User.email
      }
    }

    res.status(200).json({ message: 'Reimbursement updated', result });
  }catch (err) {
    res.status(500).json({ message: 'Failed to update reimbursement', error: err.message });
  }
};

const updateReimbursementStatus = async (req, res) => {
  const { id } = req.params;
  if(!id) {
    return res.status(400).json({ message: 'ID is required' });
  }
  if(isNaN(id)) {
    return res.status(400).json({ message: 'ID should be a positive interger' });
  }

  const { status } = req.body;
  if(!status) {
    return res.status(400).json({ message: 'Status is required' });
  }
  if(!validVerifyStatus.includes(status)) {
    return res.status(400).json({ message: 'Invalid varify status value' });
  }

  try {
    const reimbursement = await db.Reimbursement.findByPk(id,{
      include: {
        model: db.User,
        attributes: ['id', 'name', 'email']
      }
    });
    if(!reimbursement) {
      return res.status(404).json({ message: 'Reimbursement not found' });
    }

    if(reimbursement.status === 'settled') {
      return res.status(409).json({ message: 'Reimbursement is already settled' });
    }
    if(reimbursement.status === 'approved') {
      return res.status(409).json({ message: 'Reimbursement is already approved' });
    }

    await reimbursement.update({ status });

    const result = {
      id: reimbursement.id,
      title: reimbursement.title,
      amount: reimbursement.amount,
      description: reimbursement.description,
      status: reimbursement.status,
      sourceType: reimbursement.sourceType,
      createdAt: formatAsTaiwanTime(reimbursement.createdAt),
      updatedAt: formatAsTaiwanTime(reimbursement.updatedAt),
      budgetId: reimbursement.budgetId || null,
      user: {
        id: reimbursement.User.id,
        name: reimbursement.User.name,
        email: reimbursement.User.email
      }
    };

    res.status(200).json({ message: 'Status updated', result });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update status', error: err.message });
  }
};

const deleteReimbursement = async (req, res) => {
  const { id } = req.params;
  try {
    const reimbursement = await db.Reimbursement.findByPk(id);
    if(!reimbursement) {
      return res.status(404).json({ message: 'Reimbursement not found' });
    }

    // Check permission
    if(req.user.id === reimbursement.userId) {// user him/herself
      if(reimbursement.status === 'approved') {// Can deleted status type: pending, rejected, settled
        return res.status(405).json({ message: 'Cannot delete approved reimbursement' });
      }
    }
    else if(req.user.role === 'manager' || req.user.role === 'admin') {// manager or admin
      if(reimbursement.status !== 'settled') {// Can deleted status type: settled
        return res.status(405).json({ message: 'Cannot delete unsettled reimbursement' });
      }
    }
    else {// the others
      return res.status(403).json({ message: 'Unauthorized to delete this reimbursement' });
    }

    await deleteFileIfExists(reimbursement.receiptPath);
    await reimbursement.destroy();
    res.status(200).json({ message: 'Reimbursement deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete reimbursement', error: err.message });
  }
};

const exportReimbursementsRequest = async (req, res) => {
  const { id, keyword, startDate, endDate } = req.query;
  try {
    let whereClause = {};

    if (id) {// Search by Ids
      const idList = Array.isArray(id) ? id : [id];
      if (idList.length > 64) {
        return res.status(400).json({ message: "Maximum 64 reimbursements can be selected by id" });
      }
      whereClause = {
        id: idList,
        status: 'approved',
        sourceType: 'direct',
        budgetId: null
      };
    }
    else {// Search by some conditions
      whereClause = buildSearchClause_ForReimbursement(
        {
          keyword,
          startDate,
          endDate,
          status: 'approved',
          sourceType: 'direct',
          budgetId: null,
        },
        null
      );
    }

    const reimbursements = await db.Reimbursement.findAll({
      where: whereClause,
      include: { model: db.User, attributes: ['name', 'email'] },
      order: [['createdAt', 'DESC']]
    });

    if(reimbursements.length === 0) {
      return res.status(204).end();
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Reimbursements Request');

    sheet.columns = [
      { header: '報帳人', key: 'user', width: 15 },
      { header: '信箱', key: 'email', width: 25 },
      { header: '品項', key: 'title', width: 30 },
      { header: '金額', key: 'amount', width: 15 },
      { header: '備註', key: 'description', width: 30 },
      { header: '報帳時間', key: 'createdAt', width: 20 }
    ];

    let total = 0;
    for (const r of reimbursements) {
      total += r.amount;
      sheet.addRow({
        user: r.User.name,
        email: r.User.email,
        title: r.title,
        amount: r.amount,
        description: r.description ?? '',
        createdAt: formatAsTaiwanTime(r.createdAt)
      });
    }

    sheet.addRow({});
    sheet.addRow({
      title: '總金額',
      amount: total
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=reimbursement_request.xlsx`);

    await workbook.xlsx.write(res);
  } catch (err) {
    res.status(500).json({ message: 'Failed to export Excel', error: err.message });
  }
};

const markReimbursementSettled = async (req, res) => {
  const { id } = req.params;

  try {
    const reimbursement = await db.Reimbursement.findByPk(id);
    if(!reimbursement) {
      return res.status(404).json({ message: 'Reimbursement not found' });
    }

    if(reimbursement.status === 'settled') {
      return res.status(409).json({ message: 'Reimbursement is already settled' });
    }

    if(reimbursement.status !== 'approved') {
      return res.status(409).json({ message: 'Reimbursement is not approved yet' });
    }


    await db.Disbursement.create({
      title: reimbursement.title,
      amount: reimbursement.amount,
      description: reimbursement.description,
      userId: reimbursement.userId,
      settledAt: DateTime.now().toISO(),
      reimbursementId: id
    });

    await reimbursement.update({ status: 'settled' });

    res.status(200).json({ message: 'Reimbursement marked as settled, disbursement created' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark reimbursement as settled', error: err.message });
  }
};

const markReimbursementsSettled = async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'Invalid reimbursement IDs' });
  }

  if (ids.length > 50) {
    return res.status(400).json({ message: 'Too much IDs (expect less than 50)' });
  }

  try {
    const reimbursements = await db.Reimbursement.findAll({
      where: { id: ids }
    });

    const foundIds = new Set(reimbursements.map(r => r.id));
    const approved = [];
    const skipped = [];

    for (const id of ids) {
      if (!foundIds.has(id)) {
        skipped.push({ id, reason: 'Reimbursement not found' });
      }
    }

    for (const r of reimbursements) {
      if (r.status === 'settled') {
        skipped.push({ id: r.id, reason: 'Already settled' });
      }
      else if (r.status !== 'approved') {
        skipped.push({ id: r.id, reason: 'Not approved yet' });
      }
      else {
        approved.push(r);
      }
    }

    if (approved.length > 0) {
      await db.Reimbursement.update(
        { status: 'settled' },
        { where: { id: approved.map(r => r.id) } }
      );

      const disbursements = approved.map(r => ({
        title: r.title,
        amount: r.amount,
        description: r.description,
        userId: r.userId,
        settledAt: DateTime.now().toISO(),
        reimbursementId: r.id
      }));

      await db.Disbursement.bulkCreate(disbursements);
    }

    res.status(200).json({ message: 'Reimbursements processed', updated: approved.map(r => r.id), skipped });
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark reimbursements as settled', error: err.message });
  }
};

export default {
  createReimbursement,
  getAllReimbursements,
  getMyReimbursements,
  updateReimbursement,
  updateReimbursementStatus,
  deleteReimbursement,
  exportReimbursementsRequest,
  markReimbursementSettled,
  markReimbursementsSettled
};