import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
import './kinetic.css';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { initializeNative } from './lib/platform.ts';
import { setNativeReducedMotion } from './components/motion/kinetic.tsx';

void initializeNative(setNativeReducedMotion).catch(() => {});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
