import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Icon,
  IconButton,
  InputBase,
  Typography,
  useTheme,
} from '@mui/material';
import { Box } from '@mui/system';
import BasicTable from '@/components/basic-table';
import { useLoaderData, useLocation, useNavigate, useParams } from 'react-router-dom';
import { NetworkStatus, useQuery } from '@apollo/client';
import { QUERY_REGISTERED_OPERATORS } from '@/queries/graphql';
import {
  APP_NAME,
  APP_VERSION,
  DEFAULT_TAGS,
  MARKETPLACE_ADDRESS,
  MODEL_FEE_UPDATE,
  REGISTER_OPERATION,
  TAG_NAMES,
} from '@/constants';
import { IEdge } from '@/interfaces/arweave';
import { ChangeEvent, useContext, useEffect, useMemo, useState } from 'react';
import arweave from '@/utils/arweave';
import { toSvg } from 'jdenticon';
import { findTag } from '@/utils/common';
import { RouteLoaderResult } from '@/interfaces/router';
import { useSnackbar } from 'notistack';
import { WalletContext } from '@/context/wallet';
import { NumericFormat } from 'react-number-format';

const Detail = () => {
  const { updatedFee, avatarTxId } = useLoaderData() as RouteLoaderResult;
  const { state, pathname } = useLocation();
  const { txid } = useParams();
  const navigate = useNavigate();
  const [operatorsData, setOperatorsData] = useState<IEdge[]>([]);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [feeValue, setFeeValue] = useState(0);
  const [feeDirty, setFeeDirty] = useState(false);
  const [showOperators, setShowOperators] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [filterValue, setFilterValue] = useState('');
  const elementsPerPage = 5;
  const { enqueueSnackbar } = useSnackbar();
  const { currentAddress } = useContext(WalletContext);
  const theme = useTheme();

  const imgUrl = useMemo(() => {
    if (avatarTxId) {
      return `https://arweave.net/${avatarTxId}`;
    }
    const img = toSvg(txid, 100);
    const svg = new Blob([img], { type: 'image/svg+xml' });
    return URL.createObjectURL(svg);
  }, [state]);

  const tags = [
    ...DEFAULT_TAGS,
    {
      name: TAG_NAMES.operationName,
      values: [REGISTER_OPERATION],
    },
    {
      name: TAG_NAMES.modelCreator,
      values: [state.node.owner.address],
    },
    {
      name: TAG_NAMES.modelName,
      values: [findTag(state, 'modelName')],
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
  });

  const handleRetry = () => {
    refetch({ tags });
  };

  useEffect(() => {
    if (state) {
      if (updatedFee) {
        const arValue = arweave.ar.winstonToAr(updatedFee);
        setFeeValue(parseFloat(arValue));
      } else {
        const arValue = arweave.ar.winstonToAr(findTag(state, 'modelFee') as string);
        setFeeValue(parseFloat(arValue));
      }
    }
  }, [state]);

  useEffect(() => {
    // check has paid correct registration fee
    if (queryData && networkStatus === NetworkStatus.ready) {
      setHasNextPage(queryData.transactions.pageInfo.hasNextPage);
      const uniqueOperators = Array.from(
        new Set(queryData.transactions.edges.map((el: IEdge) => el.node.owner.address)),
      );
      setOperatorsData(
        queryData.transactions.edges.filter(
          (el: IEdge) => !!uniqueOperators.find((unique) => unique === el.node.owner.address),
        ),
      );
    }
  }, [queryData]);

  useEffect(() => {
    if (queryData && filterValue) {
      setOperatorsData(
        queryData.transactions.edges.filter((el: IEdge) =>
          findTag(el, 'operatorName')?.includes(filterValue),
        ),
      );
    }
  }, [filterValue]);

  const handleClose = () => {
    if (pathname.includes('change-operator')) {
      navigate(pathname.split('/change-operator')[0], { state });
      return;
    }
    navigate('/', { state });
  };

  const handleSelected = (index: number) => {
    if (selectedIdx === index) {
      setSelectedIdx(-1); // unselect if clicked on same
    } else {
      setSelectedIdx(index);
    }
  };

  const handleFilterChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFilterValue(event.target.value);
  };

  const updateFee = async () => {
    try {
      const tx = await arweave.createTransaction({
        quantity: arweave.ar.arToWinston('0'),
        target: MARKETPLACE_ADDRESS,
      });
      tx.addTag(TAG_NAMES.appName, APP_NAME);
      tx.addTag(TAG_NAMES.appVersion, APP_VERSION);
      tx.addTag(TAG_NAMES.operationName, MODEL_FEE_UPDATE);
      tx.addTag(TAG_NAMES.modelName, findTag(state, 'modelName') as string);
      tx.addTag(TAG_NAMES.modelTransaction, findTag(state, 'modelTransaction') as string);
      tx.addTag(TAG_NAMES.modelFee, arweave.ar.arToWinston(`${feeValue}`));
      tx.addTag(TAG_NAMES.unixTime, (Date.now() / 1000).toString());
      await arweave.transactions.sign(tx);
      const payRes = await arweave.transactions.post(tx);
      if (payRes.status === 200) {
        enqueueSnackbar(
          <>
            Updated Model Fee
            <br></br>
            <a href={`https://viewblock.io/arweave/tx/${tx.id}`} target={'_blank'} rel='noreferrer'>
              <u>View Transaction in Explorer</u>
            </a>
          </>,
          {
            variant: 'success',
          },
        );
        setFeeDirty(false);
      } else {
        enqueueSnackbar(`Failed with error ${payRes.status}: ${payRes.statusText}`, {
          variant: 'error',
        });
      }
    } catch (err) {
      enqueueSnackbar('Something Went Wrong', { variant: 'error' });
    }
  };

  const handleFeeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const val = event.target.value !== '' ? parseFloat(event.target.value) : 0;
    setFeeValue(val);
    setFeeDirty(true);
  };

  return (
    <Dialog
      open={true}
      maxWidth={'lg'}
      fullWidth
      sx={{
        '& .MuiPaper-root': {
          background:
            theme.palette.mode === 'dark'
              ? theme.palette.neutral.main
              : theme.palette.background.default,
          borderRadius: '30px',
        },
      }}
    >
      <DialogTitle
        display='flex'
        justifyContent={showOperators ? 'space-between' : 'flex-end'}
        alignItems='center'
        lineHeight={0}
      >
        {showOperators && <Typography>{findTag(state, 'modelName')}</Typography>}
        <IconButton
          onClick={handleClose}
          sx={{
            background: theme.palette.primary.main,
            '&:hover': { background: theme.palette.primary.main, opacity: 0.8 },
          }}
        >
          <img src='/close-icon.svg' />
        </IconButton>
      </DialogTitle>
      <DialogContent
        sx={{
          display: showOperators ? 'none' : 'flex',
          gap: '48px',
          justifyContent: 'space-evenly',
        }}
      >
        <Box
          sx={{
            background: 'linear-gradient(180deg, #474747 0%, rgba(71, 71, 71, 0) 100%)',
            borderRadius: '23px',
            backgroundPosition: 'center',
            width: 'fit-content',
            '&::after': {
              height: '100%',
              width: '100%',
              content: '""',
              display: 'block',
              position: 'relative',
              bottom: '281px',
              borderRadius: '23px',
            },
          }}
        >
          <img src={imgUrl} width='275px' height={'275px'} style={{ borderRadius: '23px' }} />
        </Box>
        <Box display={'flex'} flexDirection={'column'} gap={'16px'} width={'30%'}>
          <Box>
            <Typography
              sx={{
                fontStyle: 'normal',
                fontWeight: 700,
                fontSize: '23px',
                lineHeight: '31px',
                display: 'flex',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              Name
            </Typography>
            <Typography
              sx={{
                fontStyle: 'normal',
                fontWeight: 400,
                fontSize: '23px',
                lineHeight: '31px',
                display: 'flex',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              {findTag(state, 'modelName')}
            </Typography>
          </Box>
          <Box>
            <Typography
              sx={{
                fontStyle: 'normal',
                fontWeight: 700,
                fontSize: '23px',
                lineHeight: '31px',
                display: 'flex',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              Category
            </Typography>
            <Typography
              sx={{
                fontStyle: 'normal',
                fontWeight: 400,
                fontSize: '23px',
                lineHeight: '31px',
                display: 'flex',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              {findTag(state, 'category')}
            </Typography>
          </Box>
          <Box>
            <Typography
              sx={{
                fontStyle: 'normal',
                fontWeight: 700,
                fontSize: '23px',
                lineHeight: '31px',
                display: 'flex',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              Cost
            </Typography>
            <Box
              display={'flex'}
              alignItems={'center'}
              justifyContent='flex-start'
              width={'100%'}
              height='60px'
            >
              {currentAddress === state.node.owner.address ? (
                <NumericFormat
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    fontStyle: 'normal',
                    fontWeight: 700,
                    fontSize: '60px',
                    lineHeight: '106px',
                    textAlign: 'center',

                    paddingRight: '8px',
                  }}
                  value={feeValue}
                  onChange={handleFeeChange}
                  customInput={InputBase}
                  decimalScale={3}
                  decimalSeparator={'.'}
                />
              ) : (
                <Typography
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    fontStyle: 'normal',
                    fontWeight: 700,
                    fontSize: '60px',
                    lineHeight: '106px',
                    textAlign: 'center',

                    paddingRight: '8px',
                  }}
                >
                  {feeValue}
                </Typography>
              )}
              <Icon sx={{ height: '50px', width: '50px' }}>
                <img
                  src={
                    theme.palette.mode === 'dark'
                      ? '/arweave-logo.svg'
                      : '/arweave-logo-for-light.png'
                  }
                  width={'50px'}
                  height={'50px'}
                />
              </Icon>
            </Box>
          </Box>
        </Box>
        <Box display={'flex'} flexDirection={'column'} gap={'16px'} width={'45%'}>
          <Box>
            <Typography
              sx={{
                fontStyle: 'normal',
                fontWeight: 700,
                fontSize: '23px',
                lineHeight: '31px',
                display: 'flex',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              Description
            </Typography>
            <Typography>{findTag(state, 'description') || 'No Description Available.'}</Typography>
          </Box>
          {currentAddress === state.node.owner.address ? (
            <Button variant='outlined' disabled={!feeDirty && feeValue >= 0} onClick={updateFee}>
              Update
            </Button>
          ) : (
            <Button
              sx={{
                border: `1px solid ${theme.palette.primary.main}`,
                borderRadius: '10px',
                boxSizing: 'border-box',
              }}
            >
              <Typography>Stamp</Typography>
            </Button>
          )}
        </Box>
      </DialogContent>
      {showOperators ? (
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
                  <img src='/triangle.svg' />
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
                placeholder='Search operator...'
                onChange={handleFilterChange}
              />
              <Icon
                sx={{
                  height: '30px',
                }}
              >
                <img src='/search-icon.svg'></img>
              </Icon>
            </Box>
          </DialogActions>
          <DialogContent sx={{ overflow: 'unset' }}>
            <BasicTable
              operators={operatorsData}
              loading={loading}
              error={error}
              state={state}
              retry={handleRetry}
              hasNextPage={hasNextPage}
              fetchMore={fetchMore}
              selectedIdx={selectedIdx}
              handleSelected={handleSelected}
            ></BasicTable>
          </DialogContent>
        </>
      ) : (
        <DialogActions
          sx={{
            justifyContent: 'center',
          }}
        >
          <Button
            sx={{
              fontStyle: 'normal',
              fontWeight: 700,
              fontSize: '23px',
              lineHeight: '31px',
              display: 'flex',
              alignItems: 'center',
              textAlign: 'center',
              borderRadius: '30px',
            }}
            variant='contained'
            onClick={() => setShowOperators(true)}
          >
            <Box display='flex'>
              <Typography>{'Choose an Operator '}</Typography>
              <Icon sx={{ rotate: '-90deg' }}>
                <img src='/triangle.svg' />
              </Icon>
            </Box>
          </Button>
        </DialogActions>
      )}
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
                state: {
                  modelName: findTag(state, 'modelName'),
                  modelCreator: state.node.owner.address,
                  operatorFee: findTag(operatorsData[selectedIdx], 'operatorFee'),
                  operatorName: findTag(operatorsData[selectedIdx], 'operatorName'),
                },
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
                    modelName: findTag(state, 'modelName'),
                    modelCreator: state.node.owner.address,
                    fee: findTag(operatorsData[selectedIdx], 'operatorFee'),
                    modelTransaction: findTag(state, 'modelTransaction'),
                    fullState: state,
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
              Use Operator
            </Typography>
          </Button>
        </Box>
      )}
    </Dialog>
  );
};

export default Detail;
