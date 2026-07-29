import cors from 'cors';
import express from 'express';
import authRouter from './routes/auth.js';
import dashboardRouter from './routes/dashboard.js';
import ordersRouter from './routes/orders.js';
import productsRouter from './routes/products.js';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: '@p4/api' });
});

app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/dashboard', dashboardRouter);

app.use((_req, res) => {
  res.status(404).json({ message: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`@p4/api listening on http://localhost:${PORT}`);
});
