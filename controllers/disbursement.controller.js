import db from '../models/index.js';
import ExcelJS from 'exceljs';
import { buildSearchClause_ForDisbursement } from '../utils/query.util.js';
import { formatAsTaiwanTime } from '../utils/time.util.js';

const getAllDisbursements = async (req, res) => {
  try {
  // Whereclause construction
  const whereClause = buildSearchClause_ForDisbursement(req.query, null);
  
    // Get data
    const disbursements = await db.Disbursement.findAll({
      where: whereClause,
      include: {
        model: db.User,
        attributes: ['id', 'name', 'email']
      },
      order: [['settledAt', 'DESC']]
    });

    // Transform data
    const result = disbursements.map(d => ({
      // Disbursement ID
      id: d.id,

      // Basic info
      title: d.title,
      amount: d.amount,
      description: d.description,

      // Time
      settledAt: formatAsTaiwanTime(d.settledAt),

      // Association
      reimbursementId: d.reimbursementId,

      // User info
      user: {
        id: d.User.id,
        name: d.User.name,
        email: d.User.email
      }
    }));

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch disbursements', error: err.message });
  }
}

const exportDisbursement = async (req, res) => {
  try {
    // Whereclause construction
    const whereClause = buildSearchClause_ForDisbursement(req.query, null);

    // Get data
    const disbursements = await db.Disbursement.findAll({
      where: whereClause,
      include: { model: db.User, attributes: ['name', 'email'] },
      order: [['createdAt', 'DESC']]
    });

    if(disbursements.length === 0) {
      return res.status(204).end();
    }

    // Build Excel worksheet
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Disbursements Record');

    sheet.columns = [
      { header: '報帳人', key: 'user', width: 15 },
      { header: '信箱', key: 'email', width: 25 },
      { header: '品項', key: 'title', width: 30 },
      { header: '金額', key: 'amount', width: 15 },
      { header: '備註', key: 'description', width: 30 },
      { header: '結清時間', key: 'settledAt', width: 20 }
    ];

    let total = 0;
    for (const d of disbursements) {
      total += d.amount;
      sheet.addRow({
        user: d.User.name,
        email: d.User.email,
        title: d.title,
        amount: d.amount,
        description: d.description ?? '',
        settledAt: formatAsTaiwanTime(d.settledAt)
      });
    }

    sheet.addRow({});
    sheet.addRow({
      title: '總金額',
      amount: total
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=request_records.xlsx`);

    // Export Data
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: 'Failed to export Excel', error: err.message });
  }
}

export default {
  getAllDisbursements,
  exportDisbursement
};