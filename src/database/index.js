const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const toType = require('../helpers/toType');

const basename = path.basename(__filename);
const db = {};
const modelPath = `${__dirname}/models`;

const connection = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: process.env.DB_DIALECT,
};

if (!toType(process.env.DB_LOGGING, false)) {
  connection.logging = false;
}

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  connection,
);

sequelize.authenticate().then(
  () => {
    process.stdout.write('Database connected\n');
  },
  () => {
    process.stdout.write('Database not connected, halting\n');
    process.exit(1);
  },
);

fs.readdirSync(modelPath)
  .filter((file) => file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js')
  .forEach((file) => {
    const model = sequelize.import(path.join(modelPath, file));
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
