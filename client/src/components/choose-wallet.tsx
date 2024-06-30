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
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { Dispatch, SetStateAction, useCallback, useContext, useState } from 'react';
import { EVMWalletContext } from '@/context/evm-wallet';
import { EIP6963ProviderDetail } from '@/interfaces/evm';
import { EIP1193Provider } from 'viem';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { StyledMuiButton } from '@/styles/components';

// icons
import HighlightOffRoundedIcon from '@mui/icons-material/HighlightOffRounded';
import WalletRoundedIcon from '@mui/icons-material/WalletRounded';
import ExitToAppRoundedIcon from '@mui/icons-material/ExitToAppRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import { motion } from 'framer-motion';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { enqueueSnackbar } from 'notistack';

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

  const [moreInfoWalletOpened, openMoreInfoWallet] = useState(false);

  return (
    <div className='rounded-3xl bg-slate-300 py-2 my-2'>
      {provider.info.name !== 'Rabby Wallet' && (
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
          <ListItemText primary={provider.info.name} />
        </ListItem>
      )}

      {provider.info.name === 'Rabby Wallet' && (
        <>
          <ListItem
            key={provider.info.uuid}
            secondaryAction={
              <StyledMuiButton
                aria-label='Connect this wallet'
                onClick={() => {
                  openMoreInfoWallet(!moreInfoWalletOpened);
                }}
                className='plausible-event-name=EVM+Connected secondary'
              >
                {currentProviderValue === provider.info.name ? 'Connected' : 'More Info'}
                <KeyboardArrowDownRoundedIcon style={{ width: '22px' }} />
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
            <ListItemText primary={provider.info.name} />
          </ListItem>

          {moreInfoWalletOpened && (
            <motion.div
              initial={{ opacity: 0, padding: 0, y: '-60px', height: 0 }}
              animate={{
                opacity: 1,
                padding: '10px 30px',
                height: 'max-content',
                y: 0,
                transition: {
                  duration: 0.2,
                },
              }}
              className='flex flex-col gap-4'
            >
              <div className='font-semibold'>This wallet needs a few extra configurations:</div>
              <p>{'1. Click on the Rabby extension, and then click on "more".'}</p>
              <div className='w-full p-2 flex justify-center'>
                <img
                  src='./wallet-instructions/rabby-1.jpg'
                  className='w-full max-w-[400px] rounded-3xl shadow-lg'
                />
              </div>
              <p>{'2. In the settings section, click on the "Modify RPC URL" option.'}</p>
              <div className='w-full p-2 flex justify-center'>
                <img
                  src='./wallet-instructions/rabby-2.jpg'
                  className='w-full max-w-[400px] rounded-3xl shadow-lg'
                />
              </div>
              <p>
                {
                  '3. Click on the "Modify RPC URL" option and then click on the "Arbitrum" network.'
                }
              </p>
              <div className='w-full p-2 flex justify-center'>
                <img
                  src='./wallet-instructions/rabby-3.jpg'
                  className='w-full max-w-[400px] rounded-3xl shadow-lg'
                />
              </div>
              <p>
                {'4. Add the URL '}
                <CopyToClipboard
                  text={'https://arb1.arbitrum.io/rpc'}
                  onCopy={() => {
                    enqueueSnackbar('Copied to clipboard.', {
                      variant: 'success',
                      autoHideDuration: 2000,
                      style: { fontWeight: 700 },
                    });
                  }}
                >
                  <Tooltip title={'Click to copy'}>
                    <span className='cursor-pointer bg-slate-600 py-1 px-2 rounded-xl text-white hover:bg-slate-500'>
                      https://arb1.arbitrum.io/rpc
                      <ContentCopyRoundedIcon
                        style={{ width: '20px', marginLeft: '5px', marginBottom: '3px' }}
                      />
                    </span>
                  </Tooltip>
                </CopyToClipboard>
                {' and click Save.'}
              </p>
              <div className='w-full p-2 flex justify-center'>
                <img
                  src='./wallet-instructions/rabby-4.jpg'
                  className='w-full max-w-[400px] rounded-3xl shadow-lg'
                />
              </div>
              <p>
                <strong>Note: </strong> It may be necessary to clear the cache (CTRL+SHIFT+R) to
                apply the changes.
              </p>

              <div className='flex justify-end pb-3'>
                <StyledMuiButton
                  aria-label='Connect this wallet'
                  onClick={handleEvmConnect}
                  disabled={currentProviderValue === provider.info.name}
                  className='plausible-event-name=EVM+Connected primary'
                >
                  {currentProviderValue === provider.info.name
                    ? 'Connected'
                    : 'Confirm and Connect'}
                  <ExitToAppRoundedIcon style={{ width: '22px' }} />
                </StyledMuiButton>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

const InstallMetaMaskElement = () => {
  const installWallet = () => {
    window.open('https://metamask.io/download/', '_blank', 'noopener');
  };

  return (
    <div className='rounded-3xl bg-slate-300 py-2 my-2'>
      <ListItem
        secondaryAction={
          <StyledMuiButton
            aria-label='Install this wallet'
            onClick={installWallet}
            className='plausible-event-name=EVM+Connected secondary'
          >
            Install
            <OpenInNewRoundedIcon style={{ width: '22px' }} />
          </StyledMuiButton>
        }
      >
        <ListItemAvatar>
          <Avatar
            src={'./icons/metamask.svg'}
            alt='provider.info.name'
            className='p-[6px] object-contain bg-white'
          />
        </ListItemAvatar>
        <ListItemText primary={'MetaMask'} />
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

  const metaMaskProviderFound = providers.find((provider) => provider.info.name === 'MetaMask');

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
            <div className='font-semibold font-xl'>Our most recommended and well tested wallet</div>
            {metaMaskProviderFound && (
              <ProviderElement
                provider={metaMaskProviderFound}
                key={metaMaskProviderFound.info.uuid}
                setOpen={setOpen}
              />
            )}
            {!metaMaskProviderFound && <InstallMetaMaskElement />}
            {providers.find((provider) => provider.info.name !== 'MetaMask') && (
              <>
                <div className='font-semibold font-xl mt-8'>Other wallets we found installed</div>
                {providers.map((provider) => (
                  <div key={provider.info.uuid}>
                    {provider.info.name !== 'MetaMask' && (
                      <ProviderElement
                        provider={provider}
                        key={provider.info.uuid}
                        setOpen={setOpen}
                      />
                    )}
                  </div>
                ))}
              </>
            )}
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
