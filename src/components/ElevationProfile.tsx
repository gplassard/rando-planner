import React, { FC } from 'react';
import { AugmentedRando } from '../model/Rando';
import './ElevationProfile.scss';

interface ElevationProfileProps {
  route: AugmentedRando;
}

/**
 * Component that displays an elevation profile for a hiking route
 */
export const ElevationProfile: FC<ElevationProfileProps> = ({ route }) => {
  // Check if we have geometry and elevation data
  if (!route.geometry || !route.geometry.coordinates || route.geometry.coordinates.length === 0) {
    return <div className="elevation-profile-empty">No elevation data available</div>;
  }

  // Extract elevation data from route points
  const points = route.geometry.points || [];
  const elevationData = points
    .filter(point => point.elevation !== undefined)
    .map(point => ({
      latLng: point.latLng,
      elevation: point.elevation as number,
    }));

  // If we don't have enough elevation data points, show a message
  if (elevationData.length < 2) {
    return <div className="elevation-profile-empty">Insufficient elevation data available</div>;
  }

  // Calculate min and max elevation for scaling
  const minElevation = Math.min(...elevationData.map(p => p.elevation));
  const maxElevation = Math.max(...elevationData.map(p => p.elevation));
  const elevationRange = maxElevation - minElevation;

  // Calculate total ascent and descent
  let totalAscent = 0;
  let totalDescent = 0;

  for (let i = 1; i < elevationData.length; i++) {
    const elevationDiff = elevationData[i].elevation - elevationData[i - 1].elevation;
    if (elevationDiff > 0) {
      totalAscent += elevationDiff;
    } else {
      totalDescent += Math.abs(elevationDiff);
    }
  }

  return (
    <div className="elevation-profile">
      <h4>Elevation Profile</h4>

      <div className="elevation-stats">
        <div className="elevation-stat">
          <span className="stat-label">Min:</span>
          <span className="stat-value">{minElevation.toFixed(0)}m</span>
        </div>
        <div className="elevation-stat">
          <span className="stat-label">Max:</span>
          <span className="stat-value">{maxElevation.toFixed(0)}m</span>
        </div>
        <div className="elevation-stat">
          <span className="stat-label">Ascent:</span>
          <span className="stat-value">{totalAscent.toFixed(0)}m</span>
        </div>
        <div className="elevation-stat">
          <span className="stat-label">Descent:</span>
          <span className="stat-value">{totalDescent.toFixed(0)}m</span>
        </div>
      </div>

      <div className="elevation-chart">
        <div className="elevation-y-axis">
          <div className="elevation-y-label">{maxElevation.toFixed(0)}m</div>
          <div className="elevation-y-label" style={{ bottom: '50%' }}>{(minElevation + elevationRange / 2).toFixed(0)}m</div>
          <div className="elevation-y-label" style={{ bottom: '0%' }}>{minElevation.toFixed(0)}m</div>
        </div>

        <div className="elevation-bars">
          {elevationData.map((point, index) => {
            const heightPercent = elevationRange > 0
              ? ((point.elevation - minElevation) / elevationRange) * 100
              : 50;

            return (
              <div
                key={index}
                className="elevation-bar"
                style={{
                  height: `${heightPercent}%`,
                  width: `${100 / elevationData.length}%`
                }}
                title={`Elevation: ${point.elevation.toFixed(0)}m`}
              />
            );
          })}
        </div>
      </div>

      <div className="elevation-x-axis">
        <div className="elevation-x-label">Start</div>
        <div className="elevation-x-label" style={{ left: '50%' }}>Distance</div>
        <div className="elevation-x-label" style={{ right: '0%' }}>End</div>
      </div>
    </div>
  );
};
