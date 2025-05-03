import { FC } from 'react';
import { Itinerary } from '../model/Itinerary';
import { Leg, LegType } from '../model/Leg';

export interface PrintViewProps {
  itinerary: Itinerary;
}

export const PrintView: FC<PrintViewProps> = ({ itinerary }) => {
  // Helper function to format station information
  const formatStation = (station: any) => {
    if (!station) return null;
    return (
      <div className="print-station-info">
        <div className="print-station-name">{station.label}</div>
        <div className="print-station-city">{station.city}</div>
      </div>
    );
  };

  // Helper function to format time in minutes to a human-readable format
  const formatTime = (timeInMinutes: number): string => {
    const hours = Math.floor(timeInMinutes / 60);
    const minutes = Math.floor(timeInMinutes % 60);

    if (hours === 0) {
      return `${minutes} min`;
    } else if (minutes === 0) {
      return `${hours} h`;
    } else {
      return `${hours} h ${minutes} min`;
    }
  };

  // Helper function to calculate total distance from legs
  const calculateTotalDistance = (legs: Leg[]): string => {
    const totalDistance = legs.reduce((total, leg) => {
      return total + (leg.distance || 0);
    }, 0);

    return `${totalDistance.toFixed(1)} km`;
  };

  // Helper function to calculate total time from legs
  const calculateTotalTime = (legs: Leg[]): string => {
    const totalTime = legs.reduce((total, leg) => {
      return total + (leg.estimatedTime || 0);
    }, 0);

    return formatTime(totalTime);
  };

  // Helper function to get a breakdown of leg types
  const getLegBreakdown = (legs: Leg[]): string => {
    const hikingLegs = legs.filter(leg => leg.type === LegType.HIKING).length;
    const restLegs = legs.filter(leg => leg.type === LegType.REST).length;

    return `${hikingLegs} hiking, ${restLegs} rest`;
  };

  // Helper function to format a leg
  const formatLeg = (leg: Leg, index: number) => {
    return (
      <div key={index} className="print-leg">
        <div className="print-leg-header">
          <span className="print-leg-type">
            {leg.type === LegType.HIKING ? '🥾 Hiking' : '🏠 Rest'}
          </span>
          <span className="print-leg-number">Leg {index + 1}</span>
        </div>
        <div className="print-leg-details">
          {leg.type === LegType.HIKING && (
            <>
              <div className="print-leg-stat">
                <span className="print-stat-label">Distance:</span>
                <span className="print-stat-value">{leg.distance?.toFixed(1)} km</span>
              </div>
              <div className="print-leg-stat">
                <span className="print-stat-label">Estimated Time:</span>
                <span className="print-stat-value">{formatTime(leg.estimatedTime || 0)}</span>
              </div>
              {leg.difficulty && (
                <div className="print-leg-stat">
                  <span className="print-stat-label">Difficulty:</span>
                  <span className="print-stat-value">{leg.difficulty}</span>
                </div>
              )}
            </>
          )}
          {leg.notes && (
            <div className="print-leg-notes">
              <span className="print-notes-label">Notes:</span>
              <span className="print-notes-value">{leg.notes}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="print-view">
      <div className="print-header">
        <h1>Hiking Itinerary</h1>
        <div className="print-date">Generated on: {new Date().toLocaleDateString()}</div>
      </div>

      <div className="print-summary">
        <h2>Trip Summary</h2>
        <div className="print-summary-grid">
          <div className="print-summary-item">
            <span className="print-summary-label">Total Distance:</span>
            <span className="print-summary-value">
              {itinerary.totalDistance
                ? `${itinerary.totalDistance.toFixed(1)} km`
                : calculateTotalDistance(itinerary.legs)}
            </span>
          </div>
          <div className="print-summary-item">
            <span className="print-summary-label">Estimated Time:</span>
            <span className="print-summary-value">
              {itinerary.totalTime
                ? formatTime(itinerary.totalTime)
                : calculateTotalTime(itinerary.legs)}
            </span>
          </div>
          <div className="print-summary-item">
            <span className="print-summary-label">Number of Legs:</span>
            <span className="print-summary-value">{itinerary.legs.length}</span>
          </div>
          <div className="print-summary-item">
            <span className="print-summary-label">Leg Breakdown:</span>
            <span className="print-summary-value">
              {getLegBreakdown(itinerary.legs)}
            </span>
          </div>
        </div>
      </div>

      <div className="print-itinerary">
        <h2>Itinerary Details</h2>

        <div className="print-section">
          <h3>
            <span className="print-section-icon">🟢</span>
            Starting Point
          </h3>
          {itinerary.start ? (
            formatStation(itinerary.start)
          ) : (
            <div className="print-empty-state">No starting point selected.</div>
          )}
        </div>

        {itinerary.steps.length > 0 && (
          <div className="print-section">
            <h3>
              <span className="print-section-icon">🟠</span>
              Intermediate Steps
            </h3>
            {itinerary.steps.map((step, index) => (
              <div key={step.id} className="print-step">
                <div className="print-step-number">Step {index + 1}</div>
                {formatStation(step)}
              </div>
            ))}
          </div>
        )}

        <div className="print-section">
          <h3>
            <span className="print-section-icon">🔴</span>
            Ending Point
          </h3>
          {itinerary.end ? (
            formatStation(itinerary.end)
          ) : (
            <div className="print-empty-state">No ending point selected.</div>
          )}
        </div>

        {itinerary.legs.length > 0 && (
          <div className="print-section">
            <h3>
              <span className="print-section-icon">🥾</span>
              Legs
            </h3>
            <div className="print-legs-container">
              {itinerary.legs.map((leg, index) => formatLeg(leg, index))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
