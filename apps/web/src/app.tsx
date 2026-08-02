import { ApiQueryProvider, configureApiClient } from '@p4/api-client';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { API_BASE_URL } from '@/constants/constants';
import { AuthProvider } from '@/contexts/auth-context';
import RouteConfigs from '@/routing/config.route';
import MasterRoutes from '@/routing/master.route';
import 'react-toastify/dist/ReactToastify.css';

configureApiClient({ baseURL: API_BASE_URL });

export default function App() {
  return (
    <BrowserRouter>
      <ApiQueryProvider enableDevtools={import.meta.env.DEV}>
        <AuthProvider>
          <MasterRoutes routes={RouteConfigs} />
          <ToastContainer position="top-right" autoClose={3000} />
        </AuthProvider>
      </ApiQueryProvider>
    </BrowserRouter>
  );
}
