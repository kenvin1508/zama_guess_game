import React from 'react';
import './loading.css';
import zamaLoadingGif from '../zama_loading.gif';

const Loading = ({ message }) => {
  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <img src={zamaLoadingGif} alt="Loading..." className="loading-image" />
        <p className="loading-message" dangerouslySetInnerHTML={{ __html: message }}></p>
      </div>
    </div>
  );
};

export default Loading;
