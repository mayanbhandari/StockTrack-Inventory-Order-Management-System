import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { customerApi, orderApi, productApi } from '../services/api';
import { formatCurrency } from '../utils/currency';
import { formatIstDateTime } from '../utils/datetime';
import { filterOrders } from '../utils/filters';
import AlertBanner from '../components/AlertBanner';
import LoadingSpinner from '../components/LoadingSpinner';
import SearchFilterBar from '../components/SearchFilterBar';
import './OrdersPage.css';

function emptyLineItem() {
  // Every new order starts with one product row.
  return { product_id: '', quantity: 1 };
}

const emptyFilters = {
  // Order filters begin empty so all orders show.
  status: '',
  minTotal: '',
  maxTotal: '',
  dateFrom: '',
  dateTo: '',
};

export default function OrdersPage() {
  // Orders page loads orders, customers, and products together.
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [lineItems, setLineItems] = useState([emptyLineItem()]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchDraft, setSearchDraft] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);

  const loadData = useCallback(async () => {
    // Fetch all data needed to place and list orders.
    setLoading(true);
    try {
      const [orderList, customerList, productList] = await Promise.all([
        orderApi.getAll(),
        customerApi.getAll(),
        productApi.getAll(),
      ]);
      setOrders(orderList);
      setCustomers(customerList);
      setProducts(productList);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Load the order workspace on first render.
    loadData();
  }, [loadData]);

  const filteredOrders = useMemo(() => {
    // Keep order filtering responsive as data changes.
    return filterOrders(orders, { search: activeSearch, ...appliedFilters });
  }, [orders, activeSearch, appliedFilters]);

  function updateLineItem(index, field, value) {
    // Update one product row without mutating the old array.
    setLineItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  }

  function addLineItem() {
    // Add another product row to the order form.
    setLineItems((prev) => [...prev, emptyLineItem()]);
  }

  function removeLineItem(index) {
    // Remove a product row from the order form.
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  }

  function estimatedTotal() {
    // Show a preview total; the backend still calculates the real total.
    return lineItems.reduce((sum, line) => {
      const product = products.find((p) => String(p.id) === String(line.product_id));
      if (!product) return sum;
      return sum + Number(product.price) * Number(line.quantity || 0);
    }, 0);
  }

  async function handlePlaceOrder(event) {
    // Validate the order before asking the backend to reserve stock.
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!customerId) {
      setError('Please select a customer');
      return;
    }

    const items = lineItems
      .filter((line) => line.product_id)
      .map((line) => ({
        product_id: Number(line.product_id),
        quantity: Number(line.quantity),
      }));

    if (items.length === 0) {
      setError('Add at least one product to the order');
      return;
    }

    if (items.some((item) => !item.quantity || item.quantity < 1)) {
      setError('Each line item needs a quantity of at least 1');
      return;
    }

    const productIds = items.map((item) => item.product_id);
    if (new Set(productIds).size !== productIds.length) {
      setError('Each product can only be added once per order');
      return;
    }

    const overstockedItem = items.find((item) => {
      const product = products.find((p) => p.id === item.product_id);
      return product && item.quantity > product.quantity_in_stock;
    });

    if (overstockedItem) {
      const product = products.find((p) => p.id === overstockedItem.product_id);
      setError(
        `${product.name} only has ${product.quantity_in_stock} unit${
          product.quantity_in_stock === 1 ? '' : 's'
        } in stock`,
      );
      return;
    }

    setPlacing(true);
    try {
      await orderApi.create({ customer_id: Number(customerId), items });
      setSuccess('Order placed successfully');
      setCustomerId('');
      setLineItems([emptyLineItem()]);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setPlacing(false);
    }
  }

  async function handleCancelOrder(orderId) {
    // Cancelling an order restores its stock on the backend.
    if (!window.confirm('Cancel this order? Stock will be restored.')) return;
    setError('');
    setSuccess('');
    try {
      await orderApi.remove(orderId);
      setSuccess('Order cancelled');
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleSearch() {
    // Commit the typed search text.
    setActiveSearch(searchDraft);
  }

  function applyFilters() {
    // Apply the order filter controls.
    setAppliedFilters({ ...filters });
  }

  function clearFilters() {
    // Reset search and filters together.
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setSearchDraft('');
    setActiveSearch('');
  }

  return (
    <div>
      <header className="page-header page-header-hero">
        <div>
          <h1>Orders</h1>
          <p>Create orders and review order history.</p>
        </div>
      </header>

      <AlertBanner message={error} onClose={() => setError('')} />
      <AlertBanner type="success" message={success} onClose={() => setSuccess('')} />

      <section className="card order-form-card">
        <h2 className="section-title">Create Order</h2>
        <form onSubmit={handlePlaceOrder}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label htmlFor="customer">Customer</label>
            <select
              id="customer"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              <option value="">Select a customer…</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.full_name} ({customer.email})
                </option>
              ))}
            </select>
          </div>

          <div className="line-items">
            <div className="line-items-header">
              <strong>Order Items</strong>
              <button type="button" className="btn btn-ghost btn-sm" onClick={addLineItem}>
                + Add Item
              </button>
            </div>

            {lineItems.map((line, index) => (
              <div className="line-item-row" key={index}>
                <div className="form-group">
                  <label>Product</label>
                  <select
                    value={line.product_id}
                    onChange={(e) => updateLineItem(index, 'product_id', e.target.value)}
                  >
                    <option value="">Choose product…</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} — {formatCurrency(product.price)} (stock: {product.quantity_in_stock})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group qty-field">
                  <label>Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={line.quantity}
                    onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                  />
                </div>
                {lineItems.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm remove-line-btn"
                    onClick={() => removeLineItem(index)}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="order-total-row">
            <span>Estimated total (calculated by server on submit):</span>
            <strong>{formatCurrency(estimatedTotal())}</strong>
          </div>

          <button type="submit" className="btn btn-primary" disabled={placing}>
            {placing ? 'Placing Order…' : 'Place Order'}
          </button>
        </form>
      </section>

      <section className="card" style={{ marginTop: '1.5rem' }}>
        <h2 className="section-title">Order History</h2>

        <SearchFilterBar
          searchValue={searchDraft}
          onSearchChange={setSearchDraft}
          onSearch={handleSearch}
          searchPlaceholder="Search by order #, customer, or status…"
          filterOpen={filterOpen}
          onToggleFilter={() => setFilterOpen((open) => !open)}
          onClearFilters={clearFilters}
          resultCount={filteredOrders.length}
          totalCount={orders.length}
        >
          <div className="filter-grid">
            <div className="form-group">
              <label htmlFor="order-status">Status</label>
              <select
                id="order-status"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All statuses</option>
                <option value="confirmed">Confirmed</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="min-total">Min total (Rs.)</label>
              <input
                id="min-total"
                type="number"
                min="0"
                step="0.01"
                value={filters.minTotal}
                onChange={(e) => setFilters({ ...filters, minTotal: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="max-total">Max total (Rs.)</label>
              <input
                id="max-total"
                type="number"
                min="0"
                step="0.01"
                value={filters.maxTotal}
                onChange={(e) => setFilters({ ...filters, maxTotal: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="date-from">From date</label>
              <input
                id="date-from"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="date-to">To date</label>
              <input
                id="date-to"
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              />
            </div>
          </div>
          <div className="filter-actions">
            <button type="button" className="btn btn-primary btn-sm" onClick={applyFilters}>
              Apply Filters
            </button>
          </div>
        </SearchFilterBar>

        {loading ? (
          <LoadingSpinner />
        ) : orders.length === 0 ? (
          <p className="empty-state">No orders placed yet.</p>
        ) : filteredOrders.length === 0 ? (
          <p className="empty-state">No orders match your search or filters.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="interactive-row">
                    <td>#{order.id}</td>
                    <td>{order.customer_name}</td>
                    <td>{formatCurrency(order.total_amount)}</td>
                    <td>
                      <span className="badge badge-ok">{order.status}</span>
                    </td>
                    <td>{formatIstDateTime(order.created_at)}</td>
                    <td>
                      <div className="actions-row">
                        <Link to={`/orders/${order.id}`} className="btn btn-ghost btn-sm">
                          Details
                        </Link>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleCancelOrder(order.id)}
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
