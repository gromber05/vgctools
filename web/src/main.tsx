import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '../src/app/App';
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/dm-sans';
import '@fontsource/jetbrains-mono/500.css';
import '../src/styles/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
