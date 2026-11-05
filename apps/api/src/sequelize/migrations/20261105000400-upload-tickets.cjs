module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('upload_tickets', {
      id: { type: Sequelize.UUID, primaryKey: true },
      owner_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      purpose: { type: Sequelize.STRING(30), allowNull: false },
      resource_id: { type: Sequelize.STRING, allowNull: true },
      storage_id: { type: Sequelize.STRING, allowNull: false, unique: true },
      status: { type: Sequelize.STRING(20), allowNull: false },
      private: { type: Sequelize.BOOLEAN, allowNull: false },
      max_bytes: { type: Sequelize.INTEGER, allowNull: false },
      expires_at: { type: Sequelize.DATE, allowNull: false },
      file_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'files', key: 'id' } },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('upload_tickets', ['owner_id', 'created_at']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('upload_tickets');
  },
};
