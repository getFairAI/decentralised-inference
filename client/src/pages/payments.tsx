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

import PendingCard from '@/components/pending-card';
import {
  TAG_NAMES,
  MODEL_CREATION_PAYMENT,
  SCRIPT_CREATION_PAYMENT,
  REGISTER_OPERATION,
  INFERENCE_PAYMENT,
  U_CONTRACT_ID,
} from '@/constants';
import { WalletContext } from '@/context/wallet';
import useOnScreen from '@/hooks/useOnScreen';
import { IEdge } from '@/interfaces/arweave';
import { FIND_BY_TAGS } from '@/queries/graphql';
import { useQuery } from '@apollo/client';
import {
  Box,
  Typography,
  Button,
  Backdrop,
  CircularProgress,
  useTheme,
  Container,
  Stack,
  InputBase,
  Icon,
} from '@mui/material';
import { useContext, useState, useEffect, useRef, ChangeEvent } from 'react';
import RefreshIcon from '@mui/icons-material/Refresh';
import _ from 'lodash';
import { commonUpdateQuery, findTag } from '@/utils/common';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

const Payments = () => {
  const elementsPerPage = 10;
  const { currentAddress } = useContext(WalletContext);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [filterValue, setFilterValue] = useState('');
  const [filteredValues, setFilteredValues] = useState<IEdge[]>([]);
  const [startDateFilter, setStartDateFilter] = useState<string | null>(null);
  const [endDateFilter, setEndDateFilter] = useState<string | null>(null);
  const theme = useTheme();
  const target = useRef<HTMLDivElement>(null);
  const isOnScreen = useOnScreen(target);

  const { data, previousData, error, loading, refetch, fetchMore } = useQuery(FIND_BY_TAGS, {
    variables: {
      tags: [
        {
          name: TAG_NAMES.sequencerOwner,
          values: [currentAddress],
        },
        {
          name: TAG_NAMES.contract,
          values: [U_CONTRACT_ID],
        },
        {
          name: TAG_NAMES.operationName,
          values: [
            MODEL_CREATION_PAYMENT,
            SCRIPT_CREATION_PAYMENT,
            REGISTER_OPERATION,
            INFERENCE_PAYMENT,
          ],
        },
      ],
      first: elementsPerPage,
    },
    skip: !currentAddress,
    notifyOnNetworkStatusChange: true,
  });

  useEffect(() => {
    if (data && !_.isEqual(data, previousData)) {
      setHasNextPage(data.transactions.pageInfo.hasNextPage);
    }
  }, [data]);

  useEffect(() => {
    if (isOnScreen && hasNextPage) {
      const txs = data.transactions.edges;
      fetchMore({
        variables: {
          after: txs.length > 0 ? txs[txs.length - 1].cursor : undefined,
        },
        updateQuery: commonUpdateQuery,
      });
    }
  }, [isOnScreen, hasNextPage]);

  useEffect(() => {
    if (filterValue && data) {
      const filteredData = data.transactions.edges.filter(
        (el: IEdge) =>
          el.node.id.toLowerCase().indexOf(filterValue) !== -1 ||
          el.node.recipient.toLowerCase().indexOf(filterValue) !== -1 ||
          findTag(el, 'operationName')?.toLowerCase().indexOf(filterValue) !== -1,
      );
      setFilteredValues(filteredData);
    } else if (data) {
      setFilteredValues(data.transactions.edges);
    } else {
      setFilteredValues([]);
    }
  }, [filterValue, data]);

  const refreshClick = () => {
    refetch();
  };

  return (
    <Container sx={{ paddingTop: '16px' }} maxWidth='lg'>
      {error ? (
        <Box display={'flex'} flexDirection={'column'} alignItems={'center'} padding={'16px'}>
          <Typography textAlign={'center'}>
            There Was a Problem Fetching previous payments...
          </Typography>
        </Box>
      ) : data && data.transactions.edges.length === 0 ? (
        <Box>
          <Typography textAlign={'center'}>You Have No Pending Transactions</Typography>
        </Box>
      ) : (
        <>
          <Box paddingLeft={'8px'}>
            <Button
              onClick={refreshClick}
              endIcon={<RefreshIcon />}
              variant='outlined'
              className='plausible-event-name=Payments+Refresh+Click'
            >
              <Typography>Refresh</Typography>
            </Button>
          </Box>
          <Box display={'flex'} justifyContent={'space-between'} padding={'16px 8px'}>
            <Box display={'flex'} gap={'8px'}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label='Start Date'
                  value={startDateFilter}
                  disabled
                  onChange={(newValue: string | null) => setStartDateFilter(newValue)}
                />
                <DatePicker
                  label='End Date'
                  value={endDateFilter}
                  disabled
                  onChange={(newValue: string | null) => setEndDateFilter(newValue)}
                />
              </LocalizationProvider>
            </Box>
            <Box
              width={'40%'}
              sx={{
                borderRadius: '30px',
                display: 'flex',
                justifyContent: 'space-between',
                padding: '3px 20px 3px 0px',
                alignItems: 'center',
                background: theme.palette.background.default,
              }}
            >
              <InputBase
                sx={{
                  fontStyle: 'normal',
                  fontWeight: 400,
                  fontSize: '18px',
                  lineHeight: '16px',
                  width: '100%',
                }}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setFilterValue(event.target.value)
                }
                placeholder='Search By Id, Recipient or Operation Name'
              />
              <Icon
                sx={{
                  height: '30px',
                }}
              >
                <img src='./search-icon.svg'></img>
              </Icon>
            </Box>
          </Box>
          <Stack spacing={2}>
            {filteredValues.map((tx: IEdge) => (
              <PendingCard tx={tx} key={tx.node.id} />
            ))}
          </Stack>
        </>
      )}
      {loading && (
        <Backdrop
          sx={{
            zIndex: (theme) => theme.zIndex.drawer + 1,
            borderRadius: '23px',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            flexDirection: 'column',
          }}
          open={true}
        >
          <Typography variant='h2' color={theme.palette.primary.main}>
            Fetching Latest Payments...
          </Typography>
          <CircularProgress color='primary' />
        </Backdrop>
      )}
      <Box ref={target} sx={{ paddingBottom: '16px' }}></Box>
    </Container>
  );
};

export default Payments;
