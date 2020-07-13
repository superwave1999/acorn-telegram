module.exports = (sequelize, DataTypes) => sequelize.define(
  'ListUser',
  {
    listId: DataTypes.BIGINT.UNSIGNED,
    userId: DataTypes.BIGINT.UNSIGNED,
    username: DataTypes.STRING,
    finished: DataTypes.BOOLEAN,
    notified: DataTypes.BOOLEAN,
  },
  {},
);
