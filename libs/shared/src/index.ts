export type Role = 'admin' | 'user';

export interface User {
  id: string;
  email: string;
  role: Role;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  stock: number;
}

export type ProductInput = Omit<Product, 'id'>;

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  items: OrderItem[];
  total: number;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface DashboardStats {
  totalRevenue: number;
  orderCount: number;
  lowStockProducts: Product[];
}

export interface ApiError {
  message: string;
}
