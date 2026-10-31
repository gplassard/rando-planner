import React, { FC } from 'react';
import { Itinerary, ItineraryHandlers } from '../model/Itinerary';
import './RecapPanel.scss';

interface Props {
  itinerary: Itinerary;
  handlers: ItineraryHandlers;
  open: boolean;
  onClose: () => any;
}

/**
 * Sliding panel ("volet coulissant") on the right edge of the map with the
 * recap of the current itinerary: one line per stage, in order.
 */
export const RecapPanel: FC<Props> = (props) => {
  const { itinerary, handlers, open, onClose } = props;
  const hasItinerary = Boolean(itinerary.start) || Boolean(itinerary.end) || itinerary.steps.length > 0;

  return (
    <aside className={`RecapPanel${open ? ' open' : ''}`} aria-hidden={!open}>
      <header>
        <h2>Récap de l'itinéraire</h2>
        <button className="close" onClick={onClose} title="Fermer">×</button>
      </header>

      {!hasItinerary && (
        <p className="empty">Aucun point sélectionné. Cliquez sur une gare de la carte pour définir départ, étapes et arrivée.</p>
      )}

      {hasItinerary && (
        <>
          <ol className="recap-list">
            {itinerary.start && (
              <li className="start">
                <div className="station-info">
                  <div className="station-name">Départ : {itinerary.start.label}</div>
                  <div className="station-city">{itinerary.start.city}</div>
                </div>
                <button onClick={() => handlers.setStart(undefined)}>×</button>
              </li>
            )}
            {itinerary.steps.map((step, index) => (
              <li key={step.id}>
                <div className="station-info">
                  <div className="station-name">Étape {index + 1} : {step.label}</div>
                  <div className="station-city">{step.city}</div>
                </div>
                <button onClick={() => handlers.removeStep(step)}>×</button>
              </li>
            ))}
            {itinerary.end && (
              <li className="end">
                <div className="station-info">
                  <div className="station-name">Arrivée : {itinerary.end.label}</div>
                  <div className="station-city">{itinerary.end.city}</div>
                </div>
                <button onClick={() => handlers.setEnd(undefined)}>×</button>
              </li>
            )}
          </ol>
          <p className="summary">{itinerary.steps.length} étape(s) sélectionnée(s)</p>
          <button className="clear" onClick={() => handlers.clear()}>Tout effacer</button>
        </>
      )}

      <p className="note">Distances, dénivelé et temps estimés arriveront avec le routage automatique le long des sentiers.</p>

      <footer className="build-info">
        Built from commit <code>{__BUILD_COMMIT__}</code>
        <br />
        {new Date(__BUILD_TIME__).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
      </footer>
    </aside>
  );
};
