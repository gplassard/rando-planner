import React, { FC, KeyboardEvent, useMemo, useRef, useState } from 'react';
import { search, SearchableRoute, SearchFilter, SearchResult } from '../lib/search';
import { Station } from '../model/Station';
import './SearchBar.scss';

interface Props {
  stations: Station[];
  routes: SearchableRoute[];
  routesLoading: boolean;
  ensureRoutesLoaded: () => void;
  onSelectStation: (station: Station) => void;
  onSelectRoute: (route: SearchableRoute) => void;
}

const FILTERS: Array<{ value: SearchFilter; label: string }> = [
  { value: 'all', label: 'Tous' },
  { value: 'stations', label: 'Gares' },
  { value: 'routes', label: 'Sentiers' },
];

const RESULT_LIMIT = 8;

/**
 * Map-first search bar: its only purpose is to center the map on a gare or a
 * sentier (wireframes v1) — it never edits the itinerary.
 */
export const SearchBar: FC<Props> = (props) => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<SearchFilter>('all');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(
    () => search(query, filter, props.stations, props.routes, RESULT_LIMIT),
    [query, filter, props.stations, props.routes],
  );

  const select = (result: SearchResult<Station, SearchableRoute>) => {
    if (result.kind === 'station') {
      props.onSelectStation(result.station);
    } else {
      props.onSelectRoute(result.route);
    }
    setQuery('');
    setOpen(false);
    setActiveIndex(0);
    inputRef.current?.blur();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex(i => Math.min(i + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (event.key === 'Enter') {
      const result = results[activeIndex] ?? results[0];
      if (result) {
        select(result);
      }
    } else if (event.key === 'Escape') {
      setQuery('');
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const showResults = open && query.trim().length > 0;
  const waitingForRoutes = props.routesLoading && (filter === 'all' || filter === 'routes');

  return (
    <div className="SearchBar">
      <div className="search-box">
        <input
          ref={inputRef}
          type="search"
          placeholder="Centrer la carte : gare ou sentier…"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIndex(0);
            props.ensureRoutesLoaded();
          }}
          onFocus={() => {
            setOpen(true);
            props.ensureRoutesLoaded();
          }}
          onKeyDown={onKeyDown}
        />
        <div className="filters">
          {FILTERS.map(f => (
            <button
              key={f.value}
              className={filter === f.value ? 'active' : ''}
              onClick={() => {
                setFilter(f.value);
                setOpen(true);
                props.ensureRoutesLoaded();
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>
      {showResults && (
        <ul className="results">
          {results.length === 0 && (
            <li className="no-result">{waitingForRoutes ? 'Chargement des sentiers…' : 'Aucun résultat'}</li>
          )}
          {results.map((result, index) => (
            <li
              key={result.kind === 'station' ? `s-${result.station.id}` : `r-${result.route.id}`}
              className={index === activeIndex ? 'active' : ''}
              onMouseDown={e => {
                e.preventDefault();
                select(result);
              }}
              onMouseEnter={() => setActiveIndex(index)}>
              {result.kind === 'station' ? (
                <>
                  <span className="kind">🚉 gare</span>
                  <span className="label">{result.station.label}</span>
                  <span className="sub">{result.station.city}</span>
                </>
              ) : (
                <>
                  <span className="kind">🥾 sentier</span>
                  <span className="label">{result.route.name ?? result.route.id}</span>
                  <span className="sub">{[result.route.from, result.route.to].filter(Boolean).join(' → ')}</span>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
