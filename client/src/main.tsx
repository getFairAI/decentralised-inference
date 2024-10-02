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
import { createHashRouter, Outlet, RouterProvider } from 'react-router-dom';
import { Root } from '@/root';
import Home from '@/pages/home';
import '@/styles/main.css';
import Chat from '@/pages/model/chat';
import BlockOperatorGuard from '@/guards/block-operator';
import ErrorDisplay from '@/pages/error-display';
import SignIn from './pages/sign-in';
import Terms from './pages/terms';
import TermsAgreement from './guards/terms-agreement';
import RequestSolution from './pages/request-solution';
import BrowseRequests from './pages/browse-requests';
import BrowseArbitrumRequests from './pages/browse-arbitrum-requests';
import RequestArbitrumUpdate from './pages/request-arbitrum-update';

import '@/index.css';
import ArbitrumGuard from './guards/arbitrum';

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
        children: [
          {
            path: '',
            element: (
              <ArbitrumGuard>
                <BlockOperatorGuard>
                
                  <TermsAgreement>
                    <Chat />
                  </TermsAgreement>
                </BlockOperatorGuard>
              </ArbitrumGuard>
            ),
          },
          {
            path: 'arbitrum',
            element: (
              <ArbitrumGuard>
                <TermsAgreement>
                  <Outlet />
                </TermsAgreement>
              </ArbitrumGuard>
            ),
            children: [
              {
                path: 'ltipp',
                element: <Chat />,
              },
              {
                path: 'stip',
                element: <Chat />,
              },
            ],
          },
        ],
      },
      // {
      //   path: 'img2img-chat',
      //   element: (
      //     <WalletGuard>
      //       <BlockOperatorGuard>
      //         <TermsAgreement>
      //           <Img2ImgChat />
      //         </TermsAgreement>
      //       </BlockOperatorGuard>
      //     </WalletGuard>
      //   ),
      // },
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
        path: 'browse-arbitrum-requests',
        element: <BrowseArbitrumRequests />,
      },
      {
        path: 'request',
        element: <RequestSolution />,
      },
      {
        path: 'request-arbitrum-update',
        element: <RequestArbitrumUpdate />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
