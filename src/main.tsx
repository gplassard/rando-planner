import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './style.scss';
import './print.scss';

const root = createRoot(
  document.getElementById('app')!,
);
root.render(
  <React.StrictMode>
    <App/>
  </React.StrictMode>,
);
