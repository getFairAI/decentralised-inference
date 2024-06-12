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

import { LTIPP_SOLUTION, STIP_SOLUTION } from '@/constants';
import { useLazyQuery } from '@apollo/client';
import { findByIdDocument } from '@fairai/evm-sdk';
import { ReactElement, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ArbitrumGuard = ({ children }: { children: ReactElement }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [ getSolution, { data }] = useLazyQuery(findByIdDocument);

  useEffect(() => {
    if (pathname.includes('ltipp')) {
      getSolution({ variables: { ids: [ LTIPP_SOLUTION ] } });
    } else if (pathname.includes('stip')) {
      getSolution({ variables: { ids: [ STIP_SOLUTION ] } });
    } else {
      navigate('/'); // Redirect to home page if the path is not a solution path
    }
  }, [ pathname ]);

  useEffect(() => {
    if (data) {
      navigate({}, { state: {
        defaultOperator: '',
        availableOperators: [],
        solution: data.transactions.edges[0],
      }, replace: true });
    }
  }, [data]);

  return children;
};

export default ArbitrumGuard;
