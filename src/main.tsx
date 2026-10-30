import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
import './app.css';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
