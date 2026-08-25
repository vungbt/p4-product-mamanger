'use strict';

const { Op } = require('sequelize');
const { data, date, uuid } = require('../seed-data.cjs');

const seenReviewPairs = new Set();
const reviews = data.reviews.filter((review) => {
  const pair = `${review.productId}:${review.userId}`;
  if (seenReviewPairs.has(pair)) return false;
  seenReviewPairs.add(pair);
  return true;
});

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert(
      'reviews',
      reviews.map((review) => ({
        id: uuid(review.id),
        product_id: review.productId,
        user_id: uuid(review.userId),
        rating: review.rating,
        comment: review.comment,
        created_at: date(review.createdAt),
        updated_at: date(review.createdAt),
      })),
      { ignoreDuplicates: true },
    );
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('reviews', {
      id: { [Op.in]: reviews.map((x) => uuid(x.id)) },
    });
  },
};
