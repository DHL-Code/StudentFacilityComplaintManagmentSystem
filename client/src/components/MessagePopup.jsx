import React from 'react';
import { AlertCircle } from 'lucide-react';
import '../styles/MessagePopup.css';

const MessagePopup = ({ type, message, onClose }) => {
  return (
    <div className="popup-overlay">
      <div className={`popup-content ${type}`}>
        <AlertCircle className="popup-icon" />
        <p className="popup-message">{message}</p>
        <button 
          className={`popup-button ${type}`}
          onClick={onClose}
        >
          {type === 'success' ? 'OK' : 'Try Again'}
        </button>
      </div>
    </div>
  );
};

export default MessagePopup; 