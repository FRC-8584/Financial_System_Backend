export default (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      unique: {
        name: 'email',
        msg: 'Email already exists'
      },
      allowNull: false,
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('member', 'manager', 'admin'),
      defaultValue: 'member',
    },
  });

  return User;
};