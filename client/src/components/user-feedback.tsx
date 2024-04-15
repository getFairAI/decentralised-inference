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
  Icon,
  IconButton,
  Rating,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { Dispatch, SetStateAction, useCallback, useContext, useEffect, useState } from 'react';
import StarIcon from '@mui/icons-material/Star';
import CloseIcon from '@mui/icons-material/Close';
import { Mood } from '@mui/icons-material';
import arweave from '@/utils/arweave';
import { TAG_NAMES, USER_FEEDBACK, secondInMS } from '@/constants';
import { EVMWalletContext } from '@/context/evm-wallet';

const labels: { [index: string]: string } = {
  0.5: 'Useless',
  1: 'Useless+',
  1.5: 'Poor',
  2: 'Poor+',
  2.5: 'Ok',
  3: 'Ok+',
  3.5: 'Good',
  4: 'Good+',
  4.5: 'Excellent',
  5: 'Excellent+',
};

const getLabelText = (value: number) => `${value} Star${value !== 1 ? 's' : ''}, ${labels[value]}`;

const FeedbackForm = ({
  setHasSubmitted,
}: {
  setHasSubmitted: Dispatch<SetStateAction<boolean>>;
}) => {
  const [value, setValue] = useState<number | null>(2);
  const [comment, setComment] = useState<string>('');
  const [hover, setHover] = useState(-1);

  const { postOnArweave } = useContext(EVMWalletContext);

  const handleSubmit = useCallback(async () => {
    // ignore for now
    if (!value) {
      return;
    }

    // dispatch feedback tx
    const tags = [
      { name: TAG_NAMES.protocolName, value: PROTOCOL_NAME },
      { name: TAG_NAMES.protocolVersion, value: PROTOCOL_VERSION },
      { name: TAG_NAMES.operationName, value: USER_FEEDBACK },
      { name: TAG_NAMES.userRatingScore, value: value.toString() },
    ];
    if (comment) {
      tags.push({ name: TAG_NAMES.userRatingComment, value: comment});
    }
    tags.push({ name: TAG_NAMES.unixTime, value: (Date.now() / secondInMS).toString()});

    await postOnArweave('Fair Protocol Active User Feedback', tags);

    setHasSubmitted(true);
  }, [postOnArweave, arweave, value, comment]);

  return (
    <>
      <DialogContent
        sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
      >
        <Typography fontWeight={500} fontSize={'18px'}>
          How would you rate our App?
        </Typography>
        <Box
          width={'100%'}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Rating
            name='hover-feedback'
            value={value}
            precision={0.5}
            getLabelText={getLabelText}
            onChange={(_, newValue) => {
              setValue(newValue);
            }}
            onChangeActive={(_, newHover) => {
              setHover(newHover);
            }}
            size='large'
            emptyIcon={<StarIcon style={{ opacity: 0.55 }} fontSize='inherit' />}
          />
          {value !== null && (
            <Box sx={{ ml: 2 }}>
              <Typography>{labels[hover !== -1 ? hover : value]}</Typography>
            </Box>
          )}
        </Box>
        <Box
          width={'100%'}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Typography fontWeight={500} fontSize={'18px'}>
            What can we do better?
          </Typography>
          <TextField
            sx={{ width: '85%' }}
            variant='outlined'
            multiline
            margin='dense'
            value={comment}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setComment(event.target.value);
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions
        sx={{
          display: 'flex',
          justifyContent: 'center',
          gap: '30px',
          paddingBottom: '20px',
        }}
      >
        <Button
          variant='outlined'
          onClick={handleSubmit}
          sx={{ width: 'fit-content' }}
          className='plausible-event-name=User+FeedBack+Submit'
        >
          <Typography>Submit</Typography>
        </Button>
      </DialogActions>
    </>
  );
};
const UserFeedback = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  const theme = useTheme();
  const handleClose = useCallback(() => {
    setOpen(false);
    localStorage.setItem('ignoreFeedback', 'true');
  }, [setOpen]);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    if (hasSubmitted && open) {
      // close after 3 seconds
      setTimeout(() => {
        handleClose();
      }, 3000);
    }
  }, [hasSubmitted, open, handleClose]);

  return (
    <Dialog
      open={open}
      maxWidth={'sm'}
      fullWidth
      sx={{
        '& .MuiPaper-root': {
          background:
            theme.palette.mode === 'dark'
              ? 'rgba(61, 61, 61, 0.9)'
              : theme.palette.background.default,
          borderRadius: '8px',
        },
      }}
    >
      <DialogTitle
        display='flex'
        justifyContent={'space-between'}
        alignItems='center'
        lineHeight={0}
      >
        <Typography fontWeight={600} fontSize={'20px'}>
          {'While you are waiting, help us improving the App!'}
        </Typography>
        <IconButton
          sx={{
            borderRadius: '8px',
            /*  background: '#FFF', */
            border: 'none',
          }}
          size='medium'
          onClick={handleClose}
          className='plausible-event-name=User+FeedBack+Close'
        >
          <CloseIcon fontSize='inherit' />
        </IconButton>
      </DialogTitle>
      {!hasSubmitted && <FeedbackForm setHasSubmitted={setHasSubmitted} />}
      {hasSubmitted && (
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
        >
          <Typography fontSize={'18px'}>Thank you for your feedback!</Typography>
          <Icon fontSize='large' sx={{ display: 'flex' }}>
            <Mood fontSize='large' color='success' />
          </Icon>
        </DialogContent>
      )}
    </Dialog>
  );
};

export default UserFeedback;
