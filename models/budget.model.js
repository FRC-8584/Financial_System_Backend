export default (sequelize, DataTypes) => {
  const Budget = sequelize.define('Budget', {
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

    // User association
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    }
  });

  return Budget;
}