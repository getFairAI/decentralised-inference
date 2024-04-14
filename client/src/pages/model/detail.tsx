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
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Icon,
  IconButton,
  Typography,
  useTheme,
  Box,
  Backdrop,
  CircularProgress,
} from '@mui/material';
import {
  useLoaderData,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { toSvg } from 'jdenticon';
import { findTag } from '@/utils/common';
import { ModelNavigationState, RouteLoaderResult } from '@/interfaces/router';
import ChooseOperator from '@/components/choose-operator';
import ChooseScript from '@/components/choose-script';
import { IContractEdge, IEdge } from '@/interfaces/arweave';
import StampsMenu from '@/components/stamps-menu';
import { Close } from '@mui/icons-material';
import { ChooseWalletContext } from '@/context/choose-wallet';
import { EVMWalletContext } from '@/context/evm-wallet';

const DetailContent = ({
  showOperators,
  showScripts,
  showWalletWarning,
  imgUrl,
  setShowOperators,
  setShowWalletWarning,
  setShowScripts,
  setFiltering,
}: {
  showOperators: boolean;
  showScripts: boolean;
  showWalletWarning: boolean;
  imgUrl: string;
  setShowOperators: Dispatch<SetStateAction<boolean>>;
  setShowScripts: Dispatch<SetStateAction<boolean>>;
  setShowWalletWarning: Dispatch<SetStateAction<boolean>>;
  setFiltering: Dispatch<SetStateAction<boolean>>;
}) => {
  const { state }: { state: ModelNavigationState } = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentAddress } = useContext(EVMWalletContext);

  const [scriptTx, setScriptTx] = useState<IEdge | IContractEdge | undefined>(undefined);
  const { setOpen: setChooseWalletOpen } = useContext(ChooseWalletContext);

  const handleScriptChosen = useCallback(
    (tx: IEdge | IContractEdge) => {
      setShowOperators(true);
      setScriptTx(tx);
    },
    [setShowOperators, setScriptTx],
  );

  const handleUseModel = useCallback(() => {
    if (!currentAddress) {
      setShowWalletWarning(true);
    } else {
      setShowWalletWarning(false);
      setShowScripts(true);
      setFiltering(true);
    }
  }, [setShowScripts, setFiltering, setShowWalletWarning, currentAddress]);

  useEffect(() => {
    if (searchParams) {
      searchParams.forEach((value, key) => {
        if (key === 'useModel' && value === 'true') {
          setShowScripts(true);
          setFiltering(true);
        }
      });
    }
  }, [searchParams, setShowScripts, setFiltering]);

  useEffect(() => {
    if (showWalletWarning && currentAddress) {
      setShowWalletWarning(false);
    }
  }, [showWalletWarning, currentAddress]);

  const handleConnectClick = useCallback(() => setChooseWalletOpen(true), [setChooseWalletOpen]);

  const handleOnboardingClick = useCallback(() => navigate('/sign-in'), [navigate]);

  if (showWalletWarning) {
    return (
      <>
        <DialogContent sx={{ display: 'flex', justifyContent: 'center', padding: '0 32px' }}>
          <Typography fontSize={'1.2rem'}>
            {
              "Hey there! To use this awesome feature, you'll need to have an Arweave wallet. Don't worry, it's super easy to set up and we're here to guide you through the process. Are you ready to get started?"
            }
          </Typography>
        </DialogContent>
        <DialogActions sx={{ padding: '16px 32px 16px 16px', gap: '16px' }}>
          <Button
            variant='outlined'
            onClick={handleConnectClick}
            className='plausible-event-name=Model+Connect+Wallet'
          >
            <Typography>Connect</Typography>
          </Button>
          <Button
            variant='contained'
            onClick={handleOnboardingClick}
            className='plausible-event-name=Onboarding+Click'
          >
            <Typography>Start Onboarding</Typography>
          </Button>
        </DialogActions>
      </>
    );
  }

  if (showOperators) {
    return (
      <ChooseOperator
        setShowOperators={setShowOperators}
        scriptTx={scriptTx}
        setGlobalLoading={setFiltering}
      />
    );
  }

  if (showScripts) {
    return (
      <ChooseScript
        setShowScripts={setShowScripts}
        handleScriptChosen={handleScriptChosen}
        defaultScriptTx={scriptTx}
        setGlobalLoading={setFiltering}
      />
    );
  }

  return (
    <>
      <DialogContent
        sx={{
          display: showOperators || showScripts ? 'none' : 'flex',
          gap: '48px',
          justifyContent: 'space-evenly',
        }}
      >
        <Box
          sx={{
            borderRadius: '23px',
            width: '317px',
            height: '352px',
            background: `url(${imgUrl ? imgUrl : ''})`,
            // backgroundPosition: 'center',s
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover' /* <------ */,
            backgroundPosition: 'center center',
          }}
        />
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
              data-testid='model-name'
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
              data-testid='model-name-value'
            >
              {state.modelName}
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
              {findTag(state.fullState, 'modelCategory')}
            </Typography>
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
            <Typography>
              {findTag(state.fullState, 'description') ?? 'No Description Available.'}
            </Typography>
            <Box marginTop={'20px'}>
              <StampsMenu
                id={findTag(state.fullState, 'modelTransaction') ?? ''}
                type='Model'
              ></StampsMenu>
            </Box>
          </Box>
        </Box>
      </DialogContent>
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
          }}
          variant='contained'
          onClick={handleUseModel}
          data-testid='choose-script-button'
          className={`plausible-event-name=Use+Model+Click plausible-event-model=${state.modelTransaction}+${state.modelName}`}
        >
          <Box display='flex'>
            <Typography>{'Use Model'}</Typography>
            <Icon sx={{ rotate: '-90deg' }}>
              <img src='./triangle.svg' />
            </Icon>
          </Box>
        </Button>
      </DialogActions>
    </>
  );
};

const Detail = () => {
  const loaderData = useLoaderData() as RouteLoaderResult;
  const { state, pathname }: { state: ModelNavigationState; pathname: string } = useLocation();
  const { txid } = useParams();
  const navigate = useNavigate();
  const [showOperators, setShowOperators] = useState(false);
  const [showScripts, setShowScripts] = useState(false);
  const [showWalletWarning, setShowWalletWarning] = useState(false);
  const [filtering, setFiltering] = useState(false);
  const theme = useTheme();

  const imgUrl = useMemo(() => {
    if (loaderData?.avatarTxId) {
      return `https://arweave.net/${loaderData?.avatarTxId}`;
    }
    const img = toSvg(txid, 100);
    const svg = new Blob([img], { type: 'image/svg+xml' });
    return URL.createObjectURL(svg);
  }, [loaderData]);

  // disable update fees on model for now

  const handleClose = () => {
    if (pathname.includes('change-operator')) {
      navigate(pathname.split('/change-operator')[0], { state });
      return;
    }
    navigate('/', { state });
  };

  return (
    <>
      <Dialog
        open={true}
        maxWidth={showWalletWarning ? 'sm' : 'lg'}
        fullWidth={!showWalletWarning}
        sx={{
          '& .MuiPaper-root': {
            background:
              theme.palette.mode === 'dark'
                ? theme.palette.neutral.main
                : theme.palette.background.default,
            borderRadius: '30px',
          },
          display: filtering ? 'none' : 'block',
        }}
      >
        <DialogTitle
          display='flex'
          justifyContent={showOperators || showScripts ? 'space-between' : 'flex-end'}
          alignItems='center'
          lineHeight={0}
        >
          {(showOperators || showScripts) && <Typography>{state.modelName}</Typography>}
          <IconButton
            onClick={handleClose}
            size='small'
            className='plausible-event-name=Close+Model+Click'
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DetailContent
          showOperators={showOperators}
          showScripts={showScripts}
          showWalletWarning={showWalletWarning}
          imgUrl={imgUrl}
          setShowScripts={setShowScripts}
          setShowOperators={setShowOperators}
          setShowWalletWarning={setShowWalletWarning}
          setFiltering={setFiltering}
        />
      </Dialog>
      <Backdrop open={filtering}>
        <CircularProgress size='5rem' />
      </Backdrop>
    </>
  );
};

export default Detail;
