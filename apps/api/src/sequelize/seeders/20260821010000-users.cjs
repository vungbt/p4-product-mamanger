'use strict';

const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { data, now, uuid } = require('../seed-data.cjs');

const passwordHash = bcrypt.hashSync('password123', 10);
const avatarUsers = data.users.filter((user) => user.avatarId);

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert(
      'files',
      avatarUsers.map((user) => ({
        id: uuid(user.avatarId),
        url: user.avatarUrl,
        storage_id: `seed-${user.avatarId}`,
        provider: 'system',
        metadata: JSON.stringify({ seed: true, kind: 'avatar' }),
        created_at: now,
        updated_at: now,
      })),
      { ignoreDuplicates: true },
    );

    await queryInterface.bulkInsert(
      'users',
      data.users.map((user) => ({
        id: uuid(user.id),
        email: user.email,
        password_hash: user.hasPassword ? passwordHash : null,
        role: user.role,
        display_name: user.displayName,
        avatar_id: user.avatarId ? uuid(user.avatarId) : null,
        avatar_url: user.avatarUrl,
        created_at: now,
        updated_at: now,
      })),
      { ignoreDuplicates: true },
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', {
      id: { [Op.in]: data.users.map((user) => uuid(user.id)) },
    });
    await queryInterface.bulkDelete('files', {
      id: { [Op.in]: avatarUsers.map((user) => uuid(user.avatarId)) },
    });
  },
};
