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

import { Box, Container, Grid, IconButton, InputBase, Typography, useTheme } from '@mui/material';
import '@/styles/ui.css';
import useSolutions from '@/hooks/useSolutions';
import LoadingCard from '@/components/loading-card';
import { ChangeEvent, useCallback, useContext, useEffect, useRef, useState } from 'react';
import useOperators from '@/hooks/useOperators';
import { findTag, genLoadingArray } from '@/utils/common';
import Solution from '@/components/solution';
import { throttle } from 'lodash';
import { IContractEdge } from '@/interfaces/arweave';
import { Link, useNavigate } from 'react-router-dom';
import { EVMWalletContext } from '@/context/evm-wallet';
import { motion } from 'framer-motion';
import { MIN_U_BALANCE } from '@/constants';
import { StyledMuiButton } from '@/styles/components';

// icons
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded';
import useWindowDimensions from '@/hooks/useWindowDimensions';

const WarningMessage = ({ smallScreen }: { smallScreen: boolean }) => {
  const [showWarning, setShowWarning] = useState(false);
  const { currentAddress, usdcBalance } = useContext(EVMWalletContext);
  const theme = useTheme();
  const navigate = useNavigate();

  const handleClose = useCallback(() => {
    setShowWarning(false);
    localStorage.setItem('warningClosed', 'true');
  }, [setShowWarning]);

  useEffect(() => setShowWarning(localStorage.getItem('warningClosed') !== 'true'), []);

  const handleSignIn = useCallback(() => navigate('sign-in'), [navigate]);

  if (!localStorage.getItem('evmProvider') && !currentAddress) {
    return (
      <motion.div
        initial={{ opacity: 0, height: 0, minHeight: 0 }}
        animate={{
          opacity: 1,
          height: 'fit-content',
          minHeight: '40px',
          width: '100%',
          maxWidth: !smallScreen ? '1200px' : '100%',
          marginTop: !smallScreen ? '30px' : '0px',
          padding: !smallScreen ? '20px' : '10px',
          borderRadius: !smallScreen ? '20px' : '0px',
          background: 'linear-gradient(200deg, #bfe3e0, #a9c9d4)',
          color: '#003030',
          transition: { duration: 0 },
        }}
        className='w-full flex flex-wrap justify-center xl:justify-between items-center gap-3 shadow-sm font-medium overflow-hidden text-xs md:text-base'
      >
        <span className='px-2 flex flex-nowrap gap-3 items-center'>
          <ErrorRoundedIcon
            style={{
              width: '24px',
            }}
          />
          You don&apos;t seem to have a wallet connected. Connect a wallet to experience all FairAI
          features and benefits.
        </span>

        <StyledMuiButton
          style={{
            display: 'flex',
            gap: '5px',
            alignItems: 'center',
          }}
          className='plausible-event-name=Onboarding+Click primary'
          onClick={handleSignIn}
        >
          <OpenInNewRoundedIcon style={{ width: '20px', marginRight: '4px' }} />
          Connect a wallet or learn more
        </StyledMuiButton>
      </motion.div>
    );
  } else if (showWarning && currentAddress && usdcBalance < MIN_U_BALANCE) {
    return (
      <Box
        sx={{
          background: theme.palette.warning.main,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
        padding={'2px 16px 2px 32px'}
      >
        <Typography>
          Looks Like you are running low on your USDC balance,{' '}
          <Link to={'/swap'} className='plausible-event-name=Top+Up+Click'>
            <u>Click here to Top Up</u>
          </Link>
        </Typography>
        <IconButton
          sx={{
            border: 'none',
            padding: '2px',
          }}
          size='medium'
          onClick={handleClose}
          className='plausible-event-name=Top+Up+Warning+Close'
        >
          <CloseIcon fontSize='inherit' />
        </IconButton>
      </Box>
    );
  } else {
    return <></>;
  }
};

export default function Home() {
  const target = useRef<HTMLDivElement>(null);
  const { loading, txs, error } = useSolutions(target);
  const [filteredTxs, setFilteredTxs] = useState<IContractEdge[]>([]);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const theme = useTheme();
  const { width } = useWindowDimensions();

  const { validTxs: operatorsData, loading: operatorsLoading } = useOperators(txs);
  const loadingTiles = genLoadingArray(8);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const md = theme.breakpoints.values.md;
    setIsSmallScreen(width < md);
  }, [width, theme, setIsSmallScreen]);

  const handleChange = throttle((event: ChangeEvent<HTMLInputElement>) => {
    // do something
    if (event.target.value === '') {
      setFilteredTxs(txs);
    } else {
      setFilteredTxs(
        txs.filter((tx) =>
          findTag(tx, 'solutionName')?.toLowerCase().includes(event.target.value.toLowerCase()),
        ),
      );
    }
  }, 2000);

  useEffect(() => {
    setFilteredTxs(txs);
  }, [txs]);

  return (
    <>
      <motion.div
        initial={{ y: '-20px', opacity: 0 }}
        animate={{ y: 0, opacity: 1, transition: { delay: 0.2, duration: 0.4 } }}
        className='flex justify-center w-full'
      >
        <WarningMessage smallScreen={isSmallScreen} />
      </motion.div>
      <motion.div
        initial={{ y: '-20px', opacity: 0 }}
        animate={{ y: 0, opacity: 1, transition: { delay: 0.4, duration: 0.4 } }}
      >
        <Container
          ref={containerRef}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            alignContent: 'center',
            '@media all': {
              maxWidth: '100%',
            },
            mt: '40px',
            paddingBottom: '200px',
          }}
        >
          <div className='w-full flex justify-center lg:justify-between mb-10 px-4 max-w-[1400px] gap-4 flex-wrap'>
            <div className='flex-3 justify-start text-xl lg:text-3xl font-medium flex items-center gap-4'>
              <img src='./fair-protocol-face-primarycolor.png' style={{ width: '42px' }} />
              Choose a solution and start creating
            </div>

            <Box
              sx={{
                borderRadius: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                padding: '3px 20px 3px 20px',
                alignItems: 'center',
                width: '100%',
                maxWidth: '300px',
                backgroundColor: 'white',
                outline: '1px solid lightgrey',
                '&:focus, &:focus-within': {
                  outline: '2px solid #3aaaaa',
                },
              }}
            >
              <InputBase
                sx={{
                  fontStyle: 'normal',
                  fontWeight: 400,
                  fontSize: '18px',
                  lineHeight: '16px',
                  width: '100%',
                }}
                onChange={handleChange}
                placeholder='Search'
              />
              <SearchRoundedIcon />
            </Box>
          </div>

          {error && <Typography>Error: {error.message}</Typography>}

          <motion.div
            initial={{ y: '-40px', opacity: 0 }}
            animate={{ y: 0, opacity: 1, transition: { delay: 0.6, duration: 0.4 } }}
            className='w-full flex flex-wrap justify-center gap-8 max-w-[1400px]'
          >
            {loading &&
              loadingTiles.map((el) => (
                <Grid item key={el}>
                  <LoadingCard />
                </Grid>
              ))}
            {filteredTxs.map((tx) => (
              <Grid item key={tx.node.id}>
                <motion.div
                  initial={{ y: '-40px', opacity: 0 }}
                  animate={{ y: 0, opacity: 1, transition: { duration: 0.4 } }}
                >
                  <Solution
                    tx={tx}
                    loading={operatorsLoading}
                    operatorsData={operatorsData.filter((el) => el.solutionId === tx.node.id)}
                    containerRef={containerRef}
                  />
                </motion.div>
              </Grid>
            ))}
          </motion.div>
          <Box ref={target} sx={{ paddingBottom: '16px' }}></Box>
        </Container>
      </motion.div>
    </>
  );
}
