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

import { TAG_NAMES, IS_TO_CHOOSE_MODEL_AUTOMATICALLY, SCRIPT_CREATION, SCRIPT_DELETION, MARKETPLACE_ADDRESS, PROTOCOL_NAME, PROTOCOL_VERSION } from '@/constants';
import { IContractEdge, IEdge } from '@/interfaces/arweave';
import { findTag, findTagsWithKeyword } from '@/utils/common';
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
import { Timeout } from 'react-number-format/types/types';
import { EVMWalletContext } from '@/context/evm-wallet';
import { findByTagsAndOwnersDocument, findByTagsDocument, findByTagsQuery } from '@fairai/evm-sdk';
import { client } from '@/utils/apollo';
import { ModelNavigationState } from '@/interfaces/router';

/* const scriptsFilter = async (data: IContractEdge[]) => {
  const uniqueScripts = FairSDKWeb.utils.filterByUniqueScriptTxId<IContractEdge[]>(data);
  const filteredScritps = FairSDKWeb.utils.filterPreviousVersions<IContractEdge[]>(uniqueScripts as IContractEdge[]);
  const filtered: IContractEdge[] = [];
  for (const el of filteredScritps) {
    const scriptId = FairSDKWeb.utils.findTag(el, 'scriptTransaction') as string;
    const scriptOwner = FairSDKWeb.utils.findTag(el, 'sequencerOwner') as string;
    const sequencerId = FairSDKWeb.utils.findTag(el, 'sequencerTxId') as string;

    const isValidPayment = await FairSDKWeb.utils.isUTxValid(sequencerId);

    if (!isValidPayment) {
      // ignore
    } else if (!scriptOwner || !scriptId) {
      // ignore
    } else if (await isFakeDeleted(scriptId, scriptOwner, 'script')) {
      // if fake deleted ignore
    } else {
      filtered.push(el);
    }
  }

  return filtered;
}; */

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
  const { currentAddress } = useContext(EVMWalletContext);
  const { state } : { state: ModelNavigationState } = useLocation();
  const navigate = useNavigate();

  const {
    data: queryData,
    loading,
    error,
    refetch,
    fetchMore,
    networkStatus,
  } = useQuery(findByTagsDocument, {
    variables: {
      tags: [
        { name: TAG_NAMES.protocolName, values: [ PROTOCOL_NAME, 'Fair Protocol' ]}, // keep Fair Protocol in tags to keep retrocompatibility
        { name: TAG_NAMES.protocolVersion, values: [ '1.0', PROTOCOL_VERSION ]},
        { name: TAG_NAMES.operationName, values: [ SCRIPT_CREATION ]},
        { name: TAG_NAMES.modelTransaction, values: [ state.modelTransaction ]},
      ],
      first: 10,
    },
    /* skip: !model, */
  });

  const showLoading = useMemo(() => loading || filtering, [loading, filtering]);

  const handleRetry = useCallback(() => refetch(), [refetch]);

  const timeoutSeconds = 500;

  let keyTimeout: Timeout;
  const handleFilterChange = (event: ChangeEvent<HTMLInputElement>) => {
    clearTimeout(keyTimeout);
    keyTimeout = setTimeout(() => {
      setFilterValue(event.target.value);
    }, timeoutSeconds);
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
        // uniqueTxIds
        // previousVersions
        const txs = [ ...queryData.transactions.edges ]; // mutable copy of txs
        // sort txs by timestamp
        /* txs.sort((a, b) => {
          const aTimestamp = parseInt(findTag(a, 'unixTime') as string, 10);
          const bTimestamp = parseInt(findTag(b, 'unixTime') as string, 10);
      
          if (aTimestamp === bTimestamp) {
            return 1;
          }
          return bTimestamp - aTimestamp;
        }); */

        const filtered = txs.reduce((acc, el) => {
          acc.push(el);
          // find previousVersionsTag
          const previousVersions= findTag(el, 'previousVersions');
          if (previousVersions) {
            const versionsArray: string[] = JSON.parse(previousVersions);
            // remove previous versions from accumulator array
            const newAcc = acc.filter(el => !versionsArray.includes(el.node.id));
            return newAcc;
          }

          return acc;
        }, [] as findByTagsQuery['transactions']['edges']);

        const filteredCopy = [ ...filtered ];
        for (const tx of filteredCopy) {
          const deleteTags = [
            { name: TAG_NAMES.operationName, values: [ SCRIPT_DELETION ] },
            { name: TAG_NAMES.scriptTransaction, values: [ tx.node.id ] },
          ];
        
          const owners = [ MARKETPLACE_ADDRESS, tx.node.owner.address ];
        
          const data = await client.query({
            query: findByTagsAndOwnersDocument,
            variables: {
              tags: deleteTags, first: filteredCopy.length ,owners,
            }
          });
        
          if (data.data.transactions.edges.length > 0) {
            // remove scripts with cancellations
            filtered.splice(filtered.findIndex(el => el.node.id === tx.node.id), 1);
          }
        }

        setHasNextPage(queryData.transactions.pageInfo.hasNextPage);
        setScriptsData(filtered);

        if (filtered.length === 1 || (IS_TO_CHOOSE_MODEL_AUTOMATICALLY && filtered.length > 1)) {
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
          (el) =>
            findTagsWithKeyword(el, [TAG_NAMES.scriptName], filterValue) ||
            (findTag(el, 'sequencerOwner') as string)
              .toLowerCase()
              .includes(filterValue.toLowerCase().trim()) ||
            el.node.owner.address.toLowerCase().includes(filterValue.toLowerCase().trim()),
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
          }}
          variant='contained'
          onClick={() => setShowScripts(false)}
          className='plausible-event-name=Scripts+Back+Click'
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
            justifyContent: 'center',
            display: 'flex',
            gap: '32px',
            padding: '24px',
          }}
        >
          <Button
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
            className='plausible-event-name=Scripts+View+Details+Click'
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
            variant='contained'
            onClick={() => handleScriptChosen(scriptsData[selectedIdx])}
            disabled={!currentAddress}
            className='plausible-event-name=Scripts+Use+Click'
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
