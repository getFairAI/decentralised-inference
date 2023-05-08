import { DEFAULT_TAGS, TAG_NAMES, SCRIPT_CREATION_PAYMENT } from '@/constants';
import { WalletContext } from '@/context/wallet';
import { IEdge } from '@/interfaces/arweave';
import { GET_TX, QUERY_REGISTERED_SCRIPTS } from '@/queries/graphql';
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
import { ChangeEvent, Dispatch, SetStateAction, useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BasicTable from './basic-table';
import { ModelNavigationState } from '@/interfaces/router';
import { client } from '@/utils/apollo';

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
          const queryResult = await client.query({
            query: GET_TX,
            variables: {
              id: findTag(el, 'modelTransaction'),
            },
          });
          const modelTx = queryResult.data.transactions.edges[0];
          const correctFee =
            parseInt(el.node.quantity.winston, 10) === parseInt(findTag(modelTx, 'modelFee') as string, 10);
          if (correctFee && existingIdx < 0) {
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
          } else {
            // do nothing
          }
        }),
      );
      setHasNextPage(queryData.transactions.pageInfo.hasNextPage);
      setScriptsData(filtered);
      setSelectedIdx(filtered.findIndex((el) => el.node.id === defaultScriptTx?.node?.id));
    };
    // check has paid correct registration fee
    if (queryData && networkStatus === NetworkStatus.ready) {
      asyncWrapper();
    }
  }, [queryData]);

  useEffect(() => {
    if (queryData && filterValue) {
      setScriptsData(
        queryData.transactions.edges.filter((el: IEdge) =>
          findTag(el, 'operatorName')?.includes(filterValue),
        ),
      );
    } else if (queryData) {
      setScriptsData(queryData.transactions.edges);
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
          loading={loading}
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
