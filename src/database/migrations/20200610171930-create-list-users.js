module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('ListUsers', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.BIGINT.UNSIGNED,
    },
    listId: {
      allowNull: false,
      type: Sequelize.BIGINT.UNSIGNED,
      onDelete: 'CASCADE',
      references: {
        model: 'Lists',
        key: 'id',
      },
    },
    userId: {
      allowNull: false,
      type: Sequelize.BIGINT.UNSIGNED, // Users are always positive
    },
    username: {
      allowNull: false,
      type: Sequelize.STRING,
    },
    state: {
      allowNull: false,
      type: Sequelize.INTEGER(1),
      defaultValue: 0,
    },
    notified: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
  }),
  down: (queryInterface) => queryInterface.dropTable('ListUsers'),
};
