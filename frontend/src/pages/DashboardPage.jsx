import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../services/api';
import { formatCurrency } from '../utils/currency';
import { filterLowStockProducts } from '../utils/filters';
import AlertBanner from '../components/AlertBanner';
import LoadingSpinner from '../components/LoadingSpinner';
import SearchFilterBar from '../components/SearchFilterBar';
import './DashboardPage.css';

const emptyLowStockFilters = {
  // Default low-stock filters keep the riskiest items first.
  maxStock: '',
  sortBy: 'stock-asc',
};

function StatCard({ label, value, accent, icon, onClick }) {
  // Dashboard cards double as quick navigation shortcuts.
  return (
    <button type="button" className={`stat-card stat-card-btn ${accent}`} onClick={onClick}>
      <span className="stat-icon" aria-hidden="true">{icon}</span>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      <span className="stat-hint">Click to view →</span>
    </button>
  );
}

export default function DashboardPage() {
  // Dashboard state covers counts, low-stock filtering, and API feedback.
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchDraft, setSearchDraft] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [lowStockFilters, setLowStockFilters] = useState(emptyLowStockFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyLowStockFilters);

  useEffect(() => {
    // Load summary data when the dashboard first opens.
    let mounted = true;

    async function loadSummary() {
      try {
        const data = await dashboardApi.getSummary();
        if (mounted) setSummary(data);
      } catch (err) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadSummary();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredLowStock = useMemo(() => {
    // Recalculate the visible low-stock rows only when inputs change.
    if (!summary) return [];
    return filterLowStockProducts(summary.low_stock_products, {
      search: activeSearch,
      ...appliedFilters,
    });
  }, [summary, activeSearch, appliedFilters]);

  function handleSearch() {
    // Commit the typed search text.
    setActiveSearch(searchDraft);
  }

  function applyFilters() {
    // Apply low-stock filter controls.
    setAppliedFilters({ ...lowStockFilters });
  }

  function clearFilters() {
    // Reset the dashboard search and filters.
    setLowStockFilters(emptyLowStockFilters);
    setAppliedFilters(emptyLowStockFilters);
    setSearchDraft('');
    setActiveSearch('');
  }

  if (loading) return <LoadingSpinner label="Fetching dashboard…" />;

  return (
    <div className="dashboard-page">
      <header className="page-header page-header-hero">
        <div>
          <h1>Dashboard</h1>
          <p>Overview of your inventory and recent activity.</p>
        </div>
      </header>

      <AlertBanner message={error} onClose={() => setError('')} />

      {summary && (
        <>
          <div className="stats-grid">
            <StatCard
              label="Total Products"
              value={summary.total_products}
              accent="blue"
              icon="◫"
              onClick={() => navigate('/products')}
            />
            <StatCard
              label="Total Customers"
              value={summary.total_customers}
              accent="green"
              icon="◉"
              onClick={() => navigate('/customers')}
            />
            <StatCard
              label="Total Orders"
              value={summary.total_orders}
              accent="purple"
              icon="◎"
              onClick={() => navigate('/orders')}
            />
            <StatCard
              label="Low Stock Items"
              value={summary.low_stock_products.length}
              accent="amber"
              icon="!"
              onClick={() => {
                navigate('/products?stock=low');
              }}
            />
          </div>

          <section className="card low-stock-section" id="low-stock">
            <h2 className="section-title">Low Stock Products</h2>

            <SearchFilterBar
              searchValue={searchDraft}
              onSearchChange={setSearchDraft}
              onSearch={handleSearch}
              searchPlaceholder="Search by product name or SKU…"
              filterOpen={filterOpen}
              onToggleFilter={() => setFilterOpen((open) => !open)}
              onClearFilters={clearFilters}
              resultCount={filteredLowStock.length}
              totalCount={summary.low_stock_products.length}
            >
              <div className="filter-grid">
                <div className="form-group">
                  <label htmlFor="ls-max-stock">Max stock level</label>
                  <input
                    id="ls-max-stock"
                    type="number"
                    min="0"
                    value={lowStockFilters.maxStock}
                    onChange={(e) => setLowStockFilters({ ...lowStockFilters, maxStock: e.target.value })}
                    placeholder="e.g. 5"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="ls-sort">Sort by</label>
                  <select
                    id="ls-sort"
                    value={lowStockFilters.sortBy}
                    onChange={(e) => setLowStockFilters({ ...lowStockFilters, sortBy: e.target.value })}
                  >
                    <option value="stock-asc">Stock (low to high)</option>
                    <option value="stock-desc">Stock (high to low)</option>
                    <option value="name">Name (A–Z)</option>
                    <option value="price-asc">Price (low to high)</option>
                  </select>
                </div>
              </div>
              <div className="filter-actions">
                <button type="button" className="btn btn-primary btn-sm" onClick={applyFilters}>
                  Apply Filters
                </button>
              </div>
            </SearchFilterBar>

            {summary.low_stock_products.length === 0 ? (
              <p className="empty-state">All products are sufficiently stocked.</p>
            ) : filteredLowStock.length === 0 ? (
              <p className="empty-state">No low stock products match your search or filters.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>SKU</th>
                      <th>Price</th>
                      <th>In Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLowStock.map((product) => (
                      <tr key={product.id} className="interactive-row">
                        <td>{product.name}</td>
                        <td>{product.sku}</td>
                        <td>{formatCurrency(product.price)}</td>
                        <td>
                          <span className="badge badge-warning">{product.quantity_in_stock}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
