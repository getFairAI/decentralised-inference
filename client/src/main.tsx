import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Root from './root';
import Home from '@/pages/home';
import Explore from '@/pages/explore';
import Upload from '@/pages/upload';
import Model, { txLoader } from '@/pages/model';
import './styles/main.css';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      {
        path: '',
        element: <Home />
      },
      {
        path: 'explore',
        element: <Explore />
      },
      {
        path: 'upload',
        element: <Upload />
      },
      {
        path: 'model/:txid',
        element: <Model />,
        loader: txLoader,
      }
    ]
  },
]);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
