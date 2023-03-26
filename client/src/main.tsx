import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Root from './root';
import Home from '@/pages/home';
import Explore from '@/pages/explore';
import Upload from '@/pages/upload';
import Model, { getModelFee } from '@/pages/model/model';
import './styles/main.css';
import Operators from './pages/operators';
import Register from './pages/model/register';
import Detail from './pages/model/detail';
import OperatorDetails from './pages/operator/detail';
import Chat from './pages/model/chat';
import History from './pages/history';
import ModelFeeGuard from './guards/model-fee';
import BlockOperatorGuard from './guards/block-operator';
import Error from '@/pages/error';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    errorElement: <Error />,
    children: [
      {
        path: '',
        element: <Home />,
        children: [
          {
            path: 'model/:txid',
            element: <Model />,
            /* loader: txLoader, */
            loader: getModelFee,
            id: 'model',
            children: [
              {
                path: 'detail',
                element: <Detail />,
              },
    
              {
                path: 'chat/:address',
                element: (
                  <BlockOperatorGuard>
                    <ModelFeeGuard>
                      <Chat />
                    </ModelFeeGuard>
                  </BlockOperatorGuard>
                ),
              },
              {
                path: 'register',
                element: <Register />,
              },
            ],
          },
        ]
      },
      {
        path: 'explore',
        element: <Explore />,
      },
      {
        path: 'upload',
        element: <Upload />,
      },
      {
        path: 'history',
        element: <History />,
      },
      {
        path: 'operators',
        children: [
          {
            path: '',
            element: <Operators />,
          },
          {
            path: 'details/:address',
            element: <OperatorDetails />,
          },
        ],
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
