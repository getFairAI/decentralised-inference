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
  Avatar,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
  useTheme,
} from '@mui/material';
import { Dispatch, SetStateAction, useCallback, useContext } from 'react';
import { EVMWalletContext } from '@/context/evm-wallet';
import { EIP6963ProviderDetail } from '@/interfaces/evm';
import { EIP1193Provider } from 'viem';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { StyledMuiButton } from '@/styles/components';

// icons
import HighlightOffRoundedIcon from '@mui/icons-material/HighlightOffRounded';
import WalletRoundedIcon from '@mui/icons-material/WalletRounded';
import ExitToAppRoundedIcon from '@mui/icons-material/ExitToAppRounded';
import { motion } from 'framer-motion';

const ProviderElement = ({
  provider,
  setOpen,
}: {
  provider: EIP6963ProviderDetail;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  const { connect } = useContext(EVMWalletContext);
  const { localStorageValue: currentProviderValue, updateStorageValue } =
    useLocalStorage('evmProvider');
  const { updateStorageValue: updateHasOnboarded } = useLocalStorage('hasOnboarded');

  const handleEvmConnect = useCallback(async () => {
    await connect(provider.provider as EIP1193Provider);
    updateStorageValue(provider.info.name);
    updateHasOnboarded('true');
    setOpen(false);
  }, [connect]);

  return (
    <div className='rounded-3xl bg-slate-300 py-2'>
      <ListItem
        key={provider.info.uuid}
        secondaryAction={
          <StyledMuiButton
            aria-label='Connect this wallet'
            onClick={handleEvmConnect}
            disabled={currentProviderValue === provider.info.name}
            className='plausible-event-name=EVM+Connected primary'
          >
            {currentProviderValue === provider.info.name ? 'Connected' : 'Connect'}
            <ExitToAppRoundedIcon style={{ width: '22px' }} />
          </StyledMuiButton>
        }
      >
        <ListItemAvatar>
          <Avatar
            src={provider.info.icon}
            alt='provider.info.name'
            className='p-[6px] object-contain bg-white'
          />
        </ListItemAvatar>
        <ListItemText primary={provider.info.name} className='font-semibold' />
      </ListItem>
    </div>
  );
};

const ChooseWallet = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  // components/layout.js
  const theme = useTheme();
  const { providers } = useContext(EVMWalletContext);
  const handleClose = useCallback(() => setOpen(false), [setOpen]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={'sm'}
      fullWidth
      sx={{
        '& .MuiPaper-root': {
          borderRadius: '20px',
          background:
            theme.palette.mode === 'dark'
              ? 'rgba(61, 61, 61, 0.9)'
              : theme.palette.background.default,
        },
      }}
    >
      <DialogTitle>
        <Typography
          sx={{
            fontWeight: 600,
            fontSize: '22px',
          }}
          className='flex items-center gap-2 pb-4'
        >
          <WalletRoundedIcon />
          {'Choose a wallet to connect'}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <motion.div
          initial={{ x: '-20px', opacity: 0 }}
          animate={{ x: 0, opacity: 1, transition: { delay: 0.2, duration: 0.4 } }}
        >
          <List>
            {providers.map((provider) => (
              <ProviderElement provider={provider} key={provider.info.uuid} setOpen={setOpen} />
            ))}
          </List>
        </motion.div>
      </DialogContent>
      <DialogActions
        sx={{
          display: 'flex',
          justifyContent: 'center',
          paddingBottom: '20px',
        }}
      >
        <StyledMuiButton
          onClick={handleClose}
          className='plausible-event-name=Connect+Popup+Closed secondary'
        >
          <div className='flex items-center gap-2'>
            <HighlightOffRoundedIcon /> Cancel
          </div>
        </StyledMuiButton>
      </DialogActions>
    </Dialog>
  );
};

export default ChooseWallet;
