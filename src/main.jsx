import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import './legacy-app.js';

function App(){ return <div id="legacy-app-root" aria-hidden="true" />; }

createRoot(document.getElementById('root')).render(<App />);
