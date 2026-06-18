const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function request(path, options = {}) {
  // Small wrapper so every API call handles JSON and errors the same way.
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  }

  if (!response.ok) {
    // Prefer field errors when FastAPI sends validation details.
    const message =
      data?.errors?.map((error) => `${error.field}: ${error.message}`).join(', ') ||
      data?.detail ||
      data?.message ||
      'Something went wrong';
    const error = new Error(typeof message === 'string' ? message : JSON.stringify(message));
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const productApi = {
  // Product endpoints used by the Products page.
  getAll: () => request('/products'),
  getOne: (id) => request(`/products/${id}`),
  create: (payload) => request('/products', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id, payload) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  remove: (id) => request(`/products/${id}`, { method: 'DELETE' }),
};

export const customerApi = {
  // Customer endpoints used by customer and order forms.
  getAll: () => request('/customers'),
  getOne: (id) => request(`/customers/${id}`),
  create: (payload) => request('/customers', { method: 'POST', body: JSON.stringify(payload) }),
  remove: (id) => request(`/customers/${id}`, { method: 'DELETE' }),
};

export const orderApi = {
  // Order endpoints used by order list and detail pages.
  getAll: () => request('/orders'),
  getOne: (id) => request(`/orders/${id}`),
  create: (payload) => request('/orders', { method: 'POST', body: JSON.stringify(payload) }),
  remove: (id) => request(`/orders/${id}`, { method: 'DELETE' }),
};

export const dashboardApi = {
  // Dashboard endpoint returns counts and low-stock rows.
  getSummary: () => request('/dashboard/summary'),
};

export { apiBaseUrl };
