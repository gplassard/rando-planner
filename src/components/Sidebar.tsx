import { FC } from 'react';
import { Itinerary, ItineraryHandlers } from '../model/Itinerary';
import { MapState } from '../model/MapState';
import './Sidebar.scss';

export interface SidebarProps {
  mapState: MapState | null;
  itinerary: Itinerary;
  itineraryHandlers: ItineraryHandlers;
}

export const Sidebar: FC<SidebarProps> = (props) => {
  const { mapState, itinerary, itineraryHandlers } = props;

  return (
    <div className="Sidebar">
      <h2>Itinerary Planner</h2>

      {mapState && (
        <div className="section">
          <h2>Map Information</h2>
          <div className="map-info">
            <p><strong>Zoom Level:</strong> {mapState.zoom}</p>
            <p><strong>Bounds:</strong></p>
            <p>North: {mapState.boundingBox.getNorth().toFixed(4)}</p>
            <p>South: {mapState.boundingBox.getSouth().toFixed(4)}</p>
            <p>East: {mapState.boundingBox.getEast().toFixed(4)}</p>
            <p>West: {mapState.boundingBox.getWest().toFixed(4)}</p>
          </div>
        </div>
      )}

      <div className="section">
        <h2>Your Journey</h2>

        <ul className="itinerary-list">
          {itinerary.start ? (
            <li className="start">
              <div className="station-info">
                <div className="station-name">Start: {itinerary.start.label}</div>
                <div className="station-city">{itinerary.start.city}</div>
              </div>
              <button onClick={() => itineraryHandlers.setStart(undefined)}>×</button>
            </li>
          ) : (
            <div className="empty-message">Select a starting point on the map</div>
          )}

          {itinerary.steps.length > 0 ? (
            itinerary.steps.map((step, index) => (
              <li key={step.id}>
                <div className="station-info">
                  <div className="station-name">Step {index + 1}: {step.label}</div>
                  <div className="station-city">{step.city}</div>
                </div>
                <button onClick={() => itineraryHandlers.removeStep(step)}>×</button>
              </li>
            ))
          ) : (
            <div className="empty-message">Add waypoints to your journey</div>
          )}

          {itinerary.end ? (
            <li className="end">
              <div className="station-info">
                <div className="station-name">End: {itinerary.end.label}</div>
                <div className="station-city">{itinerary.end.city}</div>
              </div>
              <button onClick={() => itineraryHandlers.setEnd(undefined)}>×</button>
            </li>
          ) : (
            <div className="empty-message">Select a destination on the map</div>
          )}
        </ul>
      </div>
    </div>
  );
};
