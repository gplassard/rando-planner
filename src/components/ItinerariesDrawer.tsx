import React, { FC, FormEvent, useState } from 'react';
import { SavedItinerary } from '../model/SavedItinerary';
import './ItinerariesDrawer.scss';

interface Props {
  open: boolean;
  onClose: () => any;
  saved: SavedItinerary[];
  canSave: boolean;
  onSave: (name: string) => any;
  onLoad: (entry: SavedItinerary) => any;
  onDelete: (id: string) => any;
}

/**
 * Left drawer ("Mes itinéraires"): save / load / delete itineraries, persisted
 * in the browser's localStorage only (no backend, see the project brief).
 */
export const ItinerariesDrawer: FC<Props> = (props) => {
  const [name, setName] = useState('');

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed && props.canSave) {
      props.onSave(trimmed);
      setName('');
    }
  };

  return (
    <aside className={`ItinerariesDrawer${props.open ? ' open' : ''}`} aria-hidden={!props.open}>
      <header>
        <h2>Mes itinéraires</h2>
        <button className="close" onClick={props.onClose} title="Fermer">×</button>
      </header>

      <p className="warning">
        ⚠️ Vos itinéraires sont enregistrés uniquement dans ce navigateur (localStorage).
        Pensez à les exporter pour les conserver d'un appareil à l'autre.
      </p>

      <form className="save-form" onSubmit={onSubmit}>
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
    </aside>
  );
};
