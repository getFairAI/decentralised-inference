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

import { ThrowawayContext } from '@/context/throwaway';
import { allowUsdc, sendEth } from '@fairai/evm-sdk';
import { useTheme } from '@mui/material';
import Backdrop from '@mui/material/Backdrop';
import Typography from '@mui/material/Typography';
import { motion } from 'framer-motion';
import { useContext, useEffect, useState } from 'react';
import redstone from 'redstone-api';

const RequestAllowance = () => {
  const theme = useTheme();
  const {
    throwawayAddr,
    throwawayBalance,
    throwawayUsdcAllowance,
    updateAllowance,
    updateBalance,
  } = useContext(ThrowawayContext);
  const [isLayoverOpen, setIsLayoverOpen] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      if (!throwawayAddr) {
        return;
      }

      const { value: ethAvgPrice } = await redstone.getPrice('ETH');

      const minAmount = 0.01;
      const minAmountUsdc = 0.1;
      const chargeAmountUsdc = 1;
      const chargeAmount = 0.1;
      const minAmountInEth = minAmount / ethAvgPrice;
      const digits = 6;
      setIsLayoverOpen(
        throwawayUsdcAllowance < minAmountUsdc ||
          throwawayBalance.toFixed(digits) < minAmountInEth.toFixed(digits),
      );
      let hasEnoughAllowance = false;
      let hasEnoughBalance = false;
      if (throwawayUsdcAllowance < minAmountUsdc) {
        const hash = await allowUsdc(throwawayAddr as `0x${string}`, chargeAmountUsdc);
        await updateAllowance(throwawayUsdcAllowance + chargeAmountUsdc);
        hasEnoughAllowance = !!hash;
      } else {
        hasEnoughAllowance = true;
      }

      if (throwawayBalance.toFixed(digits) < minAmountInEth.toFixed(digits)) {
        // prompt to add funds
        const hash = await sendEth(throwawayAddr as `0x${string}`, chargeAmount);
        await updateBalance(throwawayBalance + (chargeAmount / ethAvgPrice));
        hasEnoughBalance = !!hash;
      } else {
        hasEnoughBalance = true;
      }

      setIsLayoverOpen(!hasEnoughAllowance || !hasEnoughBalance);
    })();
  }, [throwawayAddr, throwawayUsdcAllowance, throwawayBalance]);

  return (
    <Backdrop
      sx={{
        color: '#fff',
        zIndex: theme.zIndex.drawer + 1,
        backdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(0,0,0,0.15)',
      }}
      open={isLayoverOpen}
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1, transition: { delay: 0.1, duration: 0.4 } }}
        className='w-full max-w-[600px]'
      >
        <Typography
          variant='h3'
          className='flex items-center gap-3 bg-[#3aaaaa] rounded-2xl py-3 px-6'
        >
          <img src='./fair-protocol-face-transp-eyes.png' style={{ width: '40px' }} />
          {'Please continue on your wallet extension.'}
        </Typography>
        <div className='mt-2 rounded-2xl py-3 px-6 bg-slate-500 font-semibold text-lg'>
          Please allow the temporary wallet to access your funds. We recommend you do not allow
          large amounts of USDC.
          <br />
          As the wallet will also be used to pay for the transaction fees, it will also need a small
          amount of ETH. By default we will ask you to allow at least 1 USDC and send 0.5$ worth of
          ETH.
        </div>
      </motion.div>
    </Backdrop>
  );
};

export default RequestAllowance;
