import React, { useState, FC } from 'react';
import { Map } from './components/Map';
import { Sidebar } from './components/Sidebar';
import { useHikingRoutes } from './hooks/useHikingRoutes';
import { useStations } from './hooks/useStations';
import './App.scss';
import { MapState } from './model/MapState';
import { useItinerary } from './hooks/useItinerary';

export const App: FC = () => {
  const [mapState, setMapState] = useState<MapState | null>(null);
  const { stations } = useStations();
  const { hikingRoutes } = useHikingRoutes();
  const { itinerary, handlers } = useItinerary();

  return (
    <div className="App">
      <Map
        stations={stations}
        hikingRoutes={hikingRoutes}
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
