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

import { DEFAULT_TAGS, TAG_NAMES, SCRIPT_CREATION_PAYMENT, REGISTER_OPERATION } from '@/constants';
import { WalletContext } from '@/context/wallet';
import { IEdge } from '@/interfaces/arweave';
import { GET_TX, QUERY_REGISTERED_OPERATORS, QUERY_REGISTERED_SCRIPTS } from '@/queries/graphql';
import { isTxConfirmed } from '@/utils/arweave';
import { findTag } from '@/utils/common';
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
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BasicTable from './basic-table';
import { ModelNavigationState } from '@/interfaces/router';
import { client } from '@/utils/apollo';
import { isValidRegistration } from '@/utils/operator';

const ChooseScript = ({
  setShowScripts,
  handleScriptChosen,
  defaultScriptTx,
}: {
  setShowScripts: Dispatch<SetStateAction<boolean>>;
  handleScriptChosen: (scriptTx: IEdge) => void;
  defaultScriptTx?: IEdge;
}) => {
  const [scriptsData, setScriptsData] = useState<IEdge[]>([]);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [filterValue, setFilterValue] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [filtering, setFiltering] = useState(false);
  const { state }: { state: ModelNavigationState } = useLocation();
  const { currentAddress } = useContext(WalletContext);
  const navigate = useNavigate();
  const elementsPerPage = 5;

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
  ];

  const {
    data: queryData,
    loading,
    error,
    networkStatus,
    refetch,
    fetchMore,
  } = useQuery(QUERY_REGISTERED_SCRIPTS, {
    variables: { tags, first: elementsPerPage, recipients: [state.modelCreator] },
  });

  const showLoading = useMemo(() => loading || filtering, [loading, filtering]);

  const handleRetry = () => {
    refetch({ tags });
  };

  const handleFilterChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFilterValue(event.target.value);
  };

  const handleSelected = (index: number) => {
    if (selectedIdx === index) {
      setSelectedIdx(-1); // unselect if clicked on same
    } else {
      setSelectedIdx(index);
    }
  };

  const checkHasOperators = async (scriptTx: IEdge, filtered: IEdge[]) => {
    const registrationTags = [
      ...DEFAULT_TAGS,
      {
        name: TAG_NAMES.operationName,
        values: [REGISTER_OPERATION],
      },
      {
        name: TAG_NAMES.scriptCurator,
        values: [scriptTx?.node.owner.address],
      },
      {
        name: TAG_NAMES.scriptName,
        values: [findTag(scriptTx, 'scriptName')],
      },
    ];
    const queryResult = await client.query({
      query: QUERY_REGISTERED_OPERATORS,
      variables: { tags: registrationTags, first: elementsPerPage },
    });

    if (queryResult.data.transactions.edges.length === 0) {
      filtered.splice(
        filtered.findIndex((el) => el.node.id === scriptTx.node.id),
        1,
      );
    } else {
      let hasAtLeastOneValid = false;
      for (const registration of queryResult.data.transactions.edges) {
        const opFee = findTag(registration, 'operatorFee') as string;
        const scriptName = findTag(registration, 'scriptName') as string;
        const scriptCurator = findTag(registration, 'scriptCurator') as string;

        if (
          await isValidRegistration(
            opFee,
            registration.node.owner.address,
            scriptName,
            scriptCurator,
          )
        ) {
          hasAtLeastOneValid = true;
        }
      }
      if (!hasAtLeastOneValid) {
        filtered.splice(
          filtered.findIndex((existing) => scriptTx.node.id === existing.node.id),
          1,
        );
      }
    }
  };

  const verify = async (el: IEdge, filtered: IEdge[]) => {
    const confirmed = await isTxConfirmed(el.node.id);
    const existingIdx = filtered.findIndex(
      (existing) => el.node.owner.address === existing.node.owner.address,
    );
    const queryResult = await client.query({
      query: GET_TX,
      variables: {
        id: findTag(el, 'modelTransaction'),
      },
    });
    const modelTx = queryResult.data.transactions.edges[0];
    const correctFee =
      parseInt(el.node.quantity.winston, 10) ===
      parseInt(findTag(modelTx, 'modelFee') as string, 10);
    if (correctFee && existingIdx <= 0) {
      filtered.push(el);
    } else if (confirmed && correctFee && filtered[existingIdx].node.id !== el.node.id) {
      // found a new tx for an existing op, check dates
      const existingTimestamp =
        findTag(filtered[existingIdx], 'unixTime') || filtered[existingIdx].node.block.timestamp;
      const newTimestamp = findTag(el, 'unixTime') || el.node.block.timestamp;
      if (newTimestamp > existingTimestamp) {
        // if new tx has more recent timestamp replace old one
        filtered[existingIdx] = el;
      }
    } else {
      // do nothing
    }
    await checkHasOperators(el, filtered);
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
        const filtered: IEdge[] = [];
        for (const el of queryData.transactions.edges) {
          await verify(el, filtered);
        }
        setHasNextPage(queryData.transactions.pageInfo.hasNextPage);
        setScriptsData(filtered);
        setSelectedIdx(filtered.findIndex((el) => el.node.id === defaultScriptTx?.node?.id));
        setFiltering(false);
      })();
    }
  }, [queryData]);

  useEffect(() => {
    if (queryData && filterValue) {
      setFiltering(true);
      setScriptsData(
        queryData.transactions.edges.filter((el: IEdge) =>
          findTag(el, 'operatorName')?.includes(filterValue),
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
            }}
            placeholder='Search Script...'
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
                    fee: findTag(scriptsData[selectedIdx], 'scriptFee'),
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
