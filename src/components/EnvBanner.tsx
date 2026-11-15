import React, { FC, useMemo, useState } from 'react';
import { detectEnvironment, Environment } from '../lib/environment';
import './EnvBanner.scss';

/**
 * Small banner telling users they are looking at a PR preview or a local dev
 * build rather than the public site. Renders nothing in production.
 */
export const EnvBanner: FC = () => {
  // Replaced by Vite at build time: 'development' on the dev server,
  // 'production' in bundles (the root tsconfig is CommonJS, so import.meta is
  // not available here).
  const isDev = process.env.NODE_ENV !== 'production';
  const environment = useMemo<Environment>(
    () => detectEnvironment(window.location.pathname, isDev),
    [isDev],
  );
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || environment.kind === 'prod') {
    return null;
  }

  return (
    <div className="EnvBanner">
      <span className="EnvBanner-label">
        {environment.kind === 'dev'
          ? 'Version de développement'
          : `Aperçu — pull request #${environment.prNumber}`}
      </span>
      {environment.kind === 'preview' && (
        <a className="EnvBanner-link" href={environment.prodPath}>
          Voir la version publique
        </a>
      )}
      <button
        className="EnvBanner-close"
        aria-label="Fermer"
        onClick={() => setDismissed(true)}
      >
        ×
      </button>
    </div>
  );
};
