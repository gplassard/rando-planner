import React, { FC } from 'react';
import { Itinerary } from '../model/Itinerary';
import { Station } from '../model/Station';
import './Timeline.scss';

interface Props {
  itinerary: Itinerary;
  onFocusStation: (station: Station) => void;
  onRemoveStart: () => any;
  onRemoveStep: (station: Station) => any;
  onRemoveEnd: () => any;
}

interface StopChipProps {
  kind: 'start' | 'step' | 'end';
  label: string;
  station: Station;
  onFocus: (station: Station) => void;
  onRemove: () => any;
}

const StopChip: FC<StopChipProps> = ({ kind, label, station, onFocus, onRemove }) => (
  <li className={kind}>
    <button className="focus" onClick={() => onFocus(station)} title={`Centrer sur ${station.label}`}>
      <strong>{label}</strong> {station.label}
    </button>
    <button className="remove" onClick={onRemove} title="Retirer">×</button>
  </li>
);

/**
 * Horizontal floating timeline of the itinerary steps, pinned to the bottom
 * of the screen (wireframes v1). Clicking a stop centers the map on it.
 */
export const Timeline: FC<Props> = (props) => {
  const { itinerary } = props;
  const hasItinerary = Boolean(itinerary.start) || Boolean(itinerary.end) || itinerary.steps.length > 0;

  return (
    <div className="Timeline">
      {!hasItinerary && (
        <div className="hint">Cliquez sur une gare de la carte pour définir le départ, les étapes et l'arrivée</div>
      )}
      {hasItinerary && (
        <ol className="stops">
          {itinerary.start && (
            <StopChip kind="start" label="Départ" station={itinerary.start} onFocus={props.onFocusStation} onRemove={props.onRemoveStart} />
          )}
          {itinerary.steps.map((step, index) => (
            <StopChip
              key={step.id}
              kind="step"
              label={`Étape ${index + 1}`}
              station={step}
              onFocus={props.onFocusStation}
              onRemove={() => props.onRemoveStep(step)}
            />
          ))}
          {itinerary.end && (
            <StopChip kind="end" label="Arrivée" station={itinerary.end} onFocus={props.onFocusStation} onRemove={props.onRemoveEnd} />
          )}
        </ol>
      )}
    </div>
  );
};
