import React, { FC } from 'react';
import './ConfirmationDialog.scss';

export interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationDialog: FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="confirmation-dialog-overlay">
      <div className="confirmation-dialog">
        <div className="confirmation-dialog-header">
          <h3>{title}</h3>
          <button className="close-button" onClick={onCancel}>×</button>
        </div>
        <div className="confirmation-dialog-content">
          <p>{message}</p>
        </div>
        <div className="confirmation-dialog-actions">
          <button className="cancel-button" onClick={onCancel}>
            {cancelText}
          </button>
          <button className="confirm-button" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
