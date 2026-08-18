import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import './legacy-app.js';

function App() {
  useEffect(() => {
    window.pitchxpoInit?.();
  }, []);
  return <div className="app-boot" aria-label="Loading PitchXPO Admin" />;
}

createRoot(document.getElementById('root')).render(<App />);
