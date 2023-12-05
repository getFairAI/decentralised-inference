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

import { TAG_NAMES, IS_TO_CHOOSE_MODEL_AUTOMATICALLY } from '@/constants';
import { IContractEdge, IEdge } from '@/interfaces/arweave';
import { findTag, findTagsWithKeyword } from '@/utils/common';
import { useQuery, NetworkStatus } from '@apollo/client';
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
import { WalletContext } from '@/context/wallet';
import { useLocation, useNavigate } from 'react-router-dom';
import FairSDKWeb from '@fair-protocol/sdk/web';
import Stamps, { CountResult } from '@permaweb/stampjs';
import { WarpFactory } from 'warp-contracts';
import Arweave from 'arweave';

const OperatorSelected = ({
  operatorsData,
  scriptTx,
  selectedIdx,
}: {
  operatorsData: IContractEdge[];
  scriptTx?: IEdge | IContractEdge;
  selectedIdx: number;
}) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { currentAddress } = useContext(WalletContext);

  const handleHistoryClick = useCallback(() => {
    const opAddress =
      (findTag(operatorsData[selectedIdx], 'sequencerOwner') as string) ??
      operatorsData[selectedIdx].node.owner.address;
    navigate(`/operators/details/${opAddress}`, {
      state: {
        operatorName: findTag(operatorsData[selectedIdx], 'operatorName'),
        fullState: operatorsData[selectedIdx],
      },
    });
  }, [navigate, scriptTx, operatorsData, selectedIdx]);

  const handleUseOperatorClick = useCallback(() => {
    const opOwner =
      (findTag(operatorsData[selectedIdx], 'sequencerOwner') as string) ??
      operatorsData[selectedIdx].node.owner.address;
    const scriptCurator = findTag(scriptTx as IEdge, 'sequencerOwner') as string;
    const state = {
      modelCreator: findTag(scriptTx as IEdge, 'modelCreator'),
      scriptName: findTag(scriptTx as IEdge, 'scriptName'),
      fee: findTag(operatorsData[selectedIdx], 'operatorFee'),
      scriptTransaction: findTag(scriptTx as IEdge, 'scriptTransaction'),
      fullState: scriptTx,
      operatorRegistrationTx: operatorsData[selectedIdx].node.id,
      scriptCurator,
    };
    if (pathname.includes('chat')) {
      return navigate(pathname.replace(pathname.split('/chat/')[1], opOwner), { state });
    } else {
      return navigate(`/chat/${opOwner}`, { state });
    }
  }, [navigate, scriptTx, operatorsData, selectedIdx, pathname]);

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
      <Button sx={{ borderRadius: '7px' }} variant='outlined' onClick={handleHistoryClick}>
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
  setGlobalLoading,
}: {
  setShowOperators?: Dispatch<SetStateAction<boolean>>;
  scriptTx?: IEdge | IContractEdge;
  setGlobalLoading?: Dispatch<SetStateAction<boolean>>;
}) => {
  const [operatorsData, setOperatorsData] = useState<IContractEdge[]>([]);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [filterValue, setFilterValue] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [filtering, setFiltering] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [txsCountsMap, setTxsCountsMap] = useState<Map<string, CountResult>>(new Map());

  const scriptId = findTag(scriptTx as IEdge, 'scriptTransaction') as string;
  const scriptName = findTag(scriptTx as IEdge, 'scriptName');
  const scriptCurator = findTag(scriptTx as IEdge, 'sequencerOwner');

  const queryObject = FairSDKWeb.utils.getOperatorQueryForScript(
    scriptId,
    scriptName,
    scriptCurator,
  );
  const {
    data: queryData,
    loading,
    error,
    networkStatus,
    refetch,
    fetchMore,
  } = useQuery(queryObject.query, {
    variables: queryObject.variables,
    skip: !scriptTx,
  });

  const showLoading = useMemo(() => loading || filtering, [loading, filtering]);

  const handleRetry = useCallback(() => refetch(), [refetch]);

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

  const checkSingleOperator = (filtered: IContractEdge[]) => {
    if (
      (filtered.length === 1 || (IS_TO_CHOOSE_MODEL_AUTOMATICALLY && filtered.length > 1)) &&
      !!setShowOperators
    ) {
      const opOwner =
        (findTag(filtered[0], 'sequencerOwner') as string) ?? filtered[0].node.owner.address;
      const state = {
        modelCreator: findTag(scriptTx as IEdge, 'modelCreator'),
        scriptName: findTag(scriptTx as IEdge, 'scriptName'),
        fee: findTag(filtered[0], 'operatorFee'),
        scriptTransaction: findTag(scriptTx as IEdge, 'scriptTransaction'),
        fullState: scriptTx,
        operatorRegistrationTx: filtered[0].node.id,
        scriptCurator,
      };

      if (pathname.includes('chat')) {
        navigate(pathname.replace(pathname.split('/chat/')[1], opOwner), { state });
      } else {
        navigate(`/chat/${opOwner}`, { state });
      }
      setShowOperators(false);
    } else if (setGlobalLoading) {
      setGlobalLoading(false);
    } else {
      // ignore
    }
  };

  /**
   * @description Effect that runs on query data changes;
   * it is responsible to set the nextPage status and to update current loaded transactionsm
   * filtering correct payments and repeated operators
   */
  useEffect(() => {
    if (networkStatus === NetworkStatus.loading) {
      setFiltering(true);
    }
    // check has paid correct registration fee
    if (queryData && networkStatus === NetworkStatus.ready) {
      // use immediately invoked function to be able to call async operations in useEffect
      (async () => {
        const filtered: IContractEdge[] = await FairSDKWeb.utils.operatorsFilter(
          queryData.transactions.edges,
        );
        setHasNextPage(queryData.transactions.pageInfo.hasNextPage);
        // sort by fee
        filtered.sort((a, b) => {
          const aFee = Number(findTag(a, 'operatorFee'));
          const bFee = Number(findTag(b, 'operatorFee'));
          return aFee - bFee;
        });
        setOperatorsData(filtered);
        checkSingleOperator(filtered);
        setFiltering(false);
      })();
    }
  }, [queryData]);

  useEffect(() => {
    const transformCountsToObjectMap = (counts: CountResult[]): Map<string, CountResult> =>
      new Map(Object.entries(counts));

    const totalStamps = async (targetTxs: (string | undefined)[]) => {
      try {
        const filteredTxsIds = targetTxs.filter((txId) => txId !== undefined) as string[];
        const stampsInstance = Stamps.init({
          warp: WarpFactory.forMainnet(),
          arweave: Arweave.init({}),
          wallet: window.arweaveWallet,
          dre: 'https://dre-u.warp.cc/contract',
          graphql: 'https://arweave.net/graphql',
        });
        const counts = await stampsInstance.counts(filteredTxsIds);

        return transformCountsToObjectMap(counts);
      } catch (errorObj) {
        return new Map<string, CountResult>();
      }
    };

    const fetchData = async () => {
      if (operatorsData.length !== 0) {
        const operatorTxs = operatorsData.map((item) => item.node.id);
        const stampsMap = await totalStamps(operatorTxs);
        setTxsCountsMap(stampsMap);
      }
    };

    fetchData();
  }, [operatorsData]);

  useEffect(() => {
    if (queryData && filterValue) {
      setFiltering(true);
      setOperatorsData(
        queryData.transactions.edges.filter(
          (el: IEdge) =>
            findTagsWithKeyword(el, [TAG_NAMES.operatorName], filterValue) ||
            el.node.owner.address.toLowerCase().includes(filterValue.toLowerCase().trim()),
        ),
      );
      setFiltering(false);
    } else if (queryData) {
      setOperatorsData(queryData.transactions.edges);
    } else {
      // do nothing
    }
  }, [filterValue]);

  return (
    <>
      <ChooseOperatorHeader setFilterValue={setFilterValue} setShowOperators={setShowOperators} />
      <DialogContent sx={{ overflow: 'unset' }}>
        <BasicTable
          type='operators'
          data={operatorsData}
          txsCountsMap={txsCountsMap}
          loading={showLoading}
          error={error}
          state={scriptTx as IEdge}
          retry={handleRetry}
          hasNextPage={hasNextPage}
          fetchMore={fetchMore}
          selectedIdx={selectedIdx}
          handleSelected={handleSelected}
        ></BasicTable>
      </DialogContent>
      {selectedIdx >= 0 && (
        <OperatorSelected
          operatorsData={operatorsData}
          scriptTx={scriptTx}
          selectedIdx={selectedIdx}
        />
      )}
    </>
  );
};

export default ChooseOperator;
