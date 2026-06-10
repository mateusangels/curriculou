import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'sonner';
import CurriculouPage from './cvzap/CurriculouPage';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Toaster position="top-center" richColors />
    <CurriculouPage />
  </React.StrictMode>,
);
