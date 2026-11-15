import React, { FC, FormEvent, useState } from 'react';
import { Itinerary, ItineraryHandlers } from '../model/Itinerary';
import { SavedItinerary } from '../model/SavedItinerary';
import './RecapPanel.scss';

interface Props {
  itinerary: Itinerary;
  handlers: ItineraryHandlers;
  saved: SavedItinerary[];
  canSave: boolean;
  onSave: (name: string) => any;
  onLoad: (entry: SavedItinerary) => any;
  onDelete: (id: string) => any;
  open: boolean;
  onClose: () => any;
}

/**
 * Sliding panel on the right edge of the map: recap of the current itinerary
 * (one line per stage, in order) plus the saved itineraries, persisted in the
 * browser's localStorage only (no backend, see the project brief).
 */
export const RecapPanel: FC<Props> = (props) => {
  const { itinerary, handlers, open, onClose } = props;
  const [name, setName] = useState('');
  const hasItinerary = Boolean(itinerary.start) || Boolean(itinerary.end) || itinerary.steps.length > 0;

  const onSaveSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed && props.canSave) {
      props.onSave(trimmed);
      setName('');
    }
  };

  return (
    <aside className={`RecapPanel${open ? ' open' : ''}`} aria-hidden={!open}>
      <header>
        <h2>Mon itinéraire</h2>
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

      <section className="saved">
        <h3>Mes itinéraires</h3>
        <p className="warning">
          ⚠️ Vos itinéraires sont enregistrés uniquement dans ce navigateur (localStorage).
          Pensez à les exporter pour les conserver d'un appareil à l'autre.
        </p>

        <form className="save-form" onSubmit={onSaveSubmit}>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nom de l'itinéraire actuel"
            aria-label="Nom de l'itinéraire"
          />
          <button type="submit" disabled={!props.canSave || !name.trim()}>
            Enregistrer
          </button>
        </form>
        {!props.canSave && (
          <p className="hint">Sélectionnez d'abord un départ, une étape ou une arrivée sur la carte.</p>
        )}

        {props.saved.length === 0 ? (
          <p className="empty">Aucun itinéraire enregistré.</p>
        ) : (
          <ul className="saved-list">
            {props.saved.map(entry => (
              <li key={entry.id}>
                <div className="meta">
                  <div className="name">{entry.name}</div>
                  <div className="date">
                    {new Date(entry.savedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    {' · '}{entry.stepIds.length} étape(s)
                  </div>
                </div>
                <div className="actions">
                  <button onClick={() => props.onLoad(entry)}>Charger</button>
                  <button className="delete" onClick={() => props.onDelete(entry.id)}>Supprimer</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="build-info">
        Built from commit <code>{__BUILD_COMMIT__}</code>
        <br />
        {new Date(__BUILD_TIME__).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
      </footer>
    </aside>
  );
};
