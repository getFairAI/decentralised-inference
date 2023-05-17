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
  DEFAULT_TAGS,
  TAG_NAMES,
  REGISTER_OPERATION,
  OPERATOR_REGISTRATION_AR_FEE,
  N_PREVIOUS_BLOCKS,
  INFERENCE_PERCENTAGE_FEE,
  VAULT_ADDRESS,
} from '@/constants';
import { IEdge } from '@/interfaces/arweave';
import {
  QUERY_PAYMENT_TO_VAULT_WITH,
  QUERY_REGISTERED_OPERATORS,
  QUERY_REQUESTS_FOR_OPERATOR,
  QUERY_TX_WITH,
} from '@/queries/graphql';
import { isTxConfirmed } from '@/utils/arweave';
import { findTag } from '@/utils/common';
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
  useState,
} from 'react';
import BasicTable from './basic-table';
import { WalletContext } from '@/context/wallet';
import { useLocation, useNavigate } from 'react-router-dom';
import { client } from '@/utils/apollo';

const OperatorSelected = ({
  operatorsData,
  scriptTx,
  selectedIdx,
}: {
  operatorsData: IEdge[];
  scriptTx?: IEdge;
  selectedIdx: number;
}) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { currentAddress } = useContext(WalletContext);

  const handleHistoryClick = useCallback(
    () =>
      navigate(`/operators/details/${operatorsData[selectedIdx].node.owner.address}`, {
        state: {
          operatorName: findTag(operatorsData[selectedIdx], 'operatorName'),
          scriptFee: findTag(scriptTx as IEdge, 'scriptFee'),
          fullState: operatorsData[selectedIdx],
        },
      }),
    [navigate, scriptTx, operatorsData, selectedIdx],
  );

  const handleUseOperatorClick = useCallback(() => {
    const state = {
      scriptName: findTag(scriptTx as IEdge, 'scriptName'),
      scriptCurator: (scriptTx as IEdge).node.owner.address,
      fee: findTag(operatorsData[selectedIdx], 'operatorFee'),
      scriptTransaction: findTag(scriptTx as IEdge, 'scriptTransaction'),
      fullState: scriptTx,
    };
    if (pathname.includes('chat')) {
      return navigate(
        pathname.replace(
          pathname.split('/chat/')[1],
          operatorsData[selectedIdx].node.owner.address,
        ),
        { state },
      );
    } else {
      return navigate(`/chat/${operatorsData[selectedIdx].node.owner.address}`, { state });
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

const ChooseOperator = ({
  setShowOperators,
  scriptTx,
}: {
  setShowOperators: Dispatch<SetStateAction<boolean>>;
  scriptTx?: IEdge;
}) => {
  const [operatorsData, setOperatorsData] = useState<IEdge[]>([]);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [filterValue, setFilterValue] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const elementsPerPage = 5;

  const tags = [
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
      values: [findTag(scriptTx as IEdge, 'scriptName')],
    },
  ];

  const {
    data: queryData,
    loading,
    error,
    networkStatus,
    refetch,
    fetchMore,
  } = useQuery(QUERY_REGISTERED_OPERATORS, {
    variables: { tags, first: elementsPerPage },
    skip: !scriptTx,
  });

  const handleRetry = useCallback(() => {
    refetch({ tags });
  }, [refetch]);

  const handleFilterChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setFilterValue(event.target.value);
    },
    [setFilterValue],
  );

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

  const getOperatorRequests = async (address: string) => {
    const { data } = await client.query({
      query: QUERY_REQUESTS_FOR_OPERATOR,
      variables: {
        recipient: address,
        first: N_PREVIOUS_BLOCKS,
        tags: [...DEFAULT_TAGS],
      },
    });

    return data.transactions.edges as IEdge[];
  };

  const hasOperatorAnswered = async (request: IEdge, opAddress: string) => {
    const tags = [
      ...DEFAULT_TAGS,
      { name: TAG_NAMES.requestTransaction, values: [findTag(request, 'inferenceTransaction')] },
      { name: TAG_NAMES.operationName, values: ['Script Inference Response'] },
    ];

    const { data } = await client.query({
      query: QUERY_TX_WITH,
      variables: { tags, address: opAddress },
    });

    if (data.transactions.edges.length === 0) {
      return false;
    } else {
      return true;
    }
  };

  const hasOperatorDistributedFees = async (
    request: IEdge,
    operatorFee: string,
    opAddress: string,
  ) => {
    const distributionAmount = parseFloat(operatorFee) * INFERENCE_PERCENTAGE_FEE;
    const tags = [
      ...DEFAULT_TAGS,
      { name: TAG_NAMES.requestTransaction, values: [findTag(request, 'inferenceTransaction')] },
      { name: TAG_NAMES.operationName, values: ['Fee Redistribution'] },
    ];

    const { data } = await client.query({
      query: QUERY_PAYMENT_TO_VAULT_WITH,
      variables: { tags, owner: opAddress, recipient: VAULT_ADDRESS },
    });

    if (data.transactions.edges.length === 0) {
      return false;
    } else {
      const paymentTx = data.transactions.edges[0];
      return distributionAmount === parseFloat(paymentTx.node.quantity.winston);
    }
  };

  const isValidRegistration = async (operatorFee: string, opAddress: string) => {
    const lastRequests = await getOperatorRequests(opAddress);
    let isValid = true;
    // check if operator answere last 7 requests
    for (const request of lastRequests) {
      // check if operator has answered last 7 requests
      if (!(await hasOperatorAnswered(request, opAddress))) {
        isValid = false;
        break;
      }
      // check if operator has distributed fees for last 7 requests
      if (!(await hasOperatorDistributedFees(request, operatorFee, opAddress))) {
        isValid = false;
        break;
      }
    }

    return isValid;
  };

  const verify = async (el: IEdge, filtered: IEdge[]) => {
    const confirmed = await isTxConfirmed(el.node.id);
    const opFee = findTag(el, 'operatorFee') as string;
    const existingIdx = filtered.findIndex(
      (existing) => el.node.owner.address === existing.node.owner.address,
    );
    const correctFee =
      parseInt(el.node.quantity.ar, 10) === parseInt(OPERATOR_REGISTRATION_AR_FEE, 10);
    if (confirmed && correctFee && existingIdx < 0) {
      if (await isValidRegistration(opFee, el.node.owner.address)) {
        filtered.push(el);
      }
    } else if (confirmed && correctFee && filtered[existingIdx].node.id !== el.node.id) {
      // found a new tx for an existing op, check dates
      const existingTimestamp =
        findTag(filtered[existingIdx], 'unixTime') ?? filtered[existingIdx].node.block.timestamp;
      const newTimestamp = findTag(el, 'unixTime') ?? el.node.block.timestamp;
      if (newTimestamp > existingTimestamp) {
        // if new tx has more recent timestamp replace old one
        if (await isValidRegistration(opFee, el.node.owner.address)) {
          filtered[existingIdx] = el;
        }
      }
    } else {
      // if tx is not confirmed or fee is not correct, skip adding it to list
    }
  };

  /**
   * @description Effect that runs on query data changes;
   * it is responsible to set the nextPage status and to update current loaded transactionsm
   * filtering correct payments and repeated operators
   */
  useEffect(() => {
    // check has paid correct registration fee
    if (queryData && networkStatus === NetworkStatus.ready) {
      // use immediately invoked function to be able to call async operations in useEffect
      (async () => {
        const filtered: IEdge[] = [];

        await Promise.all(
          queryData.transactions.edges.map(async (el: IEdge) => verify(el, filtered)),
        );
        setHasNextPage(queryData.transactions.pageInfo.hasNextPage);
        setOperatorsData(filtered);
      })();
    }
  }, [queryData]);

  useEffect(() => {
    if (queryData && filterValue) {
      setOperatorsData(
        queryData.transactions.edges.filter((el: IEdge) =>
          findTag(el, 'operatorName')?.includes(filterValue),
        ),
      );
    } else if (queryData) {
      setOperatorsData(queryData.transactions.edges);
    } else {
      // do nothing
    }
  }, [filterValue]);

  const handleBackClick = useCallback(() => {
    setShowOperators(false);
  }, []);

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
          onClick={handleBackClick}
        >
          <Box display='flex'>
            <Icon sx={{ rotate: '90deg' }}>
              <img src='./triangle.svg' />
            </Icon>
            <Typography>{' Back to Scripts'}</Typography>
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
            placeholder='Search operator...'
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
          type='operators'
          data={operatorsData}
          loading={loading}
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
