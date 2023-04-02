import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Root from './root';
import Home from '@/pages/home';
import Upload from '@/pages/upload';
import Model, { getModelFeeAndAttachments } from '@/pages/model/model';
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
            children: [
              {
                path: 'detail',
                loader: getModelFeeAndAttachments,
                element: <Detail />,
              },
            ],
          },
          {
            path: 'operators/details/:address',
            element: <OperatorDetails />,
          },
        ],
      },
      {
        path: 'model/:txid',
        element: <Model />,
        /* loader: txLoader, */
        id: 'model-alt',
        loader: getModelFeeAndAttachments,
        children: [
          {
            path: 'chat/:address',
            element: (
              <BlockOperatorGuard>
                <ModelFeeGuard>
                  <Chat />
                </ModelFeeGuard>
              </BlockOperatorGuard>
            ),
            children: [
              {
                path: 'change-operator',
                loader: getModelFeeAndAttachments,
                element: <Detail />,
              },
            ],
          },
          {
            path: 'register',
            element: <Register />,
          },
        ],
      },
      {
        path: 'history',
        element: <History />,
      },
      {
        path: 'upload',
        element: <Upload />,
      },
      {
        path: 'operators',
        children: [
          {
            path: '',
            element: <Operators />,
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
