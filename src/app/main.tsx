import '../shared/fonts';
import '../shared/styles/base.css';
import './app.css';
import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ToastProvider } from '../shared/components/Toast';
import { createQueryClient } from '../shared/query';
import { Shell } from './Shell';
import { DiscoverPage } from './pages/DiscoverPage';
import { MePage } from './pages/MePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PlacePage } from './pages/PlacePage';
import { RatePage } from './pages/RatePage';
import { StatsPage } from './pages/StatsPage';

const router = createBrowserRouter([
  {
    element: <Shell />,
    children: [
      { path: '/', element: <DiscoverPage /> },
      // The map library is large: load it only on the pages that show a map.
      { path: '/map', lazy: () => import('./pages/MapPage').then((m) => ({ Component: m.MapPage })) },
      { path: '/add', lazy: () => import('./pages/PlaceFormPage').then((m) => ({ Component: m.AddPlacePage })) },
      { path: '/places/:id', element: <PlacePage /> },
      { path: '/places/:id/rate', element: <RatePage /> },
      {
        path: '/places/:id/edit',
        lazy: () => import('./pages/PlaceFormPage').then((m) => ({ Component: m.EditPlacePage })),
      },
      { path: '/stats', element: <StatsPage /> },
      { path: '/me', element: <MePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={createQueryClient()}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>
  </StrictMode>,
);
