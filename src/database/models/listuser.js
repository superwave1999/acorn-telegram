module.exports = (sequelize, DataTypes) => sequelize.define(
  'ListUser',
  {
    listId: DataTypes.INTEGER,
    userId: DataTypes.INTEGER,
    username: DataTypes.STRING,
    finished: DataTypes.BOOLEAN,
  },
  {},
);
