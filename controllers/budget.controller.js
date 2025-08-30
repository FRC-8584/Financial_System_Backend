import db from '../models/index.js';
import { validateTitle, validateAmount } from '../utils/validators.js';
import { buildSearchClause_ForBudget } from '../utils/query.util.js';
import { formatAsTaiwanTime } from '../utils/time.util.js';

const validVarifyStatus = ['pending', 'approved', 'rejected'];
const validStatus = ['pending', 'approved', 'rejected', 'settled'];

const createBudget = async (req, res) => {
  const { title, amount, description } = req.body;

  // Basic validation
  const titleError = validateTitle(title);
  if (titleError) {
    return res.status(400).json({ message: titleError });
  }
  const amountError = validateAmount(amount);
  if (amountError) {
    return res.status(400).json({ message: amountError });
  }

  try {
    // Create a new budget
    const budget = await db.Budget.create({
      userId: req.user.id,
      title: title.trim(),
      amount,
      description: description ?? "",
      status: 'pending'
    });

    // Transform data
    const result = {
      id: budget.id,
      title: budget.title,
      amount: budget.amount,
      description: budget.description,
      status: budget.status,
      createdAt: formatAsTaiwanTime(budget.createdAt),
      updatedAt: formatAsTaiwanTime(budget.updatedAt),
    };
  
    res.status(201).json({ message: 'Budget created', result });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create budget', error: err.message });
  }
};

const getAllBudgets = async (req, res) => {
  try {
    // Whereclause construction
    const whereClause = buildSearchClause_ForBudget(req.query, null);

    // Get data
    const budgets = await db.Budget.findAll({
      where: whereClause,
      include: {
        model: db.User,
        attributes: ['id', 'name', 'email']
      },
      order: [['createdAt', 'DESC']]
    });

    // Check data exists (by ID search)
    if (req.query.id && budgets.length === 0) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    // Transform data
    const result = budgets.map(b => ({
      id: b.id,
      title: b.title,
      amount: b.amount,
      description: b.description,
      status: b.status,
      createdAt: formatAsTaiwanTime(b.createdAt),
      updatedAt: formatAsTaiwanTime(b.updatedAt),
      user: {
        id: b.User.id,
        name: b.User.name,
        email: b.User.email
      }
    }));
    
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch all budgets', error: err.message });
  }
};

const getMyBudgets = async (req, res) => {
  try {
    // Whereclause construction
    const whereClause = buildSearchClause_ForBudget(req.query, req.user.id);

    // Get data
    const budgets = await db.Budget.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });
  
    // Check data exists (by ID search)
    if (req.query.id && budgets.length === 0) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    // Transform data
    const result = budgets.map(b => ({
      id: b.id,
      title: b.title,
      amount: b.amount,
      description: b.description,
      status: b.status,
      createdAt: formatAsTaiwanTime(b.createdAt),
      updatedAt: formatAsTaiwanTime(b.updatedAt),
    }));

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch your budgets', error: err.message });
  }
};

const updateBudget = async (req, res) => {
  const { id } = req.params;
  const { title, amount, description } = req.body;
  
  try {
    // Check db data exists
    const budget = await db.Budget.findByPk(id, {
      include: {
        model: db.User,
        attributes: ['id', 'name', 'email']
      }
    });
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    // Check permission
    if(req.user.id === budget.userId) {// user him/herself
      if (budget.status === 'settled') {
        return res.status(400).json({ message: 'Cannot edit settled budget' });
      }
      if (budget.status === 'approved') {
        return res.status(400).json({ message: 'Cannot edit approved budget' });
      }
    }
    else if(req.user.role === 'manager' || req.user.role === 'admin') {// manager or admin
      if (budget.status === 'settled') {
        return res.status(400).json({ message: 'Cannot edit settled budget' });
      }
    }
    else {// the others
      return res.status(403).json({ message: 'Unauthorized to edit this budget' });
    }

    // Check update data
    const hasUpdate =
      title != null ||
      amount != null ||
      description != null;
    if (!hasUpdate) {
      return res.status(400).json({ message: 'Nothing to update' });
    }
    if(title?.trim() === '') {
      return res.status(400).json({ message: 'Title should not be empty' });
    }
    if(isNaN(amount)) {
      return res.status(400).json({ message: 'Amount should be a number' });
    }
    if(amount <= 0) {
      return res.status(400).json({ message: 'Amount should be greater than 0' });
    }

    // Update data
    await budget.update({
      title: title?.trim() ?? budget.title,
      amount: amount ?? budget.amount,
      description: description ?? budget.description,
      status: 'pending'
    });

    // Transform data
    const result = {
      id: budget.id,
      title: budget.title,
      amount: budget.amount,
      description: budget.description,
      status: budget.status,
      createdAt: formatAsTaiwanTime(budget.createdAt),
      updatedAt: formatAsTaiwanTime(budget.updatedAt),
      user: {
        id: budget.User.id,
        name: budget.User.name,
        email: budget.User.email
      }
    };

    res.status(200).json({ message: 'Budget updated', result });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update budget', error: err.message });
  }
};

const updateBudgetStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!validVarifyStatus.includes(status)) {
    return res.status(400).json({ message: 'Invalid varify status value' });
  }

  try {
    const budget = await db.Budget.findByPk(id);
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    if(budget.status === 'settled') {
      return res.status(400).json({ message: 'Budget is already settled' });
    }
    if(budget.status === 'approved') {
      return res.status(400).json({ message: 'Budget is already approved' });
    }

    await budget.update({ status });

    res.status(200).json({ message: 'Status updated', budget });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update status', error: err.message });
  }
};

const deleteBudget = async (req, res) => {
  const { id } = req.params;
  try {
    const budget = await db.Budget.findByPk(id);
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    // Check permission
    if(req.user.id === budget.userId) {// user him/herself
      if(budget.status === 'approved') {// Can deleted status type: pending, rejected, settled
        return res.status(405).json({ message: 'Cannot delete approved budget' });
      }
    }
    else if(req.user.role === 'manager' || req.user.role === 'admin') {// manager or admin
      if(budget.status !== 'settled') {// Can deleted status type: settled
        return res.status(405).json({ message: 'Cannot delete unsettled budget' });
      }
    }
    else {// the others
      return res.status(403).json({ message: 'Unauthorized to delete this budget' });
    }

    await budget.destroy();
    res.status(200).json({ message: 'Budget deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete budget', error: err.message });
  }
};

const markBudgetSettled = async (req, res) => {
  const { id } = req.params;

  try {
    const budget = await db.Budget.findByPk(id);
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    if (budget.status === 'settled') {
      return res.status(400).json({ message: 'Budget is already settled' });
    }

    if (budget.status !== 'approved') {
      return res.status(400).json({ message: 'Budget is not approved yet' });
    }

    await budget.update({ status: 'settled' });

    res.status(200).json({ message: 'Budget marked as settled' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark budget as settled', error: err.message });
  }
};

export default {
  createBudget,
  getAllBudgets,
  getMyBudgets,
  updateBudget,
  updateBudgetStatus,
  deleteBudget,
  markBudgetSettled
};