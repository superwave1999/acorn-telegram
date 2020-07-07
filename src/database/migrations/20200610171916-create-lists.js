module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('Lists', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.BIGINT.UNSIGNED,
    },
    creatorId: {
      allowNull: false,
      type: Sequelize.BIGINT.UNSIGNED, // Users are always positive
    },
    associateId: {
      allowNull: true,
      type: Sequelize.BIGINT.UNSIGNED, // Users are always positive
    },
    publicChatId: {
      allowNull: true,
      type: Sequelize.BIGINT, // Signed 64 (telegram docs)
    },
    publicMessageId: {
      allowNull: true,
      type: Sequelize.BIGINT.UNSIGNED, // Messages increment upwards
    },
    language: {
      allowNull: false,
      type: Sequelize.STRING(4),
    },
    island: {
      allowNull: true,
      type: Sequelize.STRING,
    },
    price: {
      allowNull: true,
      type: Sequelize.INTEGER(4),
    },
    notification: {
      allowNull: false,
      type: Sequelize.INTEGER(4),
      defaultValue: 4,
    },
    maxUsers: {
      allowNull: false,
      type: Sequelize.INTEGER(4),
      defaultValue: 50,
    },
    countUsers: {
      allowNull: true,
      type: Sequelize.INTEGER(4),
      defaultValue: 0,
    },
    state: {
      allowNull: false,
      type: Sequelize.INTEGER(1),
      defaultValue: 0,
    },
    isClosed: {
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
  down: (queryInterface) => queryInterface.dropTable('Lists'),
};
