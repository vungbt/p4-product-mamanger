import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from '@/contexts/auth-context';
import RouteConfigs from '@/routing/config.route';
import MasterRoutes from '@/routing/master.route';
import 'react-toastify/dist/ReactToastify.css';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MasterRoutes routes={RouteConfigs} />
        <ToastContainer position="top-right" autoClose={3000} />
      </AuthProvider>
    </BrowserRouter>
  );
}
