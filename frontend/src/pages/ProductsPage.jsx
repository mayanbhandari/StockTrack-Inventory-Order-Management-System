import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productApi } from '../services/api';
import { formatCurrency } from '../utils/currency';
import { filterProducts, LOW_STOCK_THRESHOLD } from '../utils/filters';
import AlertBanner from '../components/AlertBanner';
import LoadingSpinner from '../components/LoadingSpinner';
import SearchFilterBar from '../components/SearchFilterBar';

const emptyForm = { name: '', sku: '', price: '', quantity_in_stock: '' };

const emptyFilters = {
  // Product filters begin empty so the full list is visible.
  minPrice: '',
  maxPrice: '',
  minStock: '',
  maxStock: '',
  stockLevel: '',
};

export default function ProductsPage() {
  // Product page handles create, update, delete, search, and filters.
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [searchDraft, setSearchDraft] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);

  const loadProducts = useCallback(async () => {
    // Fetch the latest products from the backend.
    setLoading(true);
    try {
      const data = await productApi.getAll();
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Load products on first render.
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    // Dashboard low-stock card opens this page with the low filter enabled.
    if (searchParams.get('stock') === 'low') {
      const lowStockFilter = { ...emptyFilters, stockLevel: 'low' };
      setFilters(lowStockFilter);
      setAppliedFilters(lowStockFilter);
      setFilterOpen(true);
    }
  }, [searchParams]);

  const filteredProducts = useMemo(() => {
    // Keep table filtering fast as the list grows.
    return filterProducts(products, { search: activeSearch, ...appliedFilters });
  }, [products, activeSearch, appliedFilters]);

  function validateForm() {
    // Mirror backend validation for quick feedback before submit.
    const errors = {};
    if (!form.name.trim()) errors.name = 'Product name is required';
    if (!form.sku.trim()) errors.sku = 'SKU is required';
    if (!form.price || Number(form.price) <= 0) errors.price = 'Enter a valid price';
    if (form.quantity_in_stock === '' || Number(form.quantity_in_stock) < 0) {
      errors.quantity_in_stock = 'Stock must be zero or more';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function resetForm() {
    // Clear the form and leave edit mode.
    setForm(emptyForm);
    setEditingId(null);
    setFieldErrors({});
  }

  async function handleSubmit(event) {
    // Create or update a product depending on edit mode.
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!validateForm()) return;

    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      price: Number(form.price),
      quantity_in_stock: Number(form.quantity_in_stock),
    };

    setSaving(true);
    try {
      if (editingId) {
        await productApi.update(editingId, payload);
        setSuccess('Product updated successfully');
      } else {
        await productApi.create(payload);
        setSuccess('Product added successfully');
      }
      resetForm();
      await loadProducts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(product) {
    // Fill the form with the selected product for editing.
    setEditingId(product.id);
    setForm({
      name: product.name,
      sku: product.sku,
      price: String(product.price),
      quantity_in_stock: String(product.quantity_in_stock),
    });
    setFieldErrors({});
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(productId) {
    // Confirm before removing a product.
    if (!window.confirm('Delete this product?')) return;
    setError('');
    setSuccess('');
    try {
      await productApi.remove(productId);
      setSuccess('Product removed');
      if (editingId === productId) resetForm();
      await loadProducts();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleSearch() {
    // Commit the typed search text.
    setActiveSearch(searchDraft);
  }

  function applyFilters() {
    // Apply the current filter inputs to the table.
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
          <h1>Products</h1>
          <p>Add, update, and track your product inventory.</p>
        </div>
      </header>

      <AlertBanner message={error} onClose={() => setError('')} />
      <AlertBanner type="success" message={success} onClose={() => setSuccess('')} />

      <section className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 className="section-title">{editingId ? 'Edit Product' : 'Add New Product'}</h2>
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-group">
            <label htmlFor="name">Product Name</label>
            <input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Wireless Mouse"
            />
            {fieldErrors.name && <p className="form-error">{fieldErrors.name}</p>}
          </div>
          <div className="form-group">
            <label htmlFor="sku">SKU / Code</label>
            <input
              id="sku"
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              placeholder="e.g. WM-001"
            />
            {fieldErrors.sku && <p className="form-error">{fieldErrors.sku}</p>}
          </div>
          <div className="form-group">
            <label htmlFor="price">Price (Rs.)</label>
            <input
              id="price"
              type="number"
              min="0.01"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
            {fieldErrors.price && <p className="form-error">{fieldErrors.price}</p>}
          </div>
          <div className="form-group">
            <label htmlFor="stock">Quantity in Stock</label>
            <input
              id="stock"
              type="number"
              min="0"
              value={form.quantity_in_stock}
              onChange={(e) => setForm({ ...form, quantity_in_stock: e.target.value })}
            />
            {fieldErrors.quantity_in_stock && (
              <p className="form-error">{fieldErrors.quantity_in_stock}</p>
            )}
          </div>
          <div className="actions-row">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Update Product' : 'Add Product'}
            </button>
            {editingId && (
              <button type="button" className="btn btn-ghost" onClick={resetForm}>
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="card">
        <h2 className="section-title">Product List</h2>

        <SearchFilterBar
          searchValue={searchDraft}
          onSearchChange={setSearchDraft}
          onSearch={handleSearch}
          searchPlaceholder="Search by product name or SKU…"
          filterOpen={filterOpen}
          onToggleFilter={() => setFilterOpen((open) => !open)}
          onClearFilters={clearFilters}
          resultCount={filteredProducts.length}
          totalCount={products.length}
        >
          <div className="filter-grid">
            <div className="form-group">
              <label htmlFor="min-price">Min price (Rs.)</label>
              <input
                id="min-price"
                type="number"
                min="0"
                step="0.01"
                value={filters.minPrice}
                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="max-price">Max price (Rs.)</label>
              <input
                id="max-price"
                type="number"
                min="0"
                step="0.01"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="min-stock">Min stock</label>
              <input
                id="min-stock"
                type="number"
                min="0"
                value={filters.minStock}
                onChange={(e) => setFilters({ ...filters, minStock: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="max-stock">Max stock</label>
              <input
                id="max-stock"
                type="number"
                min="0"
                value={filters.maxStock}
                onChange={(e) => setFilters({ ...filters, maxStock: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="stock-level">Stock status</label>
              <select
                id="stock-level"
                value={filters.stockLevel}
                onChange={(e) => setFilters({ ...filters, stockLevel: e.target.value })}
              >
                <option value="">All products</option>
                <option value="low">Low stock (≤ {LOW_STOCK_THRESHOLD})</option>
                <option value="in">In stock</option>
                <option value="out">Out of stock</option>
              </select>
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
        ) : products.length === 0 ? (
          <p className="empty-state">No products yet. Add your first item above.</p>
        ) : filteredProducts.length === 0 ? (
          <p className="empty-state">No products match your search or filters.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="interactive-row">
                    <td>{product.name}</td>
                    <td>{product.sku}</td>
                    <td>{formatCurrency(product.price)}</td>
                    <td>
                      <span
                        className={`badge ${product.quantity_in_stock <= LOW_STOCK_THRESHOLD ? 'badge-warning' : 'badge-ok'}`}
                      >
                        {product.quantity_in_stock}
                      </span>
                    </td>
                    <td>
                      <div className="actions-row">
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => startEdit(product)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(product.id)}
                        >
                          Delete
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
