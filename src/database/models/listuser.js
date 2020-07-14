module.exports = (sequelize, DataTypes) => sequelize.define(
  'ListUser',
  {
    listId: DataTypes.BIGINT.UNSIGNED,
    userId: DataTypes.BIGINT.UNSIGNED,
    username: DataTypes.STRING,
    state: DataTypes.INTEGER(1),
    notified: DataTypes.BOOLEAN,
  },
  {},
);
