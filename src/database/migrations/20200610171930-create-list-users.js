module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('ListUsers', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.BIGINT,
    },
    listId: {
      allowNull: false,
      type: Sequelize.BIGINT,
      onDelete: 'CASCADE',
      references: {
        model: 'Lists',
        key: 'id',
      },
    },
    userId: {
      allowNull: false,
      type: Sequelize.BIGINT,
    },
    username: {
      allowNull: false,
      type: Sequelize.STRING,
    },
    finished: {
      type: Sequelize.BOOLEAN,
      defaultValue: 0,
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
