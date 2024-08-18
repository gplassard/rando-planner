import { FC } from 'react';
import { Itinerary, ItineraryHandlers } from '../model/Itinerary';
import { MapState } from '../model/MapState';

export interface SidebarProps {
  mapState: MapState | null;
  itinerary: Itinerary;
  itineraryHandlers: ItineraryHandlers;
}

export const Sidebar: FC<SidebarProps> = (props) => {
  return (
    <div className="Sidebar">
      {JSON.stringify(props.mapState)}
      <ul>
        <li>
          Start : {JSON.stringify(props.itinerary.start)}
          {props.itinerary.start && <button onClick={() => props.itineraryHandlers.setStart(undefined)}>x</button>}
        </li>
        {props.itinerary.steps.map((step, index) =>
          <li key={step.id}>
            Step {index} : {JSON.stringify(step)}
            <button onClick={() => props.itineraryHandlers.removeStep(step)}>x</button>
          </li>,
        )}
        <li>
          End : {JSON.stringify(props.itinerary.end)}
          {props.itinerary.end && <button onClick={() => props.itineraryHandlers.setEnd(undefined)}>x</button>}
        </li>
      </ul>
    </div>
  );
};
