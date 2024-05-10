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

import { findTag } from '@/utils/common';
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  Icon,
  InputBase,
  Typography,
} from '@mui/material';
import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import BasicTable from './basic-table';
import { useLocation, useNavigate } from 'react-router-dom';
import { EVMWalletContext } from '@/context/evm-wallet';
import { findByIdQuery, findByTagsQuery, findAvailableOperators } from '@fairai/evm-sdk';
import { ApolloQueryResult, NetworkStatus, QueryResult } from '@apollo/client';
import { IContractEdge, IEdge } from '@/interfaces/arweave';

const OperatorSelected = ({
  operatorsData,
  selectedIdx,
}: {
  operatorsData: { tx: findByTagsQuery['transactions']['edges'][0], evmWallet: `0x${string}`, arweaveWallet: string, operatorFee: number }[];
  selectedIdx: number;
}) => {
  const navigate = useNavigate();
  const { state, pathname } = useLocation();
  const { currentAddress } = useContext(EVMWalletContext);

  const handleHistoryClick = useCallback(() => {
    const op = operatorsData[selectedIdx];
    navigate(`/operators/details/${op.arweaveWallet}`, {
      state: {
        operatorName: findTag(op.tx, 'operatorName'),
        fullState: operatorsData[selectedIdx],
      },
    });
  }, [navigate, operatorsData, selectedIdx]);

  const handleUseOperatorClick = useCallback(() => {
    const scriptTx = state.fullState;
    const opOwner = operatorsData[selectedIdx].arweaveWallet;
    const scriptCurator = scriptTx.node.owner.address;
    const newState = {
      modelCreator: findTag(scriptTx as IEdge, 'modelCreator'),
      scriptName: findTag(scriptTx as IEdge, 'scriptName'),
      operatorEvmWallet: operatorsData[selectedIdx].evmWallet,
      fee: operatorsData[selectedIdx].operatorFee,
      scriptTransaction: scriptTx.node.id,
      fullState: scriptTx,
      operatorRegistrationTx: operatorsData[selectedIdx].tx,
      scriptCurator,
    };
    if (pathname.includes('chat')) {
      return navigate(pathname.replace(pathname.split('/chat/')[1], opOwner), { state: newState });
    } else {
      return navigate(`/chat/${opOwner}`, { state: newState });
    }
  }, [navigate, state, operatorsData, selectedIdx, pathname]);

  return (
    <Box
      sx={{
        background: 'transparent',
        borderRadius: '7px',
        justifyContent: 'center',
        display: 'flex',
        gap: '32px',
        padding: '24px',
      }}
    >
      <Button
        sx={{ borderRadius: '7px' }}
        variant='outlined'
        onClick={handleHistoryClick}
        className='plausible-event-name=Operator+View+History+Click'
      >
        <Typography
          sx={{
            fontStyle: 'normal',
            fontWeight: 500,
            fontSize: '15px',
            lineHeight: '20px',
            display: 'flex',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          View History
        </Typography>
      </Button>
      <Button
        sx={{ borderRadius: '7px' }}
        variant='contained'
        onClick={handleUseOperatorClick}
        disabled={!currentAddress}
        className='plausible-event-name=Operator+Use+Click'
      >
        <Typography
          sx={{
            fontStyle: 'normal',
            fontWeight: 500,
            fontSize: '15px',
            lineHeight: '20px',
            display: 'flex',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          Use Operator
        </Typography>
      </Button>
    </Box>
  );
};

const ChooseOperatorHeader = ({
  setShowOperators,
  setFilterValue,
}: {
  setShowOperators?: Dispatch<SetStateAction<boolean>>;
  setFilterValue: Dispatch<SetStateAction<string>>;
}) => {
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  const handleFilterChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const timeoutDelay = 500;
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      } else {
        // ignore
      }
      timeoutIdRef.current = setTimeout(() => {
        setFilterValue(event.target.value);
      }, timeoutDelay);
    },
    [setFilterValue],
  );

  const handleBackClick = useCallback(() => {
    if (setShowOperators) {
      setShowOperators(false);
    } else {
      // ignore
    }
  }, [setShowOperators]);

  return (
    <DialogActions
      sx={{
        justifyContent: setShowOperators ? 'space-between' : 'flex-end',
        padding: '32px 12px 8px 20px',
      }}
    >
      {!!setShowOperators && (
        <Button
          sx={{
            fontStyle: 'normal',
            fontWeight: 700,
            fontSize: '23px',
            lineHeight: '31px',
            display: 'flex',
            alignItems: 'flex-start',
            textAlign: 'left',
            borderRadius: '30px',
          }}
          variant='contained'
          onClick={handleBackClick}
          className='plausible-event-name=Operator+Back+Click'
        >
          <Box display='flex'>
            <Icon sx={{ rotate: '90deg' }}>
              <img src='./triangle.svg' />
            </Icon>
            <Typography>{' Back to Scripts'}</Typography>
          </Box>
        </Button>
      )}
      <Box
        sx={{
          background: 'transparent',
          border: '2px solid',
          borderRadius: '30px',
          margin: '0 20px',
          display: 'flex',
          justifyContent: 'space-between',
          padding: '3px 20px 3px 20px',
          alignItems: 'center',
        }}
      >
        <InputBase
          sx={{
            fontStyle: 'normal',
            fontWeight: 400,
            fontSize: '12px',
            lineHeight: '16px',
            minWidth: '210px',
          }}
          placeholder='Search by Operator Name or Address...'
          onChange={handleFilterChange}
        />
        <Icon
          sx={{
            height: '30px',
          }}
        >
          <img src='./search-icon.svg'></img>
        </Icon>
      </Box>
    </DialogActions>
  );
};

const ChooseOperator = ({
  setShowOperators,
  scriptTx,
  setGlobalLoading
}: {
  setShowOperators?: Dispatch<SetStateAction<boolean>>;
  scriptTx: IEdge | IContractEdge
  setGlobalLoading?: Dispatch<SetStateAction<boolean>>;
}) => {
  const [operatorsData, setOperatorsData] = useState<{ tx: findByTagsQuery['transactions']['edges'][0], evmWallet: `0x${string}`, arweaveWallet: string, operatorFee: number }[]>([]);
  const [hasNextPage] = useState(false);
  const [, setFilterValue] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [filtering ] = useState(false);
  const navigate = useNavigate();
  const [txsCountsMap, setTxsCountsMap] = useState<Record<string, number>>({});
  const { countStamps } = useContext(EVMWalletContext);
  const { state } = useLocation();

  const showLoading = useMemo(() => filtering, [ filtering]);

  const handleSelected = useCallback(
    (index: number) => {
      if (selectedIdx === index) {
        setSelectedIdx(-1); // unselect if clicked on same
      } else {
        setSelectedIdx(index);
      }
    },
    [setSelectedIdx],
  );

  useEffect(() => {
    if (scriptTx) {
      (async () => {
        const scriptWrapper = { transactions: { edges: [ scriptTx ] }};
        const results = await findAvailableOperators(scriptWrapper as unknown as findByIdQuery);
        setTxsCountsMap(await countStamps(results.map(r => r.tx.node.id)));
        if (results.length > 0 && !!results[0]) {
          setOperatorsData(results); 
          const scriptCurator = scriptTx.node.owner.address;
          navigate(`/chat/${results[0].arweaveWallet}`, {
            state: {
              ...state,
              modelCreator: findTag(scriptTx as IEdge, 'modelCreator'),
              scriptName: findTag(scriptTx as IEdge, 'scriptName'),
              operatorEvmWallet: results[0].evmWallet,
              operatorPubKey: results[0].evmPublicKey,
              fee: results[0].operatorFee,
              scriptTransaction: scriptTx.node.id,
              fullState: scriptTx,
              operatorRegistrationTx: results[0].tx,
              scriptCurator,
            }
          });
        } else if (setGlobalLoading) {
          setGlobalLoading(false);
        }
      })();
    }
  }, [ state ]);

  const handleRetry = () => ({});
  const fetchMore: QueryResult<findByTagsQuery>['fetchMore'] =
    async <TFetchData=findByTagsQuery>() =>
      ({ data: { transactions: { edges: [], pageInfo: { hasNextPage: false } } }, loading: false, networkStatus: {} as NetworkStatus }) as ApolloQueryResult<TFetchData>;

  return (
    <>
      <ChooseOperatorHeader setFilterValue={setFilterValue} setShowOperators={setShowOperators} />
      <DialogContent sx={{ overflow: 'unset' }}>
        <BasicTable
          type='operators'
          data={operatorsData}
          txsCountsMap={txsCountsMap}
          loading={showLoading}
          retry={handleRetry}
          fetchMore={fetchMore}
          hasNextPage={hasNextPage}
          selectedIdx={selectedIdx}
          handleSelected={handleSelected}
        ></BasicTable>
      </DialogContent>
      {selectedIdx >= 0 && (
        <OperatorSelected
          operatorsData={operatorsData}
          selectedIdx={selectedIdx}
        />
      )}
    </>
  );
};

export default ChooseOperator;
