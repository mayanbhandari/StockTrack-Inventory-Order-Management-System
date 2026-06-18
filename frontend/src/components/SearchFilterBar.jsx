import './SearchFilterBar.css';

export default function SearchFilterBar({
  searchValue,
  onSearchChange,
  onSearch,
  searchPlaceholder = 'Search…',
  filterOpen,
  onToggleFilter,
  onClearFilters,
  resultCount,
  totalCount,
  showFilter = true,
  children,
}) {
  function handleSubmit(event) {
    // Search happens only when the user submits the form.
    event.preventDefault();
    onSearch();
  }

  return (
    // Shared search and filter toolbar used across data pages.
    <div className="search-filter-bar">
      <form className="search-row" onSubmit={handleSubmit}>
        <div className="search-input-wrap">
          <span className="search-icon" aria-hidden="true">⌕</span>
          <input
            type="search"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label="Search"
          />
        </div>
        <button type="submit" className="btn btn-primary btn-sm">
          Search
        </button>
        {showFilter && (
          <button
            type="button"
            className={`btn btn-ghost btn-sm ${filterOpen ? 'filter-active' : ''}`}
            onClick={onToggleFilter}
          >
            Filter
          </button>
        )}
        {!showFilter && searchValue && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClearFilters}>
            Clear
          </button>
        )}
      </form>

      {typeof resultCount === 'number' && (
        <p className="result-count">
          Showing <strong>{resultCount}</strong> of {totalCount} results
        </p>
      )}

      {filterOpen && (
        <div className="filter-panel card">
          <div className="filter-panel-header">
            <strong>Filters</strong>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClearFilters}>
              Clear all
            </button>
          </div>
          {children}
        </div>
      )}
    </div>
  );
}
