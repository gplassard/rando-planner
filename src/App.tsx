import React, { useState, FC } from 'react';
import { ItinerariesDrawer } from './components/ItinerariesDrawer';
import { Map } from './components/Map';
import { RecapPanel } from './components/RecapPanel';
import { SearchBar } from './components/SearchBar';
import { Timeline } from './components/Timeline';
import { useHikingRoutesIndex } from './hooks/useHikingRoutesIndex';
import { useItinerary } from './hooks/useItinerary';
import { useSavedItineraries } from './hooks/useSavedItineraries';
import { useStations } from './hooks/useStations';
import { SearchableRoute } from './lib/search';
import { FocusTarget } from './model/FocusTarget';
import { Station } from './model/Station';
import './App.scss';

export const App: FC = () => {
  const { stations } = useStations();
  const { routes, loading: routesLoading, ensureLoaded } = useHikingRoutesIndex();
  const { itinerary, handlers } = useItinerary();
  const saved = useSavedItineraries(stations);
  const [focusTarget, setFocusTarget] = useState<FocusTarget | null>(null);
  const [recapOpen, setRecapOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const focusStation = (station: Station) => {
    setFocusTarget({ kind: 'point', center: [station.location.lat, station.location.lng] });
  };

  const focusRoute = (route: SearchableRoute) => {
    setFocusTarget({ kind: 'bounds', bounds: route.bbox });
  };

  const loadSaved = (entry: Parameters<typeof saved.resolve>[0]) => {
    const resolved = saved.resolve(entry);
    if (!resolved) {
      return;
    }
    handlers.load(resolved);
    setDrawerOpen(false);
    const points = [resolved.start, ...resolved.steps, resolved.end]
      .filter((s): s is Station => s !== undefined)
      .map(s => s.location);
    if (points.length === 1) {
      setFocusTarget({ kind: 'point', center: [points[0].lat, points[0].lng] });
    } else if (points.length > 1) {
      const lats = points.map(p => p.lat);
      const lngs = points.map(p => p.lng);
      setFocusTarget({
        kind: 'bounds',
        bounds: [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)],
      });
    }
  };

  const canSave = Boolean(itinerary.start) || Boolean(itinerary.end) || itinerary.steps.length > 0;

  return (
    <div className="App">
      <Map
        stations={stations}
        itinerary={itinerary}
        focusTarget={focusTarget}
        onSelectStart={handlers.setStart}
        onSelectStep={handlers.addStep}
        onSelectEnd={handlers.setEnd}
      />

      <div className="overlay top-left">
        <button className="overlay-button" onClick={() => setDrawerOpen(true)}>☰ Mes itinéraires</button>
      </div>

      <SearchBar
        stations={stations}
        routes={routes}
        routesLoading={routesLoading}
        ensureRoutesLoaded={ensureLoaded}
        onSelectStation={focusStation}
        onSelectRoute={focusRoute}
      />

      <div className="overlay top-right">
        <button className="overlay-button" onClick={() => setRecapOpen(true)}>≡ Récap</button>
      </div>

      <Timeline
        itinerary={itinerary}
        onFocusStation={focusStation}
        onRemoveStart={() => handlers.setStart(undefined)}
        onRemoveStep={handlers.removeStep}
        onRemoveEnd={() => handlers.setEnd(undefined)}
      />

      <RecapPanel
        itinerary={itinerary}
        handlers={handlers}
        open={recapOpen}
        onClose={() => setRecapOpen(false)}
      />

      <ItinerariesDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        saved={saved.saved}
        canSave={canSave}
        onSave={name => saved.saveCurrent(itinerary, name)}
        onLoad={loadSaved}
        onDelete={saved.remove}
      />
    </div>
  );
};
