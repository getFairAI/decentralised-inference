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
import useOperators from '@/hooks/useOperators';
import { useLazyQuery } from '@apollo/client';
import { findByIdDocument } from '@fairai/evm-sdk';
import { Backdrop, CircularProgress, Typography, useTheme } from '@mui/material';
import { ReactElement, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ArbitrumGuard = ({ children }: { children: ReactElement }) => {
  const { pathname, state } = useLocation();
  const theme = useTheme();
  const navigate = useNavigate();

  const [getSolution, { data }] = useLazyQuery(findByIdDocument);
  const { validTxs: operatorsData } = useOperators(data?.transactions.edges || []);

  useEffect(() => {
    if (pathname.includes('ltipp')) {
      getSolution({ variables: { ids: [LTIPP_SOLUTION] } });
    } else if (pathname.includes('stip')) {
      getSolution({ variables: { ids: [STIP_SOLUTION] } });
    } else {
      navigate('/'); // Redirect to home page if the path is not a solution path
    }
  }, [pathname]);

  useEffect(() => {
    if (data && operatorsData) {
      navigate(
        {},
        {
          state: {
            defaultOperator: operatorsData[0],
            availableOperators: operatorsData,
            solution: data.transactions.edges[0],
          },
          replace: true,
        },
      );
    }
  }, [data, operatorsData]);

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
