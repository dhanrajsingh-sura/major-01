import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

/**
 * main.jsx — Entry point for the React application.
 *
 * StrictMode helps catch common bugs during development by running
 * components twice and flagging deprecated patterns. It has no effect
 * in production.
 */

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
