import { CustomStepper } from '@/components/stepper';
import {
  MARKETPLACE_ADDRESS,
  APP_VERSION,
  TAG_NAMES,
  APP_NAME,
  REGISTER_OPERATION,
} from '@/constants';
import { IEdge } from '@/interfaces/arweave';
import { RouteLoaderResult } from '@/interfaces/router';
import arweave from '@/utils/arweave';
import { findTag } from '@/utils/common';
import {
  Container,
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Icon,
} from '@mui/material';
import { toSvg } from 'jdenticon';
import { useSnackbar } from 'notistack';
import { useMemo, useState } from 'react';
import { useLocation, useRouteLoaderData } from 'react-router-dom';

const Register = () => {
  const { updatedFee, avatarTxId } = (useRouteLoaderData('model-alt') as RouteLoaderResult) || {};
  const { state }: { state: IEdge } = useLocation();
  const [isRegistered, setIsRegistered] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const imgUrl = useMemo(() => {
    if (avatarTxId) {
      return `https://arweave.net/${avatarTxId}`;
    }
    const img = toSvg(state.node.id, 100);
    const svg = new Blob([img], { type: 'image/svg+xml' });
    return URL.createObjectURL(svg);
  }, [state, avatarTxId]);

  const handleRegister = async (rate: string, operatorName: string) => {
    try {
      const tx = await arweave.createTransaction({
        target: MARKETPLACE_ADDRESS,
        quantity: arweave.ar.arToWinston('0.05'),
      });
      const tags = [];
      tags.push({ name: TAG_NAMES.appName, values: APP_NAME });
      tags.push({ name: TAG_NAMES.appVersion, values: APP_VERSION });
      tags.push({
        name: TAG_NAMES.modelName,
        values: findTag(state, 'modelName') || '',
      });
      tags.push({ name: TAG_NAMES.modelCreator, values: state.node.owner.address });
      tags.push({
        name: TAG_NAMES.modelTransaction,
        values: findTag(state, 'modelTransaction') as string,
      });
      tags.push({ name: TAG_NAMES.operatorFee, values: arweave.ar.arToWinston(rate) });
      tags.push({ name: TAG_NAMES.operationName, values: REGISTER_OPERATION });
      tags.push({ name: TAG_NAMES.operatorName, values: operatorName });
      tags.push({ name: TAG_NAMES.unixTime, values: (Date.now() / 1000).toString() });

      tags.forEach((tag) => tx.addTag(tag.name, tag.values));

      await arweave.transactions.sign(tx);
      const response = await arweave.transactions.post(tx);
      if (response.status === 200) {
        enqueueSnackbar(
          <>
            Operator Registration Submitted.
            <br></br>
            <a href={`https://viewblock.io/arweave/tx/${tx.id}`} target={'_blank'} rel='noreferrer'>
              <u>View Transaction in Explorer</u>
            </a>
          </>,
          { variant: 'success' },
        );
        setIsRegistered(true);
      } else {
        enqueueSnackbar('Something went Wrong. Please Try again...', { variant: 'error' });
      }
    } catch (error) {
      enqueueSnackbar('Something went Wrong. Please Try again...', { variant: 'error' });
    }
  };

  return (
    <Container>
      <Box sx={{ margin: '8px' }}>
        <Card sx={{
          background: 'rgba(61, 61, 61, 0.98)',
          borderRadius: '30px',
        }}>
          <CardHeader title='Register Operator'></CardHeader>
          <CardContent
            sx={{
              display: 'flex',
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
                    {arweave.ar.winstonToAr(updatedFee || findTag(state, 'modelFee') || '0')}
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
                  {findTag(state, 'description') || 'No Description Available'}
                </Typography>
              </Box>
            </Box>
          </CardContent>
          <CardContent>
            <CustomStepper data={state} handleSubmit={handleRegister} isRegistered={isRegistered} />
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default Register;
