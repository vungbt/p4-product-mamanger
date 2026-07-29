import type { Product, ProductInput } from '@p4/shared';
import { Router } from 'express';
import { createId, products } from '../data/store.js';
import type { AuthedRequest } from '../middleware/auth.js';
import { authRequired, requireRole } from '../middleware/auth.js';

const router = Router();

/** Public list — storefront & admin */
router.get('/', (_req, res) => {
  res.json(products);
});

router.get('/:id', (req, res) => {
  const product = products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  return res.json(product);
});

/** Admin only CRUD */
router.post('/', authRequired, requireRole('admin'), (req: AuthedRequest, res) => {
  const body = req.body as Partial<ProductInput>;
  if (!body.name || body.price == null || body.stock == null) {
    return res.status(400).json({ message: 'name, price, stock are required' });
  }
  const product: Product = {
    id: createId(),
    name: String(body.name),
    price: Number(body.price),
    description: String(body.description ?? ''),
    imageUrl: String(body.imageUrl ?? ''),
    stock: Number(body.stock),
  };
  products.push(product);
  return res.status(201).json(product);
});

router.put('/:id', authRequired, requireRole('admin'), (req: AuthedRequest, res) => {
  const index = products.findIndex((p) => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Product not found' });
  const body = req.body as Partial<ProductInput>;
  const current = products[index];
  products[index] = {
    ...current,
    name: body.name != null ? String(body.name) : current.name,
    price: body.price != null ? Number(body.price) : current.price,
    description: body.description != null ? String(body.description) : current.description,
    imageUrl: body.imageUrl != null ? String(body.imageUrl) : current.imageUrl,
    stock: body.stock != null ? Number(body.stock) : current.stock,
  };
  return res.json(products[index]);
});

router.delete('/:id', authRequired, requireRole('admin'), (req: AuthedRequest, res) => {
  const index = products.findIndex((p) => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Product not found' });
  const [removed] = products.splice(index, 1);
  return res.json(removed);
});

export default router;
