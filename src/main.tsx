import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
import './kinetic.css';
import './photo-journal.css';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { initializeNative } from './lib/platform.ts';
import { setNativeReducedMotion } from './components/motion/kinetic.tsx';
import { initializeCaptureRecovery } from './lib/reviewCapture.ts';

void initializeNative(setNativeReducedMotion).catch(() => {});

void initializeCaptureRecovery()
  .catch(() => {})
  .then(() =>
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>,
    ),
  );
