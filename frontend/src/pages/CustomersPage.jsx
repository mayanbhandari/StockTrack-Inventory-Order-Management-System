import { useCallback, useEffect, useMemo, useState } from 'react';
import { customerApi } from '../services/api';
import { filterCustomers } from '../utils/filters';
import AlertBanner from '../components/AlertBanner';
import LoadingSpinner from '../components/LoadingSpinner';
import SearchFilterBar from '../components/SearchFilterBar';

const emptyForm = { full_name: '', email: '', phone_number: '' };

export default function CustomersPage() {
  // Customer page handles create, delete, and simple search.
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [searchDraft, setSearchDraft] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  const loadCustomers = useCallback(async () => {
    // Fetch the latest customer list.
    setLoading(true);
    try {
      const data = await customerApi.getAll();
      setCustomers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Load customers when the page opens.
    loadCustomers();
  }, [loadCustomers]);

  const filteredCustomers = useMemo(() => {
    // Search is memoized to avoid recalculating on unrelated state changes.
    return filterCustomers(customers, activeSearch);
  }, [customers, activeSearch]);

  function validateForm() {
    // Give users friendly validation before calling the API.
    const errors = {};
    if (!form.full_name.trim()) errors.full_name = 'Full name is required';
    if (!form.email.trim() || !form.email.includes('@')) errors.email = 'Valid email is required';
    if (!form.phone_number.trim() || form.phone_number.length < 7) {
      errors.phone_number = 'Enter a valid phone number';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event) {
    // Add a customer after local validation passes.
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!validateForm()) return;

    setSaving(true);
    try {
      await customerApi.create({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone_number: form.phone_number.trim(),
      });
      setSuccess('Customer added successfully');
      setForm(emptyForm);
      setFieldErrors({});
      await loadCustomers();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(customerId) {
    // Confirm before deleting a customer.
    if (!window.confirm('Delete this customer?')) return;
    setError('');
    setSuccess('');
    try {
      await customerApi.remove(customerId);
      setSuccess('Customer removed');
      await loadCustomers();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleSearch() {
    // Commit the typed search text.
    setActiveSearch(searchDraft);
  }

  function clearSearch() {
    // Clear search input and results filter.
    setSearchDraft('');
    setActiveSearch('');
  }

  return (
    <div>
      <header className="page-header page-header-hero">
        <div>
          <h1>Customers</h1>
          <p>Manage customer records for order placement.</p>
        </div>
      </header>

      <AlertBanner message={error} onClose={() => setError('')} />
      <AlertBanner type="success" message={success} onClose={() => setSuccess('')} />

      <section className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 className="section-title">Add Customer</h2>
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-group">
            <label htmlFor="full_name">Full Name</label>
            <input
              id="full_name"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="Mayan Bhandari"
            />
            {fieldErrors.full_name && <p className="form-error">{fieldErrors.full_name}</p>}
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="mayanbhandari@gmail.com"
            />
            {fieldErrors.email && <p className="form-error">{fieldErrors.email}</p>}
          </div>
          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              value={form.phone_number}
              onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
              placeholder="+91 9958527919"
            />
            {fieldErrors.phone_number && <p className="form-error">{fieldErrors.phone_number}</p>}
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Add Customer'}
          </button>
        </form>
      </section>

      <section className="card">
        <h2 className="section-title">Customer List</h2>

        <SearchFilterBar
          searchValue={searchDraft}
          onSearchChange={setSearchDraft}
          onSearch={handleSearch}
          searchPlaceholder="Search by name, email, or phone…"
          showFilter={false}
          onClearFilters={clearSearch}
          resultCount={filteredCustomers.length}
          totalCount={customers.length}
        />

        {loading ? (
          <LoadingSpinner />
        ) : customers.length === 0 ? (
          <p className="empty-state">No customers yet.</p>
        ) : filteredCustomers.length === 0 ? (
          <p className="empty-state">No customers match your search.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="interactive-row">
                    <td>{customer.full_name}</td>
                    <td>{customer.email}</td>
                    <td>{customer.phone_number}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(customer.id)}
                      >
                        Delete
                      </button>
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
