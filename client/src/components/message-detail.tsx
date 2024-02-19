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
  Dialog,
  DialogTitle,
  IconButton,
  DialogContent,
  Box,
  Typography,
  useTheme,
  DialogActions,
  Button,
} from '@mui/material';
import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';
import { IMessage } from '@/interfaces/common';
import { displayShortTxOrAddr, findTag } from '@/utils/common';
import { useLocation } from 'react-router-dom';
import MessageDisplay from './message-display';
import { PstState, connect, getContractByTxId, getState } from '@/utils/pst';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { secondInMS } from '@/constants';
import Close from '@mui/icons-material/Close';

const headerText = {
  fontStyle: 'normal',
  fontWeight: 700,
  fontSize: '23px',
  lineHeight: '31px',
  display: 'flex',
  alignItems: 'center',
  textAlign: 'center',
};

const valueText = {
  fontStyle: 'normal',
  fontWeight: 400,
  fontSize: '23px',
  lineHeight: '31px',
  display: 'flex',
  alignItems: 'center',
  textAlign: 'center',
};

const MessageDetail = ({
  message,
  open,
  setOpen,
}: {
  message: IMessage;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  const theme = useTheme();
  const { state } = useLocation();
  const [showMore, setShowMore] = useState(false);
  const [options, setOptions] = useState<ApexOptions>({
    title: {
      text: 'Ownership',
      align: 'left',
      style: {
        fontWeight: 700,
        fontSize: '23px',
        fontFamily: theme.typography.fontFamily,
      },
    },
    legend: {
      position: 'left',
      offsetY: 25,
      fontWeight: 400,
      fontSize: '18px',
      fontFamily: theme.typography.fontFamily,
    },
    colors: [theme.palette.primary.main, theme.palette.secondary.main, theme.palette.terciary.main],
  });
  const [series, setSeries] = useState<number[]>([]);
  const [contractState, setContractState] = useState<PstState | undefined>(undefined);

  useEffect(() => {
    if (open) {
      try {
        const contract = connect(getContractByTxId(message.id));

        (async () => {
          const result = await getState(contract);
          setContractState(result);
        })();
      } catch (err) {
        // ignore
        setContractState(undefined);
      }
    } else {
      // ignore
      setContractState(undefined);
    }
  }, [message, open]);

  useEffect(() => {
    if (contractState) {
      const labels = Object.keys(contractState.balances).map((el) => displayShortTxOrAddr(el)); // balance addresses
      const values = Object.values(contractState.balances); // balance values;
      setOptions({
        ...options,
        labels,
      });
      setSeries(values);
    }
  }, [contractState]);

  const toggleShowMore = useCallback(() => setShowMore(!showMore), [showMore, setShowMore]);
  const handleClose = useCallback(() => setOpen(false), [setOpen]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={'lg'}
      fullWidth
      sx={{
        '& .MuiPaper-root': {
          background:
            theme.palette.mode === 'dark'
              ? theme.palette.neutral.main
              : theme.palette.background.default,
        },
      }}
    >
      <DialogTitle display='flex' justifyContent={'flex-end'} alignItems='center' lineHeight={0}>
        <IconButton
          sx={{
            borderRadius: '8px',
            background: '#FFF',
            border: '0.5px solid',
          }}
          onClick={handleClose}
          className='plausible-event-name=Message+Detail+Close'
        >
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent
        sx={{
          display: 'flex',
          gap: '48px',
        }}
      >
        <Box display={'flex'} flexDirection={'column'} gap={'16px'} width={'100%'}>
          <Box display={'flex'} justifyContent={'space-between'}>
            <MessageDisplay message={message} forDetails={true} />
            {contractState && <Chart options={options} series={series} type={'pie'} width='500' />}
          </Box>

          <Box display={'flex'} justifyContent={'space-between'} alignItems={'flex-start'}>
            <Typography sx={headerText}>Prompt</Typography>
            <Typography
              sx={{
                ...valueText,
                textAlign: 'end',
              }}
            >
              {message.tags.find((el) => el.name === 'Prompt')?.value ?? 'Not Available'}
            </Typography>
          </Box>
          <Box display={'flex'} justifyContent={'space-between'}>
            <Typography sx={headerText}>PST Name (PST Ticker)</Typography>
            <Typography sx={valueText}>
              {`${contractState?.name} (${contractState?.ticker})`}
            </Typography>
          </Box>
          <Box display={'flex'} justifyContent={'space-between'}>
            <Typography sx={headerText}>Model Name</Typography>
            <Typography sx={valueText}>{findTag(state.fullState, 'modelName')}</Typography>
          </Box>
          <Box display={'flex'} justifyContent={'space-between'}>
            <Typography sx={headerText}>Script Name</Typography>
            <Typography sx={valueText}>{state.scriptName}</Typography>
          </Box>
          <Box display={'flex'} justifyContent={'space-between'}>
            <Typography sx={headerText}>Date</Typography>
            <Typography sx={valueText}>
              {new Date(message.timestamp * secondInMS).toLocaleString()}
              {` (${message.timestamp})`}
            </Typography>
          </Box>
          {showMore && (
            <>
              <Box display={'flex'} justifyContent={'space-between'}>
                <Typography sx={headerText}>Original Owner</Typography>
                <Typography sx={valueText}>{contractState?.firstOwner}</Typography>
              </Box>
              <Box display={'flex'} justifyContent={'space-between'}>
                <Typography sx={headerText}>Operator</Typography>
                <Typography sx={valueText}>{message.from}</Typography>
              </Box>
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ display: 'flex', justifyContent: 'center' }}>
        <Button
          onClick={toggleShowMore}
          className='plausible-event-name=Message+Detail+Show+More+Click'
        >
          {showMore ? 'Show Less' : 'Show More'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MessageDetail;
