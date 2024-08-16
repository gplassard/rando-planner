import { LatLngBounds } from 'leaflet';
import React, { useState, FC, Fragment } from 'react';
import { Map } from './components/Map';
import { useStations } from './hooks/useStations';
import { AugmentedRandoLight, RandoLight } from './model/Rando';
import db from '../data/small_database.json';

const typedDb: RandoLight[] = db as RandoLight[];
const augmentedDb: AugmentedRandoLight[] = typedDb.map((rando) => ({
  ...rando,
  bbox: new LatLngBounds(
    [rando.bbox[1], rando.bbox[0]],
    [rando.bbox[3], rando.bbox[2]],
  ),
}));

export const App: FC<{}> = () => {
  const [bbox, setBbox] = useState<LatLngBounds | null>(null);
  const { stations } = useStations();

  let count = 0;
  if (bbox) {
    const intersecting = augmentedDb.filter((rando) =>
      bbox.contains(rando.bbox),
    );
    count = intersecting.length;
    console.log(intersecting.slice(0, 10));
  }

  return (
    <Fragment>
      <p>{count} / {augmentedDb.length}</p>
      <p>{bbox?.toBBoxString()}</p>
      <Map stations={stations} onMove={setBbox}></Map>
    </Fragment>
  );
};
