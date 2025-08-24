export default (sequelize, DataTypes) => {
  const Reimbursement = sequelize.define('Reimbursement', {
    // Basic info
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    // Receipt path
    receiptPath: {
      type: DataTypes.STRING,
      allowNull: false
    },

    // Payment states
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'settled'),
      defaultValue: 'pending'
    },

    // Settled time stamp
    settledAt: {
      type: DataTypes.DATE,
      allowNull: true
    },

    // Source info
    sourceType: {
      type: DataTypes.ENUM('budget', 'direct'),
      allowNull: false
    },
    budgetId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    // User association
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    }
  });

  return Reimbursement;
};