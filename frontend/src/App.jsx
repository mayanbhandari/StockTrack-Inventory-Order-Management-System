import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import CustomersPage from './pages/CustomersPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import InfoPage from './pages/InfoPage';

export default function App() {
  // Central route map for the whole single-page app.
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:orderId" element={<OrderDetailPage />} />
          <Route path="about" element={<InfoPage pageKey="about" />} />
          <Route path="contact" element={<InfoPage pageKey="contact" />} />
          <Route path="privacy" element={<InfoPage pageKey="privacy" />} />
          <Route path="terms" element={<InfoPage pageKey="terms" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
