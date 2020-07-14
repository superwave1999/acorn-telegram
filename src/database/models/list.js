module.exports = (sequelize, DataTypes) => {
  const List = sequelize.define(
    'List',
    {
      creatorId: DataTypes.BIGINT.UNSIGNED,
      associateId: DataTypes.BIGINT.UNSIGNED,
      publicChatId: DataTypes.BIGINT,
      publicMessageId: DataTypes.BIGINT.UNSIGNED,
      language: DataTypes.STRING(5),
      island: DataTypes.STRING,
      price: DataTypes.INTEGER(4).UNSIGNED,
      notification: DataTypes.INTEGER(4).UNSIGNED,
      maxUsers: DataTypes.INTEGER(4).UNSIGNED,
      state: DataTypes.INTEGER(1).UNSIGNED,
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
