import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Root } from './Root';
import Home from '@/pages/home';
import Explore from '@/pages/explore';
import Upload from '@/pages/upload';
import './index.css'
import Model, { txLoader } from '@/pages/model';

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
