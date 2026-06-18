export default function LoadingSpinner({ label = 'Loading…' }) {
  // Simple loading state that stays accessible to screen readers.
  return (
    <div className="empty-state" aria-live="polite">
      <p>{label}</p>
    </div>
  );
}
