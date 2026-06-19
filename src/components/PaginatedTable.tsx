import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown, X } from 'lucide-react';

export interface Column<T> {
  header: string;
  accessor?: keyof T;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  filterOptions?: { label: string; value: string }[];
  className?: string;
  headerClassName?: string;
  hideOnMobile?: boolean;
}

interface PaginatedTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchFields?: (keyof T)[];
  pageSize?: number;
  pageSizes?: number[];
  emptyMessage?: string;
  title?: string;
  keyExtractor: (item: T) => string | number;
  actions?: React.ReactNode;
  onRowClick?: (item: T) => void;
  rowClassName?: (item: T) => string | undefined;
  defaultSortKey?: keyof T;
  defaultSortDir?: 'asc' | 'desc';
}

export function PaginatedTable<T extends Record<string, any>>({
  data,
  columns,
  searchFields = [],
  pageSize: defaultPageSize = 20,
  pageSizes = [10, 20, 50, 100],
  emptyMessage = 'No records found.',
  title,
  keyExtractor,
  actions,
  onRowClick,
  rowClassName,
  defaultSortKey,
  defaultSortDir = 'desc',
}: PaginatedTableProps<T>) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [sortKey, setSortKey] = useState<keyof T | null>(defaultSortKey ?? null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(defaultSortDir);
  const [filters, setFilters] = useState<Record<string, string>>({});

  // Search
  const searched = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(item =>
      searchFields.some(field => {
        const val = item[field];
        return val != null && String(val).toLowerCase().includes(q);
      })
    );
  }, [data, search, searchFields]);

  // Filter
  const filtered = useMemo(() => {
    const activeFilters = Object.entries(filters).filter(([, v]) => v);
    if (!activeFilters.length) return searched;
    return searched.filter(item =>
      activeFilters.every(([key, value]) => {
        const col = columns.find(c => c.accessor === key || c.header === key);
        const field = col?.accessor as keyof T;
        return String(item[field] ?? '').toLowerCase() === value.toLowerCase();
      })
    );
  }, [searched, filters, columns]);

  // Sort
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = typeof aVal === 'number' && typeof bVal === 'number'
        ? aVal - bVal
        : String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const paginated = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const startRow = sorted.length === 0 ? 0 : safePage * pageSize + 1;
  const endRow = Math.min((safePage + 1) * pageSize, sorted.length);

  const toggleSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const filterableColumns = columns.filter(c => c.filterable && c.filterOptions);

  return (
    <div className="space-y-3">
      {/* Toolbar: title + search + actions */}
      <div className="flex flex-wrap items-center gap-3">
        {title && (
          <h3 className="text-sm font-bold text-zinc-300 font-mono uppercase tracking-wider mr-auto">{title}</h3>
        )}
        {searchFields.length > 0 && (
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              placeholder="Search..."
              className="w-full bg-[#0c0f1d] border border-zinc-850 rounded pl-9 pr-8 py-2 text-xs text-zinc-200 font-mono placeholder-zinc-600 outline-none focus:border-zinc-700"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 cursor-pointer">
                <X size={14} />
              </button>
            )}
          </div>
        )}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Column filters */}
      {filterableColumns.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filterableColumns.map(col => (
            <select
              key={String(col.accessor || col.header)}
              value={filters[String(col.accessor || col.header)] || ''}
              onChange={e => { setFilters(f => ({ ...f, [String(col.accessor || col.header)]: e.target.value })); setPage(0); }}
              className="bg-[#0c0f1d] border border-zinc-850 rounded px-2 py-1.5 text-[10px] text-zinc-400 font-mono outline-none cursor-pointer"
            >
              <option value="">All {col.header}</option>
              {col.filterOptions?.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-zinc-850">
        <table className="w-full text-left text-xs bg-zinc-950/25">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/40 text-zinc-400 font-mono">
              {columns.map(col => (
                <th
                  key={String(col.accessor || col.header)}
                  className={`p-3 ${col.hideOnMobile ? 'hidden md:table-cell' : ''} ${col.headerClassName || ''} ${col.sortable ? 'cursor-pointer select-none hover:text-zinc-200' : ''}`}
                  onClick={() => col.sortable && col.accessor && toggleSort(col.accessor)}
                >
                  <div className="flex items-center gap-1">
                    <span>{col.header}</span>
                    {col.sortable && col.accessor && (
                      sortKey === col.accessor ? (
                        sortDir === 'asc' ? <ArrowUp size={12} className="text-orange-400" /> : <ArrowDown size={12} className="text-orange-400" />
                      ) : (
                        <ArrowUpDown size={12} className="text-zinc-600" />
                      )
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-850">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-10 text-center font-mono text-zinc-500 text-[11px]">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginated.map(item => (
                <tr
                  key={keyExtractor(item)}
                  onClick={() => onRowClick?.(item)}
                  className={`text-zinc-300 transition-colors ${onRowClick ? 'cursor-pointer' : ''} ${rowClassName?.(item) || 'hover:bg-zinc-900/10'}`}
                >
                  {columns.map(col => (
                    <td
                      key={String(col.accessor || col.header)}
                      className={`p-3 ${col.hideOnMobile ? 'hidden md:table-cell' : ''} ${col.className || ''}`}
                    >
                      {col.render
                        ? col.render(item)
                        : col.accessor
                          ? (item[col.accessor] ?? '-')
                          : null}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {sorted.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 pt-4 mt-1 text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-2">
            <span>Rows:</span>
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(0); }}
              className="bg-[#0c0f1d] border border-zinc-700 rounded px-2 py-1 text-zinc-200 outline-none cursor-pointer"
            >
              {pageSizes.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <span className="text-zinc-500">
              {startRow}–{endRow} of {sorted.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(0)}
              disabled={safePage === 0}
              className="p-1.5 rounded hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-zinc-400 hover:text-white"
            >
              <ChevronsLeft size={14} />
            </button>
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="p-1.5 rounded hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-zinc-400 hover:text-white"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="px-3 py-1 bg-zinc-900 border border-zinc-700 rounded text-zinc-200 font-bold">
              {safePage + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1}
              className="p-1.5 rounded hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-zinc-400 hover:text-white"
            >
              <ChevronRight size={14} />
            </button>
            <button
              onClick={() => setPage(totalPages - 1)}
              disabled={safePage >= totalPages - 1}
              className="p-1.5 rounded hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-zinc-400 hover:text-white"
            >
              <ChevronsRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
