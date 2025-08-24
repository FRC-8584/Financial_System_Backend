export default (sequelize, DataTypes) => {
  const Disbursement = sequelize.define('Disbursement', {
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
      allowNull: true
    },

    // Settled time stamp
    settledAt: {
      type: DataTypes.DATE,
      allowNull: false
    },

    // User association
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // Reimbursement association
    reimbursementId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    }
  });

  return Disbursement;
};