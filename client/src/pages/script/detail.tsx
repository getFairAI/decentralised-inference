import {
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
import { Box } from '@mui/system';
import { useLoaderData, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { getData, parseWinston } from '@/utils/arweave';
import { toSvg } from 'jdenticon';
import { findTag } from '@/utils/common';
import { RouteLoaderResult, ScriptNavigationState } from '@/interfaces/router';
import MarkdownControl from '@/components/md-control';
import rehypeSanitize from 'rehype-sanitize';
import { NET_ARWEAVE_URL } from '@/constants';
import DownloadIcon from '@mui/icons-material/Download';

const ScriptDetails = () => {
  const { avatarTxId, notesTxId } = useLoaderData() as RouteLoaderResult;
  const { state }: { state: ScriptNavigationState; pathname: string } = useLocation();
  const { txid } = useParams();
  const navigate = useNavigate();
  const [showAttachments, setShowAttachments] = useState(false);
  const theme = useTheme();
  const [notes, setNotes] = useState('');
  const [fileSize, setFileSize] = useState(0);

  useEffect(() => {
    const fetchNotesData = async () => {
      setNotes(await getData(notesTxId as string));
    };

    if (notesTxId) fetchNotesData();
  }, [notesTxId]);

  const imgUrl = useMemo(() => {
    if (avatarTxId) {
      return `https://arweave.net/${avatarTxId}`;
    } else if (txid) {
      const img = toSvg(txid, 100);
      const svg = new Blob([img], { type: 'image/svg+xml' });
      return URL.createObjectURL(svg);
    }
  }, [avatarTxId, txid]);

  const handleClose = () => {
    navigate(-1);
  };

  const printSize = (args: File | number) => {
    let size;
    if (typeof args === 'number') {
      size = args;
    } else {
      size = args.size;
    }

    if (size < 1024) {
      return `${size} bytes`;
    } else if (size < Math.pow(1024, 2)) {
      const kb = size / 1024;
      return `${Math.round((kb + Number.EPSILON) * 100) / 100} KB`;
    } else if (size < Math.pow(1024, 3)) {
      const mb = size / Math.pow(1024, 2);
      return `${Math.round((mb + Number.EPSILON) * 100) / 100} MB`;
    } else {
      const gb = size / Math.pow(1024, 3);
      return `${Math.round((gb + Number.EPSILON) * 100) / 100} GB`;
    }
  };

  const download = () => {
    const a = document.createElement('a');
    a.href = `${NET_ARWEAVE_URL}/${state.scriptTransaction}`;
    a.download = state.scriptName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  useEffect(() => {
    const getFileSize = async () => {
      const response = await fetch(`${NET_ARWEAVE_URL}/${state.scriptTransaction}`, {
        method: 'HEAD',
      });
      setFileSize(parseInt(response.headers.get('Content-Length') || ''));
    };
    getFileSize();
  }, []);

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
              {state.scriptName}
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
          <Button
            sx={{
              border: `1px solid ${theme.palette.primary.main}`,
              borderRadius: '10px',
              boxSizing: 'border-box',
            }}
          >
            <Typography>Stamp</Typography>
          </Button>
        </Box>
      </DialogContent>
      {showAttachments ? (
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
                        <IconButton aria-label='download' onClick={() => download()}>
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
            <Button variant='outlined' onClick={() => setShowAttachments(false)}>
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
            onClick={() => setShowAttachments(true)}
          >
            <Box display='flex'>
              <Typography>{'View Attachments'}</Typography>
              <Icon sx={{ rotate: '-90deg' }}>
                <img src='./triangle.svg' />
              </Icon>
            </Box>
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default ScriptDetails;
