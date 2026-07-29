import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ROUTES } from '@/constants/constants';
import useAuth from '@/hooks/use-auth';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      await login(username, password, 'admin');
      toast.success('Đăng nhập admin thành công');
      navigate(ROUTES.admin.dashboard, { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 360, margin: '48px auto', padding: 24 }}>
      <h1>Admin Login</h1>
      <p>
        Demo: <code>admin / admin</code>
      </p>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>
            Username
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ display: 'block', width: '100%', marginTop: 4 }}
            />
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ display: 'block', width: '100%', marginTop: 4 }}
            />
          </label>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Đang đăng nhập...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
