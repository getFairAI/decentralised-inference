import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Icon,
  IconButton,
  Typography,
} from '@mui/material';
import { Box } from '@mui/system';
import BasicTable from '@/components/basic-table';
import { useLocation, useNavigate, useRouteLoaderData } from 'react-router-dom';
import { NetworkStatus, useQuery } from '@apollo/client';
import { QUERY_REGISTERED_OPERATORS } from '@/queries/graphql';
import {
  APP_VERSION,
  DEFAULT_TAGS,
  MARKETPLACE_ADDRESS,
  REGISTER_OPERATION_TAG,
} from '@/constants';
import { IEdge, ITag } from '@/interfaces/arweave';
import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { useSnackbar } from 'notistack';
import arweave from '@/utils/arweave';
import { toSvg } from 'jdenticon';

const Detail = () => {
  const updatedFee = useRouteLoaderData('model') as string;
  const { state, pathname } = useLocation();
  const navigate = useNavigate();
  const [operatorsData, setOperatorsData] = useState<IEdge[]>([]);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [feeValue, setFeeValue] = useState(0);
  const { enqueueSnackbar } = useSnackbar();
  const [ showOperators, setShowOperators ] = useState(false);
  const elementsPerPage = 5;

  const imgUrl = useMemo(() => {
    const img = toSvg(state.node.id, 100);
    const svg = new Blob([img], { type: 'image/svg+xml' });
    return URL.createObjectURL(svg);
  }, [ state ]);

  const tags = [
    ...DEFAULT_TAGS,
    REGISTER_OPERATION_TAG,
    {
      name: 'Model-Creator',
      values: [state.node.owner.address],
    },
    {
      name: 'Model-Name',
      values: [state.node.tags.find((el: ITag) => el.name === 'Model-Name')?.value],
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
          state.node.tags.find((el: ITag) => el.name === 'Model-Fee')?.value,
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

  const handleClose = () => {
    if (pathname.includes('change-operator')) {
      navigate(pathname.split('/change-operator')[0], { state });
      return;
    }
    navigate('/', { state });
  };

  return (
    <>
      <Dialog open={true} maxWidth={'md'} fullWidth sx={{
        '& .MuiPaper-root': {
          background: 'rgba(61, 61, 61, 0.9)',
          borderRadius: '30px',
        }
      }}>
        <DialogTitle display='flex' justifyContent={'flex-end'} alignItems='center' lineHeight={0}>
          <IconButton onClick={handleClose}>
            <img src='/public/close-icon.svg'/>
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', gap: '48px', justifyContent: 'space-evenly'}}>
          <Box sx={{
            background: 'linear-gradient(to bottom, #000000 10%, rgba(71, 71, 71, 0) 100%)',
            borderRadius: '23px',
            backgroundPosition: 'center',
            width: 'fit-content'
          }}>
            <img src={imgUrl} width='275px' height={'275px'}/>
          </Box>
          <Box display={'flex'} flexDirection={'column'} gap={'16px'}>
            <Box>
              <Typography sx={{
                fontStyle: 'normal',
                fontWeight: 700,
                fontSize: '23px',
                lineHeight: '31px',
                display: 'flex',
                alignItems: 'center',
                textAlign: 'center',
                color: '#FAFAFA',
              }}>Name</Typography>
              <Typography sx={{
                fontStyle: 'normal',
                fontWeight: 400,
                fontSize: '23px',
                lineHeight: '31px',
                display: 'flex',
                alignItems: 'center',
                textAlign: 'center',
                color: '#FAFAFA',
              }}>{state?.node?.tags?.find((el: ITag) => el.name === 'Model-Name')?.value}</Typography>
            </Box>
            <Box>
              <Typography sx={{
                fontStyle: 'normal',
                fontWeight: 700,
                fontSize: '23px',
                lineHeight: '31px',
                display: 'flex',
                alignItems: 'center',
                textAlign: 'center',
                color: '#FAFAFA',
              }}>Category</Typography>
              <Typography sx={{
                fontStyle: 'normal',
                fontWeight: 400,
                fontSize: '23px',
                lineHeight: '31px',
                display: 'flex',
                alignItems: 'center',
                textAlign: 'center',
                color: '#FAFAFA',
              }}>{state?.node?.tags?.find((el: ITag) => el.name === 'Category')?.value}</Typography>
            </Box>
            <Box>
              <Typography sx={{
                fontStyle: 'normal',
                fontWeight: 700,
                fontSize: '23px',
                lineHeight: '31px',
                display: 'flex',
                alignItems: 'center',
                textAlign: 'center',
                color: '#FAFAFA',
              }}>Cost</Typography>
              <Box display={'flex'} alignItems={'center'} justifyContent='space-between' width={'80%'} height='60px'>
                <Typography sx={{
                  display: 'flex',
                  alignItems: 'center',
                  fontStyle: 'normal',
                  fontWeight: 700,
                  fontSize: '60px',
                  lineHeight: '106px',
                  textAlign: 'center',
                  color: '#FAFAFA',
                }}>{feeValue}</Typography>
                <Icon sx={{ height: '50px', width: '50px'}}><img src='/public/arweave-logo.svg' width={'50px'} height={'50px'}/></Icon>
              </Box>
              
            </Box>
          </Box>
          <Box display={'flex'} flexDirection={'column'} gap={'16px'}>
            <Box>
              <Typography sx={{
                fontStyle: 'normal',
                fontWeight: 700,
                fontSize: '23px',
                lineHeight: '31px',
                display: 'flex',
                alignItems: 'center',
                textAlign: 'center',
                color: '#FAFAFA',
              }}>Description</Typography>
              <Typography>{state?.node?.tags?.find((el: ITag) => el.name === 'Description')?.value || 'No Description Available.'}</Typography>
            </Box>
            <Button sx={{
              border: '1px solid #FFFFFF',
              borderRadius: '10px',
              boxSizing: 'border-box'
            }}><Typography>Stamp</Typography></Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{
          justifyContent: 'center'
        }}>
          <Button sx={{
            fontStyle: 'normal',
            fontWeight: 700,
            fontSize: '23px',
            lineHeight: '31px',
            display: 'flex',
            alignItems: 'center',
            textAlign: 'center',
            color: '#FFFFFF',
            borderRadius: '30px'
          }} fullWidth onClick={() => setShowOperators(true)}>Choose an Operator</Button>
        </DialogActions>
        {
          showOperators && <DialogContent>
            <BasicTable
              operators={operatorsData}
              loading={loading}
              error={error}
              state={state}
              retry={handleRetry}
              hasNextPage={hasNextPage}
              fetchMore={fetchMore}
            ></BasicTable>
          </DialogContent>
        }
      </Dialog>
    </>
  );
};

export default Detail;
