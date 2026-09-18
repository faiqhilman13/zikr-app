import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/noto-sans-arabic';
import './i18n';
import './styles.css';
import { App } from './App';
import { ErrorBoundary } from './components/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><ErrorBoundary><App /></ErrorBoundary></React.StrictMode>
);
