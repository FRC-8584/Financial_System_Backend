import { Sequelize, DataTypes } from 'sequelize';
import dbConfig from '../config/database.js';
import defineUser from './user.model.js';
import defineBudget from './budget.model.js';
import defineReimbursement from './reimbursement.model.js';
import defineDisbursement from './disbursement.model.js';

const sequelize = new Sequelize(dbConfig);

const db = {};
db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.User = defineUser(sequelize, DataTypes);
db.Budget = defineBudget(sequelize, DataTypes);
db.Reimbursement = defineReimbursement(sequelize, DataTypes);
db.Disbursement = defineDisbursement(sequelize, DataTypes);

db.User.hasMany(db.Budget, {foreignKey: 'userId', onDelete: 'SET NULL'});
db.Budget.belongsTo(db.User, {foreignKey: 'userId'});

db.User.hasMany(db.Reimbursement, {foreignKey: 'userId', onDelete: 'SET NULL'});
db.Reimbursement.belongsTo(db.User, {foreignKey: 'userId'});

db.User.hasMany(db.Disbursement, {foreignKey: 'userId', onDelete: 'SET NULL'});
db.Disbursement.belongsTo(db.User, {foreignKey: 'userId'});

db.Budget.hasMany(db.Reimbursement, { foreignKey: 'budgetId', onDelete: 'SET NULL' });
db.Reimbursement.belongsTo(db.Budget, { foreignKey: 'budgetId' });

db.Reimbursement.hasOne(db.Disbursement, { foreignKey: 'reimbursementId', onDelete: 'SET NULL' });
db.Disbursement.belongsTo(db.Reimbursement, { foreignKey: 'reimbursementId' });

export default db;