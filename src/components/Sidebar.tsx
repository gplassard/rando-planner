import { FC, useState } from 'react';
import { Itinerary, ItineraryHandlers } from '../model/Itinerary';
import { MapState } from '../model/MapState';
import { Leg, LegType } from '../model/Leg';

export interface SidebarProps {
  mapState: MapState | null;
  itinerary: Itinerary;
  itineraryHandlers: ItineraryHandlers;
}

export const Sidebar: FC<SidebarProps> = (props) => {
  // State to track which sections are expanded
  const [expandedSections, setExpandedSections] = useState({
    start: true,
    steps: true,
    end: true,
    summary: true,
  });

  // Toggle section expansion
  const toggleSection = (section: 'start' | 'steps' | 'end' | 'summary') => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    });
  };
  // Helper function to format station information
  const formatStation = (station: any) => {
    if (!station) return null;
    return (
      <div className="station-info">
        <div className="station-name">{station.label}</div>
        <div className="station-city">{station.city}</div>
      </div>
    );
  };

  // Helper function to calculate total distance from legs
  const calculateTotalDistance = (legs: Leg[]): string => {
    const totalDistance = legs.reduce((total, leg) => {
      return total + (leg.distance || 0);
    }, 0);

    return `${totalDistance.toFixed(1)} km`;
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

  return (
    <div className="Sidebar">
      <div className="sidebar-header">
        <h2>Itinerary</h2>
        <p>Plan your hiking trip by selecting stations on the map</p>
        <button
          className="print-button"
          onClick={() => window.print()}
          title="Print Itinerary"
        >
          🖨️ Print Itinerary
        </button>
      </div>

      <div className="itinerary-container">
        {/* Start Point Section */}
        <div className="itinerary-section">
          <h3
            className={`section-header ${expandedSections.start ? 'expanded' : 'collapsed'}`}
            onClick={() => toggleSection('start')}
          >
            <span className="section-icon start-icon">🟢</span>
            Starting Point
            <span className="toggle-icon">{expandedSections.start ? '▼' : '►'}</span>
          </h3>
          {expandedSections.start && (
            props.itinerary.start ? (
              <div className="section-content">
                {formatStation(props.itinerary.start)}
                <button
                  className="remove-button"
                  onClick={() => props.itineraryHandlers.setStart(undefined)}
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="empty-state">
                No starting point selected. Click on a station and select "Départ".
              </div>
            )
          )}
        </div>

        {/* Intermediate Steps Section */}
        <div className="itinerary-section">
          <h3
            className={`section-header ${expandedSections.steps ? 'expanded' : 'collapsed'}`}
            onClick={() => toggleSection('steps')}
          >
            <span className="section-icon step-icon">🟠</span>
            Intermediate Steps
            <span className="step-count">({props.itinerary.steps.length})</span>
            <span className="toggle-icon">{expandedSections.steps ? '▼' : '►'}</span>
          </h3>
          {expandedSections.steps && (
            props.itinerary.steps.length > 0 ? (
              <div className="section-content">
                {props.itinerary.steps.map((step, index) => (
                  <div key={step.id} className="step-item">
                    <div className="step-number">Step {index + 1}</div>
                    {formatStation(step)}
                    <button
                      className="remove-button"
                      onClick={() => props.itineraryHandlers.removeStep(step)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                No intermediate steps added. Click on stations and select "Etape".
              </div>
            )
          )}
        </div>

        {/* End Point Section */}
        <div className="itinerary-section">
          <h3
            className={`section-header ${expandedSections.end ? 'expanded' : 'collapsed'}`}
            onClick={() => toggleSection('end')}
          >
            <span className="section-icon end-icon">🔴</span>
            Ending Point
            <span className="toggle-icon">{expandedSections.end ? '▼' : '►'}</span>
          </h3>
          {expandedSections.end && (
            props.itinerary.end ? (
              <div className="section-content">
                {formatStation(props.itinerary.end)}
                <button
                  className="remove-button"
                  onClick={() => props.itineraryHandlers.setEnd(undefined)}
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="empty-state">
                No ending point selected. Click on a station and select "Arrivée".
              </div>
            )
          )}
        </div>

        {/* Summary Section with statistics */}
        <div className="itinerary-section">
          <h3
            className={`section-header ${expandedSections.summary ? 'expanded' : 'collapsed'}`}
            onClick={() => toggleSection('summary')}
          >
            <span className="section-icon summary-icon">📊</span>
            Trip Summary
            <span className="toggle-icon">{expandedSections.summary ? '▼' : '►'}</span>
          </h3>
          {expandedSections.summary && (
            props.itinerary.start && props.itinerary.end && props.itinerary.legs.length > 0 ? (
              <div className="section-content summary-content">
                <div className="summary-stat">
                  <div className="stat-label">Total Distance:</div>
                  <div className="stat-value">
                    {props.itinerary.totalDistance
                      ? `${props.itinerary.totalDistance.toFixed(1)} km`
                      : calculateTotalDistance(props.itinerary.legs)}
                  </div>
                </div>

                <div className="summary-stat">
                  <div className="stat-label">Estimated Time:</div>
                  <div className="stat-value">
                    {props.itinerary.totalTime
                      ? formatTime(props.itinerary.totalTime)
                      : calculateTotalTime(props.itinerary.legs)}
                  </div>
                </div>

                <div className="summary-stat">
                  <div className="stat-label">Number of Legs:</div>
                  <div className="stat-value">{props.itinerary.legs.length}</div>
                </div>

                <div className="summary-stat">
                  <div className="stat-label">Leg Breakdown:</div>
                  <div className="stat-value">
                    {getLegBreakdown(props.itinerary.legs)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                Trip summary will be available once you've selected start and end points and have at least one leg.
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
