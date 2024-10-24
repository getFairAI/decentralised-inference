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

import { LTIPP_SOLUTION, RETROSPECTIVE_SOLUTION, STIP_SOLUTION } from '@/constants';
import useOperators from '@/hooks/useOperators';
import { useLazyQuery } from '@apollo/client';
import { findByIdDocument, findByTagsQuery } from '@fairai/evm-sdk';
import { Backdrop, CircularProgress, Typography, useTheme } from '@mui/material';
import { ReactElement, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ArbitrumGuard = ({ children }: { children: ReactElement }) => {
  const { state, pathname } = useLocation();
  const theme = useTheme();
  const navigate = useNavigate();
  const [solutions, setSolutions] = useState<findByTagsQuery['transactions']['edges']>([]);

  const [getSolution, { data }] = useLazyQuery(findByIdDocument);
  const { validTxs: operatorsData, loading } = useOperators(solutions);

  useEffect(() => {
    if (state && state.defaultOperator) {
      // skip fetching data if already present
    } else if (state && state.solution) {
      // ifg solution is already present, set it as default
      setSolutions([state.solution]);
    } else if (pathname.includes('ltipp')) {
      // fetch LTIPP solution
      getSolution({ variables: { ids: [LTIPP_SOLUTION] } });
    } else if (pathname.includes('stip')) {
      // fetch STIP solution
      getSolution({ variables: { ids: [STIP_SOLUTION] } });
    } else if (pathname.includes('reports-chat')){
      // use hardcoded operator for retrospective solution
      // getSolution({ variables: { ids: [RETROSPECTIVE_SOLUTION] } });
      //
      // This is a hardcoded operator for the retrospective solution.
      const operator = {
        tx: { node: { id: 'LxoOIo8R30RJPSX1x_-Sz6P58ZI-zsYs-oC8b4Cj8MQ' }},
        evmWallet: '0x9c4E9C275F7E6C17E3e1c8c6BEDF91d835757Fa0',
        evmPublicKey: 'FLBWkjnXHN7Bn6HwEN88Icdm5L9XulHbeb0Z4dgkzW4=',
        arweaveWallet: 'SsoNc_AAEgS1S0cMVUUg3qRUTuNtwQyzsQbGrtTAs-Q',
        operatorFee: 0.1,
        solutionId: RETROSPECTIVE_SOLUTION,
      };
      navigate(
        {},
        {
          state: {
            defaultOperator: operator,
            availableOperators: [ operator ],
            solution: {
              node: {
                id: RETROSPECTIVE_SOLUTION,
                owner: { address: 'SsoNc_AAEgS1S0cMVUUg3qRUTuNtwQyzsQbGrtTAs-Q' },
                tags: [
                  { name: 'Output', value: 'text' },
                  { name: 'Supported-Models', value: '[]' }
                ]
              }
            },
          },
          replace: true,
        }
      );
    } else {
      // if no solution is present, navigate to home
      navigate('/');
    }
  }, [state]);

  useEffect(() => {
    if (solutions.length > 0 && operatorsData && !loading) {
      navigate(
        {},
        {
          state: {
            defaultOperator: operatorsData[0],
            availableOperators: operatorsData,
            solution: solutions[0],
          },
          replace: true,
        },
      );
    }
  }, [solutions, operatorsData, loading]);

  useEffect(() => {
    if (data?.transactions?.edges) {
      setSolutions(data.transactions.edges);
    }
  }, [data]);

  if (!state?.defaultOperator) {
    return (
      <Backdrop
        sx={{
          position: 'absolute',
          zIndex: theme.zIndex.drawer + 1,
          backdropFilter: 'blur(10px)',
          display: 'flex',
          left: '0px',
          right: '0px',
          gap: 3,
        }}
        open={true}
      >
        <CircularProgress sx={{ color: '#fff' }} size='2rem' />
        <Typography variant='h2' color={'#fff'}>
          Fetching Data...
        </Typography>
      </Backdrop>
    );
  } else {
    return children;
  }
};

export default ArbitrumGuard;
