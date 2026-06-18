import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { orderApi } from '../services/api';
import { formatCurrency } from '../utils/currency';
import { formatIstDateTime } from '../utils/datetime';
import AlertBanner from '../components/AlertBanner';
import LoadingSpinner from '../components/LoadingSpinner';

export default function OrderDetailPage() {
  // Detail page fetches one order from the route ID.
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Avoid setting state if the user leaves before the request finishes.
    let mounted = true;

    async function fetchOrder() {
      try {
        const data = await orderApi.getOne(orderId);
        if (mounted) setOrder(data);
      } catch (err) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchOrder();
    return () => {
      mounted = false;
    };
  }, [orderId]);

  if (loading) return <LoadingSpinner label="Loading order details…" />;

  return (
    <div>
      <header className="page-header">
        <Link to="/orders" className="btn btn-ghost btn-sm" style={{ marginBottom: '0.75rem' }}>
          ← Back to Orders
        </Link>
        <h1>Order #{orderId}</h1>
        <p>Full breakdown of this order.</p>
      </header>

      <AlertBanner message={error} />

      {order && (
        <>
          <section className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="table-wrap">
              <table>
                <tbody>
                  <tr>
                    <th>Customer</th>
                    <td>{order.customer_name}</td>
                  </tr>
                  <tr>
                    <th>Status</th>
                    <td>{order.status}</td>
                  </tr>
                  <tr>
                    <th>Placed On</th>
                    <td>{formatIstDateTime(order.created_at)}</td>
                  </tr>
                  <tr>
                    <th>Total Amount</th>
                    <td><strong>{formatCurrency(order.total_amount)}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="card">
            <h2 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Line Items</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Unit Price</th>
                    <th>Qty</th>
                    <th>Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.product_name}</td>
                      <td>{item.product_sku}</td>
                      <td>{formatCurrency(item.unit_price)}</td>
                      <td>{item.quantity}</td>
                      <td>{formatCurrency(item.line_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
