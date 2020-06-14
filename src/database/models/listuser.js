module.exports = (sequelize, DataTypes) => sequelize.define(
  'ListUser',
  {
    listId: DataTypes.BIGINT,
    userId: DataTypes.BIGINT,
    username: DataTypes.STRING,
    finished: DataTypes.BOOLEAN,
  },
  {},
);
