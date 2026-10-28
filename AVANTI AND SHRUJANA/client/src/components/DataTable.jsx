import React, { useState } from 'react';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';

export default function DataTable({
  columns = [],
  data = [],
  isLoading = false,
  searchPlaceholder = 'Search records...',
  searchValue = '',
  onSearchChange,
  filters,
  sortField,
  sortDirection = 'asc',
  onSort,
  emptyTitle = 'No data found',
  emptyDesc = 'Try adjusting your search filters or add a new record.',
  emptyActionLabel,
  emptyActionTo,
  pagination // { page, totalPages, totalItems, onPageChange }
}) {
  const [internalSearch, setInternalSearch] = useState('');

  // Handle client-side search if no onSearchChange prop is provided
  const handleSearch = (e) => {
    const val = e.target.value;
    if (onSearchChange) {
      onSearchChange(val);
    } else {
      setInternalSearch(val);
    }
  };

  const currentSearch = onSearchChange ? searchValue : internalSearch;

  // Filter data client-side if no server-side search is handled
  let displayData = data;
  if (!onSearchChange && currentSearch.trim()) {
    const query = currentSearch.toLowerCase();
    displayData = data.filter((row) =>
      columns.some((col) => {
        const val = row[col.key];
        return val !== undefined && val !== null && String(val).toLowerCase().includes(query);
      })
    );
  }

  // Handle column header click for sorting
  const handleHeaderClick = (col) => {
    if (!col.sortable || !onSort) return;
    const newDir = sortField === col.key && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(col.key, newDir);
  };

  return (
    <div>
      {/* Table Toolbar: Search + Filters */}
      {(onSearchChange || filters) && (
        <div className="table-toolbar">
          {onSearchChange && (
            <div className="search-input-wrapper">
              <Search size={16} />
              <input
                type="text"
                className="search-input"
                placeholder={searchPlaceholder}
                value={currentSearch}
                onChange={handleSearch}
              />
            </div>
          )}
          {filters && <div className="filter-group">{filters}</div>}
        </div>
      )}

      {/* Main Table Content */}
      <div className="table-responsive">
        {isLoading ? (
          <LoadingSpinner message="Querying database collection..." />
        ) : displayData.length === 0 ? (
          <EmptyState
            title={emptyTitle}
            description={emptyDesc}
            actionLabel={emptyActionLabel}
            actionTo={emptyActionTo}
          />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={col.sortable ? 'sortable' : ''}
                    onClick={() => handleHeaderClick(col)}
                    style={{ textAlign: col.align || 'left' }}
                  >
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                      {col.label}
                      {col.sortable && (
                        sortField === col.key ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp size={13} style={{ color: 'var(--accent-gold)' }} />
                          ) : (
                            <ArrowDown size={13} style={{ color: 'var(--accent-gold)' }} />
                          )
                        ) : (
                          <ArrowUpDown size={12} style={{ opacity: 0.4 }} />
                        )
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayData.map((row, rowIdx) => (
                <tr key={row._id || row.id || rowIdx}>
                  {columns.map((col) => (
                    <td key={col.key} style={{ textAlign: col.align || 'left' }}>
                      {col.render ? col.render(row[col.key], row, rowIdx) : row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Optional Pagination Footer */}
        {pagination && pagination.totalPages > 1 && (
          <div className="pagination">
            <div>
              Showing page <strong style={{ color: 'var(--text-primary)' }}>{pagination.page}</strong> of{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{pagination.totalPages}</strong>
              {pagination.totalItems !== undefined && (
                <span> ({pagination.totalItems} total records)</span>
              )}
            </div>
            <div className="pagination-controls">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => pagination.onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                <ChevronLeft size={14} />
                Previous
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => pagination.onPageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
