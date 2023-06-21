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
} from '@mui/material';
import { Box } from '@mui/system';
import { useLoaderData, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { toSvg } from 'jdenticon';
import { findTag } from '@/utils/common';
import { ModelNavigationState, RouteLoaderResult } from '@/interfaces/router';
import ChooseOperator from '@/components/choose-operator';
import ChooseScript from '@/components/choose-script';
import { IEdge } from '@/interfaces/arweave';
import Vote from '@/components/vote';

const Detail = () => {
  const loaderData = useLoaderData() as RouteLoaderResult;
  const { state, pathname }: { state: ModelNavigationState; pathname: string } = useLocation();
  const { txid } = useParams();
  const navigate = useNavigate();
  const [showOperators, setShowOperators] = useState(false);
  const [showScripts, setShowScripts] = useState(false);
  const [scriptTx, setScriptTx] = useState<IEdge | undefined>(undefined);
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

  const handleScriptChosen = (scriptTx: IEdge) => {
    setShowOperators(true);
    setScriptTx(scriptTx);
  };

  const showScriptsFragment = () => {
    return showScripts ? (
      <ChooseScript
        setShowScripts={setShowScripts}
        handleScriptChosen={handleScriptChosen}
        defaultScriptTx={scriptTx}
      />
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
          onClick={() => setShowScripts(true)}
          data-testid='choose-script-button'
        >
          <Box display='flex'>
            <Typography>{'Choose a Script '}</Typography>
            <Icon sx={{ rotate: '-90deg' }}>
              <img src='./triangle.svg' />
            </Icon>
          </Box>
        </Button>
      </DialogActions>
    );
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
        justifyContent={showOperators || showScripts ? 'space-between' : 'flex-end'}
        alignItems='center'
        lineHeight={0}
      >
        {(showOperators || showScripts) && <Typography>{state.modelName}</Typography>}
        <IconButton
          onClick={handleClose}
          sx={{
            background: theme.palette.primary.main,
            '&:hover': { background: theme.palette.primary.main, opacity: 0.8 },
          }}
        >
          <img src='./close-icon.svg' />
        </IconButton>
      </DialogTitle>
      <DialogContent
        sx={{
          display: showOperators || showScripts ? 'none' : 'flex',
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
              {findTag(state.fullState, 'category')}
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
              {findTag(state.fullState, 'description') || 'No Description Available.'}
            </Typography>
          </Box>
          <Vote tx={state.fullState} voteFor={'model'} />
        </Box>
      </DialogContent>
      {showOperators ? (
        <ChooseOperator setShowOperators={setShowOperators} scriptTx={scriptTx} />
      ) : (
        showScriptsFragment()
      )}
    </Dialog>
  );
};

export default Detail;
