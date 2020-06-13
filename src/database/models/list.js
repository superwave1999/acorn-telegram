module.exports = (sequelize, DataTypes) => {
  const List = sequelize.define(
    'List',
    {
      creatorId: DataTypes.INTEGER,
      associateId: DataTypes.INTEGER,
      publicChatId: DataTypes.INTEGER,
      language: DataTypes.STRING(4),
      island: DataTypes.STRING,
      price: DataTypes.INTEGER(4),
      maxUsers: DataTypes.INTEGER(4),
      countUsers: DataTypes.INTEGER(4),
      state: DataTypes.INTEGER(1),
      isClosed: DataTypes.BOOLEAN,
    },
    {},
  );
  List.associate = (models) => {
    List.hasMany(models.ListUser, {
      foreignKey: 'listId',
      onDelete: 'CASCADE',
    });
  };
  return List;
};