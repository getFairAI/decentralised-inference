import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Root from './root';
import Home from '@/pages/home';
import Explore from '@/pages/explore';
import Upload from '@/pages/upload';
import Model, { txLoader } from '@/pages/model/model';
import './styles/main.css';
import Operators from './pages/operators';
import Register from './pages/model/register';
import Detail from './pages/model/detail';

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
        path: 'operators',
        element: <Operators />
      },
      {
        path: 'model/:txid',
        element: <Model />,
        loader: txLoader,
        id: 'model',
        children: [
          {
            path: 'detail',
            element: <Detail />
          },
          {
            path: 'register',
            element: <Register />
          }
        ]
      }
    ]
  },
]);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
