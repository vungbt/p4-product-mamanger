'use strict';

const crypto = require('node:crypto');
const path = require('node:path');

const data = require(path.join(__dirname, 'seeders/ecommerce-seed-expanded-categories.json'));

const now = new Date('2026-08-01T00:00:00.000Z');

function uuid(value) {
  const hex = crypto.createHash('sha256').update(`p4-seed:${value}`).digest('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

function money(value) {
  return Math.round(Number(value) * 100);
}

function date(value, fallback = now) {
  return value ? new Date(value) : fallback;
}

module.exports = { data, date, money, now, uuid };
