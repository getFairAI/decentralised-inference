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
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Icon,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useLoaderData, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getData, parseWinston } from '@/utils/arweave';
import { toSvg } from 'jdenticon';
import { download, findTag, printSize } from '@/utils/common';
import { RouteLoaderResult, ScriptNavigationState } from '@/interfaces/router';
import MarkdownControl from '@/components/md-control';
import rehypeSanitize from 'rehype-sanitize';
import { NET_ARWEAVE_URL, OPERATOR_REGISTRATION_AR_FEE } from '@/constants';
import DownloadIcon from '@mui/icons-material/Download';
import Vote from '@/components/vote';

const ScriptAttachments = ({
  handleShowAttachmentsChanged,
}: {
  handleShowAttachmentsChanged: (value: boolean) => void;
}) => {
  const [notes, setNotes] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [showAttachments, setShowAttachments] = useState(false);
  const { state }: { state: ScriptNavigationState; pathname: string } = useLocation();
  const { notesTxId } = useLoaderData() as RouteLoaderResult;

  const handleDownload = useCallback(
    () => download(state.scriptName, state.scriptTransaction),
    [download],
  );
  const handleShowAttachments = useCallback(() => {
    setShowAttachments(true);
    handleShowAttachmentsChanged(true);
  }, [setShowAttachments]);
  const handleHideAttachments = useCallback(() => {
    setShowAttachments(false);
    handleShowAttachmentsChanged(false);
  }, [setShowAttachments]);

  useEffect(() => {
    if (notesTxId) {
      (async () => {
        setNotes(await getData(notesTxId));
      })();
    }
  }, [notesTxId]);

  useEffect(() => {
    (async () => {
      const response = await fetch(`${NET_ARWEAVE_URL}/${state.scriptTransaction}`, {
        method: 'HEAD',
      });
      setFileSize(parseInt(response.headers.get('Content-Length') ?? '', 10));
    })();
  }, []);

  if (showAttachments) {
    return (
      <>
        <DialogContent sx={{ overflow: 'unset' }}>
          <MarkdownControl
            viewProps={{
              preview: 'preview',
              previewOptions: {
                rehypePlugins: [[rehypeSanitize]],
              },
              hideToolbar: true,
              fullscreen: false,
              value: notes,
            }}
          />
          <Box>
            <FormControl variant='outlined' fullWidth>
              <TextField
                multiline
                disabled
                minRows={1}
                value={state.scriptName}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <IconButton aria-label='download' onClick={handleDownload}>
                        <DownloadIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position='start'>{printSize(fileSize)}</InputAdornment>
                  ),
                  readOnly: true,
                  sx: {
                    borderWidth: '1px',
                    borderColor: '#FFF',
                    borderRadius: '23px',
                  },
                }}
              />
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            justifyContent: 'center',
          }}
        >
          <Button variant='outlined' onClick={handleHideAttachments}>
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
              Go Back
            </Typography>
          </Button>
        </DialogActions>
      </>
    );
  }

  return (
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
        onClick={handleShowAttachments}
      >
        <Box display='flex'>
          <Typography>{'View Attachments'}</Typography>
          <Icon sx={{ rotate: '-90deg' }}>
            <img src='./triangle.svg' />
          </Icon>
        </Box>
      </Button>
    </DialogActions>
  );
};

const DetailsContent = () => {
  const { avatarTxId } = useLoaderData() as RouteLoaderResult;
  const { state }: { state: ScriptNavigationState; pathname: string } = useLocation();
  const { txid } = useParams();
  const theme = useTheme();

  const avatarSize = 100;

  const imgUrl = useMemo(() => {
    if (avatarTxId) {
      return `https://arweave.net/${avatarTxId}`;
    } else if (txid) {
      const img = toSvg(txid, avatarSize);
      const svg = new Blob([img], { type: 'image/svg+xml' });
      return URL.createObjectURL(svg);
    } else {
      return '';
    }
  }, [avatarTxId, txid]);

  const typographyHeaderProps = {
    fontStyle: 'normal',
    fontWeight: 700,
    fontSize: '23px',
    lineHeight: '31px',
    display: 'flex',
    alignItems: 'center',
    textAlign: 'center',
  };

  const typographyTextProps = {
    fontStyle: 'normal',
    fontWeight: 400,
    fontSize: '23px',
    lineHeight: '31px',
    display: 'flex',
    alignItems: 'center',
    textAlign: 'center',
  };

  return (
    <>
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
          <Typography sx={typographyHeaderProps}>Name</Typography>
          <Typography sx={typographyTextProps}>{state.scriptName}</Typography>
        </Box>
        <Box>
          <Typography sx={typographyHeaderProps}>Category</Typography>
          <Typography sx={typographyTextProps}>{findTag(state.fullState, 'category')}</Typography>
        </Box>
        <Box>
          <Typography sx={typographyHeaderProps}>Cost</Typography>
          <Box
            display={'flex'}
            alignItems={'center'}
            justifyContent='flex-start'
            width={'100%'}
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

                paddingRight: '8px',
              }}
            >
              {parseWinston(state.fee)}
            </Typography>
            <Icon sx={{ height: '50px', width: '50px' }}>
              <img
                src={
                  theme.palette.mode === 'dark'
                    ? './arweave-logo.svg'
                    : './arweave-logo-for-light.png'
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
          <Typography sx={typographyHeaderProps}>Description</Typography>
          <Typography>
            {findTag(state.fullState, 'description') ?? 'No Description Available.'}
          </Typography>
        </Box>
        <Vote
          tx={state.fullState}
          fee={parseFloat(OPERATOR_REGISTRATION_AR_FEE)}
          owner={findTag(state.fullState, 'modelCreator') as string}
          voteFor={'script'}
        />
      </Box>
    </>
  );
};

const ScriptDetails = () => {
  const { state }: { state: ScriptNavigationState; pathname: string } = useLocation();
  const navigate = useNavigate();
  const [showAttachments, setShowAttachments] = useState(false);
  const theme = useTheme();

  const handleClose = useCallback(() => navigate(-1), [navigate]);
  const handleShowAttachmentsChanged = useCallback(
    (value: boolean) => setShowAttachments(value),
    [setShowAttachments],
  );

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
        justifyContent={showAttachments ? 'space-between' : 'flex-end'}
        alignItems='center'
        lineHeight={0}
      >
        {showAttachments && <Typography>{state.scriptName}</Typography>}
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
          display: showAttachments ? 'none' : 'flex',
          gap: '48px',
          justifyContent: 'space-evenly',
        }}
      >
        <DetailsContent />
      </DialogContent>
      <ScriptAttachments handleShowAttachmentsChanged={handleShowAttachmentsChanged} />
    </Dialog>
  );
};

export default ScriptDetails;
