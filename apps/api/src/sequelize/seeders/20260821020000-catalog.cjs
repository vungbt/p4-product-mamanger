'use strict';

const { Op } = require('sequelize');
const { data, money, now, uuid } = require('../seed-data.cjs');

const productFiles = new Map();
for (const product of data.products) {
  for (const image of product.images) {
    productFiles.set(image.fileId, image.url);
  }
}

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert(
      'categories',
      data.categories.map((category) => ({
        id: uuid(category.id),
        name: category.name,
        slug: category.slug,
        description: category.description,
        created_at: now,
        updated_at: now,
      })),
      { ignoreDuplicates: true },
    );

    await queryInterface.bulkInsert(
      'files',
      [...productFiles].map(([id, url]) => ({
        id: uuid(id),
        url,
        storage_id: `seed-${id}`,
        provider: 'system',
        metadata: JSON.stringify({ seed: true, kind: 'product' }),
        created_at: now,
        updated_at: now,
      })),
      { ignoreDuplicates: true },
    );

    await queryInterface.bulkInsert(
      'products',
      data.products.map((product) => ({
        id: product.id,
        name: product.name,
        price: money(product.price),
        description: product.description,
        image_id: product.imageId ? uuid(product.imageId) : null,
        stock: product.stock,
        category_id: uuid(product.categoryId),
        created_at: now,
        updated_at: now,
      })),
      { ignoreDuplicates: true },
    );

    await queryInterface.bulkInsert(
      'product_images',
      data.products.flatMap((product) =>
        product.images.map((image) => ({
          id: uuid(image.id),
          product_id: product.id,
          file_id: uuid(image.fileId),
          sort_order: image.sortOrder,
          created_at: now,
          updated_at: now,
        })),
      ),
      { ignoreDuplicates: true },
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('product_images', {
      id: { [Op.in]: data.products.flatMap((p) => p.images.map((i) => uuid(i.id))) },
    });
    await queryInterface.bulkDelete('products', {
      id: { [Op.in]: data.products.map((product) => product.id) },
    });
    await queryInterface.bulkDelete('files', {
      id: { [Op.in]: [...productFiles.keys()].map(uuid) },
    });
    await queryInterface.bulkDelete('categories', {
      id: { [Op.in]: data.categories.map((category) => uuid(category.id)) },
    });
  },
};
