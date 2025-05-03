import { FC, useState } from 'react';
import { Itinerary, ItineraryHandlers } from '../model/Itinerary';
import { MapState } from '../model/MapState';
import { Leg, LegType, RestLeg, HikingLeg } from '../model/Leg';
import { ConfirmationDialog } from './ConfirmationDialog';
import { Station } from '../model/Station';
import './Sidebar.scss';

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
    legs: true,
    summary: true,
  });

  // State for confirmation dialogs
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'removeStart' | 'removeStep' | 'removeEnd' | 'removeLeg' | 'addRestLeg' | null;
    stepToRemove?: Station;
    legToRemove?: Leg;
    restLegLocation?: Station;
  }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
        type: null,
      });

  // Handlers for confirmation dialogs
  const showRemoveStartConfirmation = () => {
    setConfirmationDialog({
      isOpen: true,
      title: 'Remove Starting Point',
      message: 'Are you sure you want to remove the starting point? This will affect your itinerary.',
      onConfirm: () => {
        props.itineraryHandlers.setStart(undefined);
        closeConfirmationDialog();
      },
      type: 'removeStart',
    });
  };

  const showRemoveStepConfirmation = (step: Station) => {
    setConfirmationDialog({
      isOpen: true,
      title: 'Remove Intermediate Step',
      message: `Are you sure you want to remove ${step.label} from your itinerary?`,
      onConfirm: () => {
        props.itineraryHandlers.removeStep(step);
        closeConfirmationDialog();
      },
      type: 'removeStep',
      stepToRemove: step,
    });
  };

  const showRemoveEndConfirmation = () => {
    setConfirmationDialog({
      isOpen: true,
      title: 'Remove Ending Point',
      message: 'Are you sure you want to remove the ending point? This will affect your itinerary.',
      onConfirm: () => {
        props.itineraryHandlers.setEnd(undefined);
        closeConfirmationDialog();
      },
      type: 'removeEnd',
    });
  };

  const showRemoveLegConfirmation = (leg: Leg) => {
    const legDescription = leg.type === LegType.HIKING
      ? `hiking leg from ${leg.from.label} to ${leg.to.label}`
      : `rest leg at ${(leg as any).location?.label || 'unknown location'}`;

    setConfirmationDialog({
      isOpen: true,
      title: 'Remove Leg',
      message: `Are you sure you want to remove this ${legDescription}?`,
      onConfirm: () => {
        props.itineraryHandlers.removeLeg(leg.id);
        closeConfirmationDialog();
      },
      type: 'removeLeg',
      legToRemove: leg,
    });
  };

  const showAddRestLegConfirmation = (location: Station) => {
    setConfirmationDialog({
      isOpen: true,
      title: 'Add Rest Leg',
      message: `Add a rest day at ${location.label}?`,
      onConfirm: () => {
        // Create a new rest leg
        const restLeg: RestLeg = {
          id: `rest-${Date.now()}`,
          type: LegType.REST,
          from: location,
          to: location,
          location: location,
          notes: '',
        };
        props.itineraryHandlers.addLeg(restLeg);
        closeConfirmationDialog();
      },
      type: 'addRestLeg',
      restLegLocation: location,
    });
  };

  const closeConfirmationDialog = () => {
    setConfirmationDialog(prev => ({
      ...prev,
      isOpen: false,
    }));
  };

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
      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        title={confirmationDialog.title}
        message={confirmationDialog.message}
        onConfirm={confirmationDialog.onConfirm}
        onCancel={closeConfirmationDialog}
        confirmText="Yes, Remove"
        cancelText="Cancel"
      />

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
                  onClick={showRemoveStartConfirmation}
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
                      onClick={() => showRemoveStepConfirmation(step)}
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
                  onClick={showRemoveEndConfirmation}
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

        {/* Legs Section */}
        <div className="itinerary-section">
          <h3
            className={`section-header ${expandedSections.legs ? 'expanded' : 'collapsed'}`}
            onClick={() => toggleSection('legs')}
          >
            <span className="section-icon legs-icon">🥾</span>
            Legs
            <span className="leg-count">({props.itinerary.legs.length})</span>
            <span className="toggle-icon">{expandedSections.legs ? '▼' : '►'}</span>
          </h3>
          {expandedSections.legs && (
            props.itinerary.legs.length > 0 ? (
              <div className="section-content">
                {props.itinerary.legs.map((leg, index) => (
                  <div key={leg.id} className="leg-item">
                    <div className="leg-header">
                      <div className="leg-number">Leg {index + 1}</div>
                      <div className="leg-type">
                        {leg.type === LegType.HIKING ? '🥾 Hiking' : '🏠 Rest'}
                      </div>
                    </div>

                    {leg.type === LegType.HIKING ? (
                      <div className="leg-details">
                        <div className="leg-route">
                          <strong>Route:</strong> {(leg as HikingLeg).route.name || 'Unnamed route'}
                        </div>
                        <div className="leg-stations">
                          <div><strong>From:</strong> {leg.from.label}</div>
                          <div><strong>To:</strong> {leg.to.label}</div>
                        </div>
                        {leg.distance && (
                          <div className="leg-distance">
                            <strong>Distance:</strong> {leg.distance.toFixed(1)} km
                          </div>
                        )}
                        {leg.estimatedTime && (
                          <div className="leg-time">
                            <strong>Time:</strong> {formatTime(leg.estimatedTime)}
                          </div>
                        )}
                        {(leg as HikingLeg).difficulty && (
                          <div className="leg-difficulty">
                            <strong>Difficulty:</strong> {(leg as HikingLeg).difficulty}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="leg-details">
                        <div className="leg-location">
                          <strong>Location:</strong> {(leg as RestLeg).location.label}
                        </div>
                        {(leg as RestLeg).notes && (
                          <div className="leg-notes">
                            <strong>Notes:</strong> {(leg as RestLeg).notes}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="leg-actions">
                      <button
                        className="remove-button"
                        onClick={() => showRemoveLegConfirmation(leg)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add Rest Leg controls */}
                <div className="add-rest-leg">
                  <h4>Add Rest Day</h4>
                  <p>Select a location for your rest day:</p>
                  <div className="rest-location-options">
                    {props.itinerary.start && (
                      <button
                        className="location-button"
                        onClick={() => showAddRestLegConfirmation(props.itinerary.start!)}
                      >
                        {props.itinerary.start.label} (Start)
                      </button>
                    )}

                    {props.itinerary.steps.map(step => (
                      <button
                        key={step.id}
                        className="location-button"
                        onClick={() => showAddRestLegConfirmation(step)}
                      >
                        {step.label} (Step)
                      </button>
                    ))}

                    {props.itinerary.end && (
                      <button
                        className="location-button"
                        onClick={() => showAddRestLegConfirmation(props.itinerary.end!)}
                      >
                        {props.itinerary.end.label} (End)
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                No legs added yet. Select hiking routes on the map or add rest days to create legs.
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
