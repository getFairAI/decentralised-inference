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
} from '@mui/material';
import { Box } from '@mui/system';
import BasicTable from '@/components/basic-table';
import { useLocation, useNavigate, useRouteLoaderData } from 'react-router-dom';
import { NetworkStatus, useQuery } from '@apollo/client';
import { QUERY_REGISTERED_OPERATORS } from '@/queries/graphql';
import { DEFAULT_TAGS, REGISTER_OPERATION, TAG_NAMES } from '@/constants';
import { IEdge } from '@/interfaces/arweave';
import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import arweave from '@/utils/arweave';
import { toSvg } from 'jdenticon';
import { findTag } from '@/utils/common';

const Detail = () => {
  const updatedFee = useRouteLoaderData('model') as string;
  const { state, pathname } = useLocation();
  const navigate = useNavigate();
  const [operatorsData, setOperatorsData] = useState<IEdge[]>([]);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [feeValue, setFeeValue] = useState(0);
  const [showOperators, setShowOperators] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [filterValue, setFilterValue] = useState('');
  const elementsPerPage = 5;

  const imgUrl = useMemo(() => {
    const img = toSvg(state.node.id, 100);
    const svg = new Blob([img], { type: 'image/svg+xml' });
    return URL.createObjectURL(svg);
  }, [state]);

  const tags = [
    ...DEFAULT_TAGS,
    {
      name: TAG_NAMES.operationName,
      values: [ REGISTER_OPERATION ]
    },
    {
      name: TAG_NAMES.modelCreator,
      values: [state.node.owner.address],
    },
    {
      name: TAG_NAMES.modelName,
      values: [ findTag(state, 'modelName') ],
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
        const arValue = arweave.ar.winstonToAr(
          findTag(state, 'modelFee') as string
        );
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

  return (
    <Dialog
      open={true}
      maxWidth={'md'}
      fullWidth
      sx={{
        '& .MuiPaper-root': {
          background: 'rgba(61, 61, 61, 0.9)',
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
        {showOperators && (
          <Typography>
            {findTag(state, 'modelName')}
          </Typography>
        )}
        <IconButton onClick={handleClose}>
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
            background: 'linear-gradient(to bottom, #000000 10%, rgba(71, 71, 71, 0) 100%)',
            borderRadius: '23px',
            backgroundPosition: 'center',
            width: 'fit-content',
          }}
        >
          <img src={imgUrl} width='275px' height={'275px'} />
        </Box>
        <Box display={'flex'} flexDirection={'column'} gap={'16px'}>
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
                color: '#FAFAFA',
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
                color: '#FAFAFA',
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
                color: '#FAFAFA',
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
                color: '#FAFAFA',
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
                color: '#FAFAFA',
              }}
            >
              Cost
            </Typography>
            <Box
              display={'flex'}
              alignItems={'center'}
              justifyContent='space-between'
              width={'80%'}
              height='60px'
            >
              <Typography
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  fontStyle: 'normal',
                  fontWeight: 700,
                  fontSize: '60px',
                  lineHeight: '106px',
                  textAlign: 'center',
                  color: '#FAFAFA',
                }}
              >
                {feeValue}
              </Typography>
              <Icon sx={{ height: '50px', width: '50px' }}>
                <img src='/arweave-logo.svg' width={'50px'} height={'50px'} />
              </Icon>
            </Box>
          </Box>
        </Box>
        <Box display={'flex'} flexDirection={'column'} gap={'16px'}>
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
                color: '#FAFAFA',
              }}
            >
              Description
            </Typography>
            <Typography>
              { findTag(state, 'description') ||
                'No Description Available.'}
            </Typography>
          </Box>
          <Button
            sx={{
              border: '1px solid #FFFFFF',
              borderRadius: '10px',
              boxSizing: 'border-box',
            }}
          >
            <Typography>Stamp</Typography>
          </Button>
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
                color: '#FFFFFF',
                borderRadius: '30px',
              }}
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
                background: '#B1B1B1',
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
                  color: '#595959',
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
              color: '#FFFFFF',
              borderRadius: '30px',
            }}
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
            background: 'rgba(0, 0, 0, 0.7)',
            borderRadius: '7px',
            justifyContent: 'center',
            display: 'flex',
            gap: '32px',
            padding: '24px',
          }}
        >
          <Button
            sx={{ background: 'transparent', borderRadius: '7px', border: '1px solid #F4F4F4' }}
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
                color: '#F4F4F4',
              }}
            >
              View History
            </Typography>
          </Button>
          <Button
            sx={{ background: '#F4F4F4', borderRadius: '7px' }}
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
                color: '#151515',
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
