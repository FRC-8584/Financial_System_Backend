import db from '../models/index.js';

const getAllDisbursements = async (req, res) => {
  const { keyword, time, startDate, endDate } = req.query;

  // Whereclause construction
  const whereClause = buildKeywordDateClause(
    { keyword, time, startDate, endDate },
    ['title', 'description']
  );
  
  try {
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
        id: r.User.id,
        name: r.User.name,
        email: r.User.email
      }
    }));

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch disbursements', error: err.message });
  }
}

const exportDisbursement = async (req, res) => {
  const { keyword, time, startDate, endDate } = req.query;

  // Whereclause construction
  const whereClause = buildKeywordDateClause(
      { keyword, time, startDate, endDate },
      ['title', 'description']
    );

  try {
    // Get data
    const disbursements = await db.Disbursement.findAll({
      where: whereClause,
      include: { model: db.User, attributes: ['name', 'email'] },
      order: [['createdAt', 'DESC']]
    });

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

    const text = time ? `_${time}` : '';
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=報帳紀錄${text}.xlsx`);

    // Export Data
    res.status(200);
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