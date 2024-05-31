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
  Button,
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
import PowerIcon from '@mui/icons-material/Power';
import { EVMWalletContext } from '@/context/evm-wallet';
import { EIP6963ProviderDetail } from '@/interfaces/evm';
import { EIP1193Provider } from 'viem';
import { useLocalStorage } from '@/hooks/useLocalStorage';

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
    <ListItem
      key={provider.info.uuid}
      secondaryAction={
        <Button
          aria-label='connect'
          variant='contained'
          onClick={handleEvmConnect}
          disabled={currentProviderValue === provider.info.name}
          endIcon={<PowerIcon />}
          className='plausible-event-name=EVM+Connected'
        >
          <Typography>
            {currentProviderValue === provider.info.name ? 'Connected' : 'Connect'}
          </Typography>
        </Button>
      }
    >
      <ListItemAvatar>
        <Avatar src={provider.info.icon} alt='provider.info.name' />
      </ListItemAvatar>
      <ListItemText primary={provider.info.name} />
    </ListItem>
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
            fontWeight: 700,
            fontSize: '23px',
            lineHeight: '31px',
          }}
        >
          {'Connect Wallet'}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <List>
          {providers.map((provider) => (
            <ProviderElement provider={provider} key={provider.info.uuid} setOpen={setOpen} />
          ))}
        </List>
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
          onClick={handleClose}
          sx={{ width: 'fit-content' }}
          className='plausible-event-name=Connect+Popup+Closed'
        >
          <Typography>Close</Typography>
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChooseWallet;
