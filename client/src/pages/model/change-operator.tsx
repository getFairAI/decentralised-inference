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

import ChooseOperator from '@/components/choose-operator';
import { IContractEdge } from '@/interfaces/arweave';
import { Dialog, DialogTitle, Typography, IconButton, useTheme } from '@mui/material';
import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ChangeOperator = () => {
  const theme = useTheme();
  const { state } = useLocation();
  const navigate = useNavigate();

  const scriptTx = useMemo(() => state.fullState as IContractEdge, [state.fullState]);

  const handleClose = useCallback(() => navigate(-1), [navigate]);

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
        justifyContent={'space-between'}
        alignItems='center'
        lineHeight={0}
      >
        <Typography>{state.modelName}</Typography>
        <IconButton
          onClick={handleClose}
          sx={{
            background: theme.palette.primary.main,
            '&:hover': { background: theme.palette.primary.main, opacity: 0.8 },
          }}
          className='plausible-event-name=Change+Operator+Close'
        >
          <img src='./close-icon.svg' />
        </IconButton>
      </DialogTitle>
      <ChooseOperator scriptTx={scriptTx} />
    </Dialog>
  );
};

export default ChangeOperator;
