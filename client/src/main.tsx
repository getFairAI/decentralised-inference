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
import { Root } from '@/root';
import Home from '@/pages/home';
import '@/styles/main.css';
import Chat from '@/pages/model/chat';
import History from '@/pages/history';
import BlockOperatorGuard from '@/guards/block-operator';
import ErrorDisplay from '@/pages/error-display';
import SignIn from './pages/sign-in';
import WalletGuard from './guards/wallet';
import Terms from './pages/terms';
import TermsAgreement from './guards/terms-agreement';
import RequestSolution from './pages/request-solution';
import BrowseRequests from './pages/browse-requests';

import '@/index.css';

const router = createHashRouter([
  {
    path: '/',
    element: <Root />,
    errorElement: <ErrorDisplay />,
    children: [
      {
        path: '',
        element: <Home />,
      },
      {
        path: 'chat',
        element: (
          <WalletGuard>
            <BlockOperatorGuard>
              <TermsAgreement>
                <Chat />
              </TermsAgreement>
            </BlockOperatorGuard>
          </WalletGuard>
        ),
      },
      {
        path: 'history',
        element: <History />,
      },
      {
        path: 'sign-in',
        element: <SignIn />,
      },
      {
        path: 'swap',
        element: <SignIn />,
      },
      {
        path: 'terms',
        element: <Terms />,
      },
      {
        path: 'browse',
        element: <BrowseRequests />,
      },
      {
        path: 'request',
        element: (
          <RequestSolution />
        ),
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
