import React, { FC, useState, useEffect } from 'react';
import { Station } from '../model/Station';
import { AugmentedRandoLight } from '../model/Rando';
import { HikingLeg, LegType } from '../model/Leg';
import { getRouteDistance, estimateHikingTime } from '../utils/distance';
import './RouteSelector.scss';

export interface RouteSelectorProps {
  from: Station;
  to: Station;
  availableRoutes: AugmentedRandoLight[];
  onRouteSelect: (leg: HikingLeg) => void;
  onCancel: () => void;
}

export const RouteSelector: FC<RouteSelectorProps> = ({
  from,
  to,
  availableRoutes,
  onRouteSelect,
  onCancel,
}) => {
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [filteredRoutes, setFilteredRoutes] = useState<AugmentedRandoLight[]>([]);

  // Filter routes that connect the from and to stations
  useEffect(() => {
    // Filter routes that connect both stations
    const routes = availableRoutes.filter(route => {
      return from.lineIds.includes(route.id) && to.lineIds.includes(route.id);
    });

    // Sort routes by distance (shortest first)
    const sortedRoutes = [...routes].sort((a, b) => {
      const distanceA = getDistance(a);
      const distanceB = getDistance(b);
      return distanceA - distanceB;
    });

    setFilteredRoutes(sortedRoutes);

    // Auto-select the first route if there's only one
    if (sortedRoutes.length === 1) {
      setSelectedRouteId(sortedRoutes[0].id);
    } else if (sortedRoutes.length > 0) {
      // Auto-select the shortest route if there are multiple
      setSelectedRouteId(sortedRoutes[0].id);
    } else {
      setSelectedRouteId(null);
    }
  }, [from, to, availableRoutes]);

  // Handle route selection
  const handleRouteSelect = () => {
    if (!selectedRouteId) return;

    const selectedRoute = filteredRoutes.find(route => route.id === selectedRouteId);
    if (!selectedRoute) return;

    // Create a unique ID
    const generateId = () => {
      return `hiking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    };

    // Create a new hiking leg
    const leg: HikingLeg = {
      id: generateId(),
      type: LegType.HIKING,
      from,
      to,
      route: selectedRoute,
      // Calculate distance and time based on the route
      distance: getDistance(selectedRoute),
      estimatedTime: estimateTime(selectedRoute),
    };

    onRouteSelect(leg);
  };

  // Get distance in kilometers for a route using the utility function
  const getDistance = (route: AugmentedRandoLight): number => {
    return getRouteDistance(route);
  };

  // Estimate time in minutes based on the distance and route properties
  const estimateTime = (route: AugmentedRandoLight): number => {
    const distance = getDistance(route);
    // Use the utility function for time estimation
    // Pass ascent and descent if available in the route properties
    const ascent = route.properties?.ascent;
    const descent = route.properties?.descent;
    return estimateHikingTime(distance, ascent, descent);
  };

  return (
    <div className="route-selector">
      <div className="route-selector-header">
        <h3>Select a Route</h3>
        <button className="close-button" onClick={onCancel}>×</button>
      </div>

      <div className="route-selector-content">
        <div className="route-endpoints">
          <div className="route-from">
            <span className="endpoint-label">From:</span>
            <span className="endpoint-name">{from.label}</span>
          </div>
          <div className="route-to">
            <span className="endpoint-label">To:</span>
            <span className="endpoint-name">{to.label}</span>
          </div>
        </div>

        {filteredRoutes.length === 0 ? (
          <div className="no-routes-message">
            No direct routes found between these stations.
          </div>
        ) : (
          <>
            <div className="routes-header">
              {filteredRoutes.length > 1 ? (
                <h4>{filteredRoutes.length} Alternative Routes Available</h4>
              ) : (
                <h4>1 Route Available</h4>
              )}
              <p className="routes-tip">Select the best route for your journey</p>
            </div>

            <div className="routes-list">
              {filteredRoutes.map((route, index) => {
                const distance = getDistance(route);
                const time = estimateTime(route);
                const isShortestRoute = index === 0;

                return (
                  <div
                    key={route.id}
                    className={`route-option ${selectedRouteId === route.id ? 'selected' : ''} ${isShortestRoute ? 'shortest' : ''}`}
                    onClick={() => setSelectedRouteId(route.id)}
                  >
                    {isShortestRoute && filteredRoutes.length > 1 && (
                      <div className="route-badge">Shortest</div>
                    )}

                    <div className="route-name">
                      {route.name || `Route ${route.id}`}
                    </div>

                    <div className="route-details">
                      <div className="route-detail">
                        <span className="detail-icon">📏</span>
                        <span className="detail-label">Distance:</span>
                        <span className="detail-value">{distance.toFixed(1)} km</span>
                      </div>

                      <div className="route-detail">
                        <span className="detail-icon">⏱️</span>
                        <span className="detail-label">Est. Time:</span>
                        <span className="detail-value">
                          {Math.floor(time / 60)}h {time % 60}min
                        </span>
                      </div>

                      {route.from && route.to && (
                        <div className="route-detail route-path">
                          <span className="detail-icon">🛣️</span>
                          <span className="detail-label">Path:</span>
                          <span className="detail-value">
                            {route.from} → {route.to}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="route-selector-actions">
              <button
                className="select-route-button"
                onClick={handleRouteSelect}
                disabled={!selectedRouteId}
              >
                Select Route
              </button>
              <button className="cancel-button" onClick={onCancel}>
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
