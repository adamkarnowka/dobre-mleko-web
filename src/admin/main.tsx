import '../shared/fonts';
import '../shared/styles/base.css';
import './admin.css';
import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ToastProvider } from '../shared/components/Toast';
import { createQueryClient } from '../shared/query';
import { AdminApp } from './AdminApp';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={createQueryClient()}>
      <ToastProvider>
        <AdminApp />
      </ToastProvider>
    </QueryClientProvider>
  </StrictMode>,
);
