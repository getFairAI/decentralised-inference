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

import {
  TAG_NAMES,
  SCRIPT_CREATION_PAYMENT,
  U_CONTRACT_ID,
  VAULT_ADDRESS,
  SCRIPT_CREATION_FEE,
  U_DIVIDER,
  DEFAULT_TAGS,
} from '@/constants';
import { WalletContext } from '@/context/wallet';
import { IContractEdge, IEdge } from '@/interfaces/arweave';
import { FIND_BY_TAGS } from '@/queries/graphql';
import { findTag, findTagsWithKeyword, isFakeDeleted } from '@/utils/common';
import { NetworkStatus, useQuery } from '@apollo/client';
import {
  DialogActions,
  Button,
  Box,
  Icon,
  Typography,
  InputBase,
  DialogContent,
} from '@mui/material';
import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BasicTable from './basic-table';
import { ModelNavigationState } from '@/interfaces/router';
import { checkHasOperators } from '@/utils/operator';
import { Timeout } from 'react-number-format/types/types';
import { filterPreviousVersions } from '@/utils/script';

const ChooseScript = ({
  setShowScripts,
  handleScriptChosen,
  defaultScriptTx,
  setGlobalLoading,
}: {
  setShowScripts: Dispatch<SetStateAction<boolean>>;
  handleScriptChosen: (scriptTx: IEdge | IContractEdge) => void;
  setGlobalLoading: Dispatch<SetStateAction<boolean>>;
  defaultScriptTx?: IEdge | IContractEdge;
}) => {
  const [scriptsData, setScriptsData] = useState<IContractEdge[]>([]);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [filterValue, setFilterValue] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [filtering, setFiltering] = useState(false);
  const { state }: { state: ModelNavigationState } = useLocation();
  const { currentAddress } = useContext(WalletContext);
  const navigate = useNavigate();
  const elementsPerPage = 5;

  const scriptPaymentInputStr = JSON.stringify({
    function: 'transfer',
    target: VAULT_ADDRESS,
    qty: (parseFloat(SCRIPT_CREATION_FEE) * U_DIVIDER).toString(),
  });

  const scriptPaymentInputNumber = JSON.stringify({
    function: 'transfer',
    target: VAULT_ADDRESS,
    qty: parseFloat(SCRIPT_CREATION_FEE) * U_DIVIDER,
  });

  const tags = [
    ...DEFAULT_TAGS,
    {
      name: TAG_NAMES.operationName,
      values: [SCRIPT_CREATION_PAYMENT],
    },
    {
      name: TAG_NAMES.modelCreator,
      values: [state.modelCreator],
    },
    {
      name: TAG_NAMES.modelName,
      values: [state.modelName],
    },
    {
      name: TAG_NAMES.modelTransaction,
      values: [state.modelTransaction],
    },
    { name: TAG_NAMES.contract, values: [U_CONTRACT_ID] },
    { name: TAG_NAMES.input, values: [scriptPaymentInputStr, scriptPaymentInputNumber] },
  ];

  const {
    data: queryData,
    loading,
    error,
    networkStatus,
    refetch,
    fetchMore,
  } = useQuery(FIND_BY_TAGS, {
    variables: { tags, first: elementsPerPage },
  });

  const showLoading = useMemo(() => loading || filtering, [loading, filtering]);

  const handleRetry = useCallback(() => refetch({ tags }), [refetch, tags]);

  let keyTimeout: Timeout;
  const handleFilterChange = (event: ChangeEvent<HTMLInputElement>) => {
    clearTimeout(keyTimeout);
    keyTimeout = setTimeout(() => {
      setFilterValue(event.target.value);
    }, 500);
  };

  const handleSelected = (index: number) => {
    if (selectedIdx === index) {
      setSelectedIdx(-1); // unselect if clicked on same
    } else {
      setSelectedIdx(index);
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
    if (queryData && networkStatus === NetworkStatus.ready) {
      (async () => {
        const filteredScritps = filterPreviousVersions<IContractEdge[]>(
          queryData.transactions.edges,
        );
        const filtered: IContractEdge[] = [];
        for (const el of filteredScritps) {
          const scriptId = findTag(el, 'scriptTransaction') as string;
          const scriptOwner = findTag(el, 'sequencerOwner') as string;
          if (await isFakeDeleted(scriptId, scriptOwner, 'script')) {
            // if fake deleted ignore
          } else {
            await checkHasOperators(el, filtered);
          }
        }
        setHasNextPage(queryData.transactions.pageInfo.hasNextPage);
        setScriptsData(filtered);
        if (filtered.length === 1) {
          handleScriptChosen(filtered[0]);
          setShowScripts(false);
        } else {
          setGlobalLoading(false);
        }
        setSelectedIdx(filtered.findIndex((el) => el.node.id === defaultScriptTx?.node?.id));
        setFiltering(false);
      })();
    }
  }, [queryData]);

  useEffect(() => {
    if (queryData && filterValue) {
      setFiltering(true);
      setScriptsData(
        queryData.transactions.edges.filter(
          (el: IEdge) =>
            findTagsWithKeyword(el, [TAG_NAMES.scriptName], filterValue) ||
            (findTag(el, 'sequencerOwner') as string)
              .toLowerCase()
              .includes(filterValue.toLowerCase().trim()),
        ),
      );
      setFiltering(false);
    } else if (queryData) {
      setScriptsData(queryData.transactions.edges);
    } else {
      // do nothing
    }
  }, [filterValue]);

  return (
    <>
      <DialogActions
        sx={{
          justifyContent: 'space-between',
          padding: '32px 12px 8px 20px',
        }}
      >
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
          onClick={() => setShowScripts(false)}
        >
          <Box display='flex'>
            <Icon sx={{ rotate: '90deg' }}>
              <img src='./triangle.svg' />
            </Icon>
            <Typography>{' Back to Details'}</Typography>
          </Box>
        </Button>
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
              minWidth: '200px',
            }}
            placeholder='Search by Script Name or Creator...'
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
      <DialogContent sx={{ overflow: 'unset' }}>
        <BasicTable
          type='scripts'
          data={scriptsData}
          loading={showLoading}
          error={error}
          state={state.fullState}
          retry={handleRetry}
          hasNextPage={hasNextPage}
          fetchMore={fetchMore}
          selectedIdx={selectedIdx}
          handleSelected={handleSelected}
        ></BasicTable>
      </DialogContent>
      {selectedIdx >= 0 && (
        <Box
          sx={{
            background: 'transparent', // `linear-gradient(180deg, transparent 10%, ${theme.palette.primary.main} 140%)`,
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
            onClick={() =>
              navigate(
                `/scripts/${findTag(scriptsData[selectedIdx], 'scriptTransaction')}/detail`,
                {
                  state: {
                    scriptName: findTag(scriptsData[selectedIdx], 'scriptName'),
                    scriptTransaction: findTag(scriptsData[selectedIdx], 'scriptTransaction'),
                    scriptCurator: findTag(scriptsData[selectedIdx], 'scriptCurator'),
                    fullState: scriptsData[selectedIdx],
                  },
                },
              )
            }
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
              View Details
            </Typography>
          </Button>
          <Button
            sx={{ borderRadius: '7px' }}
            variant='contained'
            onClick={() => handleScriptChosen(scriptsData[selectedIdx])}
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
              Use Script
            </Typography>
          </Button>
        </Box>
      )}
    </>
  );
};

export default ChooseScript;
