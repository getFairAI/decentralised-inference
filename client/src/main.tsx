/*
 * Fair Protocol, open source decentralised inference marketplace for artificial intelligence.
 * Copyright (C) 2023 Fair Protocol
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 * 
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import Root from '@/root';
import Home from '@/pages/home';
import Curators from '@/pages/curators';
import UploadCreator from '@/pages/upload-creator';
import Model, { getModelFeeAndAttachments } from '@/pages/model/model';
import '@/styles/main.css';
import Operators from '@/pages/operators';
import Register from '@/pages/script/register';
import Detail from '@/pages/model/detail';
import OperatorDetails from '@/pages/operator/operator-details';
import Chat from '@/pages/model/chat';
import History from '@/pages/history';
import BlockOperatorGuard from '@/guards/block-operator';
import ErrorDisplay from '@/pages/error-display';
import Payments from '@/pages/payments';
import { getScriptAttachments } from './pages/script/script';
import ScriptFeeGuard from '@/guards/script-fee';
import ScriptDetails from './pages/script/script-details';

const router = createHashRouter([
  {
    path: '/',
    element: <Root />,
    errorElement: <ErrorDisplay />,
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
          {
            path: 'scripts/:txid/detail',
            loader: getScriptAttachments,
            element: <ScriptDetails />,
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
                <ScriptFeeGuard>
                  <Chat />
                </ScriptFeeGuard>
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
        ],
      },
      {
        path: 'history',
        element: <History />,
      },
      {
        path: 'upload-creator',
        element: <UploadCreator />,
      },
      {
        path: 'upload',
        element: <Curators />,
      },
      {
        path: 'operators',
        children: [
          {
            path: '',
            element: <Operators />,
            children: [
              {
                path: 'register/:txid/',
                id: 'register',
                loader: getScriptAttachments,
                element: <Register />,
              },
            ],
          },
        ],
      },
      {
        path: 'payments',
        element: <Payments />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
