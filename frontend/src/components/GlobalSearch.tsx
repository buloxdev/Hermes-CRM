'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { globalSearch, SearchResult } from '@/lib/api';
import { Search, X, Users, Briefcase, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const performSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const data = await globalSearch(q.trim());
      setResults(data);
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 200);
    return () => clearTimeout(timer);
  }, [query, performSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === 'Escape') {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const clear = () => {
    setQuery('');
    setResults(null);
    setOpen(false);
  };

  const hasResults = results && (results.prospects.length > 0 || results.deals.length > 0);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search prospects & deals..."
          className="w-full bg-slate-800 border border-slate-700 text-sm text-white rounded-lg pl-9 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder-slate-500"
        />
        {query ? (
          <button
            onClick={clear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-600 font-mono">
            ⌘K
          </span>
        )}
      </div>

      {open && (
        <div className="absolute left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50 max-h-[70vh] overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 text-teal-500 animate-spin" />
            </div>
          )}

          {!loading && !hasResults && query.trim().length > 0 && (
            <div className="py-6 text-center text-sm text-slate-500">
              No results for "{query}"
            </div>
          )}

          {!loading && !query.trim() && (
            <div className="py-4 px-3 text-xs text-slate-500 text-center">
              Type to search prospects and deals
            </div>
          )}

          {results && results.prospects.length > 0 && (
            <div>
              <div className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-800/50">
                Prospects
              </div>
              {results.prospects.map((p) => (
                <Link
                  key={p.id}
                  href={`/prospects/${p.id}`}
                  onClick={clear}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-800 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-teal-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white group-hover:text-teal-400 transition-colors truncate">
                      {p.name}
                    </p>
                    {p.subtitle && <p className="text-xs text-slate-400 truncate">{p.subtitle}</p>}
                  </div>
                  {p.industry && (
                    <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded flex-shrink-0">
                      {p.industry}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}

          {results && results.deals.length > 0 && (
            <div>
              <div className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-800/50">
                Deals
              </div>
              {results.deals.map((d) => (
                <Link
                  key={d.id}
                  href={`/deals/${d.id}`}
                  onClick={clear}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-800 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white group-hover:text-teal-400 transition-colors truncate">
                      {d.name}
                    </p>
                    {d.subtitle && <p className="text-xs text-slate-400 truncate">{d.subtitle}</p>}
                  </div>
                  {d.stage && (
                    <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded flex-shrink-0">
                      {d.stage}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}

          {results && results.total > 0 && (
            <div className="px-3 py-2 text-[10px] text-slate-600 text-center border-t border-slate-800">
              {results.total} result{results.total !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
