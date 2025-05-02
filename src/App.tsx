import React, { useState, FC } from 'react';
import { Map } from './components/Map';
import { Sidebar } from './components/Sidebar';
import { useStations } from './hooks/useStations';
import './App.scss';
import { MapState } from './model/MapState';
import { useItinerary } from './hooks/useItinerary';
import { useRandoRoutes } from './hooks/useRandoRoutes';
import { useRouteGeometry } from './hooks/useRouteGeometry';

export const App: FC = () => {
  const [mapState, setMapState] = useState<MapState | null>(null);
  const { stations, loading: stationsLoading } = useStations();
  const { itinerary, handlers } = useItinerary();
  const { relevantRoutes, loading: routesLoading } = useRandoRoutes(itinerary);
  const { geometries, loading: geometriesLoading } = useRouteGeometry(relevantRoutes);

  return (
    <div className="App">
      <Map
        stations={stations}
        routes={relevantRoutes}
        routeGeometries={geometries}
        itinerary={itinerary}
        loading={stationsLoading || routesLoading || geometriesLoading}
        onSelectStart={handlers.setStart}
        onSelectStep={handlers.addStep}
        onSelectEnd={handlers.setEnd}
        onStateChange={setMapState}
      />
      <Sidebar
        mapState={mapState}
        itinerary={itinerary}
        itineraryHandlers={handlers}
      />
    </div>
  );
};
