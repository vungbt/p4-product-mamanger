'use strict';

const bcrypt = require('bcryptjs');
const { randomUUID } = require('node:crypto');

const products = [
  {
    id: 'p1',
    name: 'Áo thun basic',
    price: 199000,
    description: 'Cotton 100%, form regular',
    image_url: 'https://placehold.co/400x400?text=Ao+Thun',
    stock: 50,
  },
  {
    id: 'p2',
    name: 'Quần jean slim',
    price: 449000,
    description: 'Jean co giãn nhẹ',
    image_url: 'https://placehold.co/400x400?text=Jean',
    stock: 8,
  },
  {
    id: 'p3',
    name: 'Giày sneaker',
    price: 899000,
    description: 'Đế cao su chống trượt',
    image_url: 'https://placehold.co/400x400?text=Sneaker',
    stock: 3,
  },
  {
    id: 'p4',
    name: 'Áo khoác gió',
    price: 599000,
    description: 'Chống nước nhẹ, có mũ',
    image_url: 'https://placehold.co/400x400?text=Ao+Khoac',
    stock: 20,
  },
  {
    id: 'p5',
    name: 'Mũ lưỡi trai',
    price: 149000,
    description: 'Cotton twill',
    image_url: 'https://placehold.co/400x400?text=Mu',
    stock: 40,
  },
  {
    id: 'p6',
    name: 'Balo laptop',
    price: 750000,
    description: 'Ngăn 15 inch, chống sốc',
    image_url: 'https://placehold.co/400x400?text=Balo',
    stock: 12,
  },
  {
    id: 'p7',
    name: 'Tất thể thao',
    price: 79000,
    description: 'Pack 3 đôi',
    image_url: 'https://placehold.co/400x400?text=Tat',
    stock: 100,
  },
  {
    id: 'p8',
    name: 'Áo hoodie',
    price: 399000,
    description: 'Nỉ dày, unisex',
    image_url: 'https://placehold.co/400x400?text=Hoodie',
    stock: 5,
  },
  {
    id: 'p9',
    name: 'Dép slide',
    price: 229000,
    description: 'Đế EVA nhẹ',
    image_url: 'https://placehold.co/400x400?text=Dep',
    stock: 25,
  },
  {
    id: 'p10',
    name: 'Túi tote canvas',
    price: 189000,
    description: 'In logo, dung tích lớn',
    image_url: 'https://placehold.co/400x400?text=Tote',
    stock: 15,
  },
  {
    id: 'p11',
    name: 'Thắt lưng da',
    price: 320000,
    description: 'Da thật, khóa kim',
    image_url: 'https://placehold.co/400x400?text=That+Lung',
    stock: 9,
  },
  {
    id: 'p12',
    name: 'Khăn choàng',
    price: 259000,
    description: 'Len merino',
    image_url: 'https://placehold.co/400x400?text=Khan',
    stock: 18,
  },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const adminId = randomUUID();
    const userId = randomUUID();

    await queryInterface.bulkInsert('users', [
      {
        id: adminId,
        email: 'admin@demo.com',
        password_hash: bcrypt.hashSync('admin123', 10),
        role: 'admin',
        created_at: now,
        updated_at: now,
      },
      {
        id: userId,
        email: 'user@demo.com',
        password_hash: bcrypt.hashSync('user123', 10),
        role: 'user',
        created_at: now,
        updated_at: now,
      },
    ]);

    const fileRows = products.map((p) => {
      const fileId = randomUUID();
      return {
        id: fileId,
        url: p.image_url,
        storage_id: `system-${fileId}`,
        provider: 'system',
        metadata: null,
        created_at: now,
        updated_at: now,
        product_id: p.id,
      };
    });

    await queryInterface.bulkInsert(
      'files',
      fileRows.map(({ product_id: _productId, ...file }) => file),
    );

    await queryInterface.bulkInsert(
      'products',
      products.map((p, index) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        description: p.description,
        image_id: fileRows[index].id,
        stock: p.stock,
        created_at: now,
        updated_at: now,
      })),
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('products', null, {});
    await queryInterface.bulkDelete('files', null, {});
    await queryInterface.bulkDelete('users', null, {});
  },
};
