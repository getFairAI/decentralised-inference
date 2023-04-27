import {
  DEFAULT_TAGS,
  TAG_NAMES,
  REGISTER_OPERATION,
  OPERATOR_REGISTRATION_AR_FEE,
} from '@/constants';
import { IEdge } from '@/interfaces/arweave';
import { QUERY_REGISTERED_OPERATORS } from '@/queries/graphql';
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
import { ChangeEvent, Dispatch, SetStateAction, useContext, useEffect, useState } from 'react';
import BasicTable from './basic-table';
import { WalletContext } from '@/context/wallet';
import { useLocation, useNavigate } from 'react-router-dom';

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
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { currentAddress } = useContext(WalletContext);
  const elementsPerPage = 5;

  const tags = [
    ...DEFAULT_TAGS,
    {
      name: TAG_NAMES.operationName,
      values: [ REGISTER_OPERATION ],
    },
    {
      name: TAG_NAMES.scriptCurator,
      values: [ scriptTx?.node.owner.address ],
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
    skip: !scriptTx
  });

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

  /**
   * @description Effect that runs on query data changes;
   * it is responsible to set the nextPage status and to update current loaded transactionsm
   * filtering correct payments and repeated operators
   */
  useEffect(() => {
    const asyncWrapper = async () => {
      const filtered: IEdge[] = [];
      await Promise.all(
        queryData.transactions.edges.map(async (el: IEdge) => {
          const confirmed = await isTxConfirmed(el.node.id);
          const existingIdx = filtered.findIndex(
            (existing) => el.node.owner.address === existing.node.owner.address,
          );
          const correctFee =
            parseInt(el.node.quantity.ar) === parseInt(OPERATOR_REGISTRATION_AR_FEE);
          if (confirmed && correctFee && existingIdx < 0) {
            filtered.push(el);
          } else if (confirmed && correctFee && filtered[existingIdx].node.id !== el.node.id) {
            // found a new tx for an existing op, check dates
            const existingTimestamp =
              findTag(filtered[existingIdx], 'unixTime') ||
              filtered[existingIdx].node.block.timestamp;
            const newTimestamp = findTag(el, 'unixTime') || el.node.block.timestamp;
            if (newTimestamp > existingTimestamp) {
              // if new tx has more recent timestamp replace old one
              filtered[existingIdx] = el;
            }
          }
        }),
      );
      setHasNextPage(queryData.transactions.pageInfo.hasNextPage);
      setOperatorsData(filtered);
    };
    // check has paid correct registration fee
    if (queryData && networkStatus === NetworkStatus.ready) {
      asyncWrapper();
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
          onClick={() => setShowOperators(false)}
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
              navigate(`/operators/details/${operatorsData[selectedIdx].node.owner.address}`, {
                state: { operatorName: findTag(operatorsData[selectedIdx], 'operatorName') },
              })
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
              View History
            </Typography>
          </Button>
          <Button
            sx={{ borderRadius: '7px' }}
            variant='contained'
            onClick={() =>
              navigate(
                pathname.includes('chat')
                  ? pathname.replace(
                      pathname.split('/chat/')[1],
                      operatorsData[selectedIdx].node.owner.address,
                    )
                  : `../chat/${operatorsData[selectedIdx].node.owner.address}`,
                {
                  state: {
                    scriptName: findTag(scriptTx as IEdge, 'scriptName'),
                    scriptCurator: (scriptTx as IEdge).node.owner.address,
                    fee: findTag(operatorsData[selectedIdx], 'operatorFee'),
                    scriptTransaction: (scriptTx as IEdge).node.id,
                    fullState: scriptTx,
                  },
                },
              )
            }
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
      )}
    </>
  );
};

export default ChooseOperator;
