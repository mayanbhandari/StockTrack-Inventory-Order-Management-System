import { getIstDateStamp } from './datetime';

export const LOW_STOCK_THRESHOLD = 10;

export function filterProducts(products, filters) {
  // Apply product search and numeric filters together.
  const { search, minPrice, maxPrice, minStock, maxStock, stockLevel } = filters;
  const query = search.trim().toLowerCase();

  return products.filter((product) => {
    if (query) {
      const matchesName = product.name.toLowerCase().includes(query);
      const matchesSku = product.sku.toLowerCase().includes(query);
      if (!matchesName && !matchesSku) return false;
    }

    if (minPrice !== '' && Number(product.price) < Number(minPrice)) return false;
    if (maxPrice !== '' && Number(product.price) > Number(maxPrice)) return false;
    if (minStock !== '' && product.quantity_in_stock < Number(minStock)) return false;
    if (maxStock !== '' && product.quantity_in_stock > Number(maxStock)) return false;

    if (stockLevel === 'low' && product.quantity_in_stock > LOW_STOCK_THRESHOLD) return false;
    if (stockLevel === 'in' && product.quantity_in_stock <= LOW_STOCK_THRESHOLD) return false;
    if (stockLevel === 'out' && product.quantity_in_stock !== 0) return false;

    return true;
  });
}

export function filterLowStockProducts(products, filters) {
  // Filter and sort the dashboard low-stock table.
  const { search, maxStock, sortBy } = filters;
  const query = search.trim().toLowerCase();

  let result = products.filter((product) => {
    if (query) {
      const matchesName = product.name.toLowerCase().includes(query);
      const matchesSku = product.sku.toLowerCase().includes(query);
      if (!matchesName && !matchesSku) return false;
    }

    if (maxStock !== '' && product.quantity_in_stock > Number(maxStock)) return false;

    return true;
  });

  if (sortBy === 'stock-asc') {
    result = [...result].sort((a, b) => a.quantity_in_stock - b.quantity_in_stock);
  } else if (sortBy === 'stock-desc') {
    result = [...result].sort((a, b) => b.quantity_in_stock - a.quantity_in_stock);
  } else if (sortBy === 'name') {
    result = [...result].sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === 'price-asc') {
    result = [...result].sort((a, b) => Number(a.price) - Number(b.price));
  }

  return result;
}

export function filterCustomers(customers, search) {
  // Customer search checks the fields people usually remember.
  const query = search.trim().toLowerCase();
  if (!query) return customers;

  return customers.filter((customer) => {
    return (
      customer.full_name.toLowerCase().includes(query) ||
      customer.email.toLowerCase().includes(query) ||
      customer.phone_number.toLowerCase().includes(query)
    );
  });
}

export function filterOrders(orders, filters) {
  // Order filters support search, total range, status, and IST dates.
  const { search, status, minTotal, maxTotal, dateFrom, dateTo } = filters;
  const query = search.trim().toLowerCase();

  return orders.filter((order) => {
    if (query) {
      const matchesId = String(order.id).includes(query);
      const matchesCustomer = order.customer_name.toLowerCase().includes(query);
      const matchesStatus = order.status.toLowerCase().includes(query);
      if (!matchesId && !matchesCustomer && !matchesStatus) return false;
    }

    if (status && order.status !== status) return false;
    if (minTotal !== '' && Number(order.total_amount) < Number(minTotal)) return false;
    if (maxTotal !== '' && Number(order.total_amount) > Number(maxTotal)) return false;

    if (dateFrom) {
      const orderDate = getIstDateStamp(order.created_at);
      const fromDate = new Date(dateFrom).setHours(0, 0, 0, 0);
      if (orderDate < fromDate) return false;
    }

    if (dateTo) {
      const orderDate = getIstDateStamp(order.created_at);
      const toDate = new Date(dateTo).setHours(0, 0, 0, 0);
      if (orderDate > toDate) return false;
    }

    return true;
  });
}
