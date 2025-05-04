import React, { useState, FC } from 'react';
import { Map } from './components/Map';
import { Sidebar } from './components/Sidebar';
import { PrintView } from './components/PrintView';
import './App.scss';
import { MapState } from './model/MapState';
import { useStationsList, useStationsLoading } from './context/StationsContext';
import { useItineraryState, useItineraryHandlers } from './context/ItineraryContext';
import { useRelevantRoutes, useRoutesLoading } from './context/RandoRoutesContext';
import { useGeometries, useGeometriesLoading } from './context/RouteGeometryContext';

export const App: FC = () => {
  const [mapState, setMapState] = useState<MapState | null>(null);
  const stations = useStationsList();
  const stationsLoading = useStationsLoading();
  const itinerary = useItineraryState();
  const handlers = useItineraryHandlers();
  const relevantRoutes = useRelevantRoutes();
  const routesLoading = useRoutesLoading();
  const geometries = useGeometries();
  const geometriesLoading = useGeometriesLoading();

  return (
    <div className="App">
      <Map
        stations={stations}
        routes={relevantRoutes}
        routeGeometries={geometries}
        itinerary={itinerary}
        itineraryHandlers={handlers}
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
      {/* PrintView is hidden by default and only shown when printing */}
      <div className="print-only">
        <PrintView itinerary={itinerary} />
      </div>
    </div>
  );
};
