export default function AlertBanner({ type = 'error', message, onClose }) {
  // Hide the banner when there is nothing to tell the user.
  if (!message) return null;

  return (
    <div className={`alert alert-${type}`} role="alert">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
        <span>{message}</span>
        {onClose && (
          <button type="button" onClick={onClose} className="btn btn-ghost btn-sm" aria-label="Dismiss">
            ×
          </button>
        )}
      </div>
    </div>
  );
}
