export function formatCurrency(amount) {
  // Keep all money displays in one rupee format.
  return `Rs. ${Number(amount).toFixed(2)}`;
}
