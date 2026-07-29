import { randomUUID } from 'node:crypto';
import type { Order, Product, User } from '@p4/shared';

export const users: User[] = [
  { id: '1', email: 'admin@demo.com', role: 'admin' },
  { id: '2', email: 'user@demo.com', role: 'user' },
];

export const passwords: Record<string, string> = {
  'admin@demo.com': 'admin123',
  'user@demo.com': 'user123',
};

export const products: Product[] = [
  {
    id: 'p1',
    name: 'Áo thun basic',
    price: 199000,
    description: 'Cotton 100%, form regular',
    imageUrl: 'https://placehold.co/400x400?text=Ao+Thun',
    stock: 50,
  },
  {
    id: 'p2',
    name: 'Quần jean slim',
    price: 449000,
    description: 'Jean co giãn nhẹ',
    imageUrl: 'https://placehold.co/400x400?text=Jean',
    stock: 8,
  },
  {
    id: 'p3',
    name: 'Giày sneaker',
    price: 899000,
    description: 'Đế cao su chống trượt',
    imageUrl: 'https://placehold.co/400x400?text=Sneaker',
    stock: 3,
  },
];

export const orders: Order[] = [];

/** token -> userId */
export const sessions = new Map<string, string>();

export const LOW_STOCK_THRESHOLD = 10;

export function findUserByEmail(email: string) {
  return users.find((u) => u.email === email);
}

export function createId() {
  return randomUUID();
}
