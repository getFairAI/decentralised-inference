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

import { useSnackbar } from 'notistack';
import LoadingButton from '@mui/lab/LoadingButton';
import Tooltip, { TooltipProps, tooltipClasses } from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';
import { useState, useEffect, useContext, useCallback } from 'react';
import { EVMWalletContext } from '@/context/evm-wallet';
import { postOnArweave } from '@fairai/evm-sdk';
import { Query } from '@irys/query';

const FONT_SIZE = 12;

interface StampsMenuProps {
  id: string;
  type: string;
}

const HtmlTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: '#f5f5f9',
    color: 'rgba(0, 0, 0, 0.87)',
    maxWidth: 300,
    fontSize: theme.typography.pxToRem(FONT_SIZE),
    border: '1px solid #dadde9',
  },
}));

const StampsMenu: React.FC<StampsMenuProps> = (targetTx: StampsMenuProps) => {
  const [isStamped, setIsStamped] = useState(false);
  const [totalStamps, setTotalStamps] = useState(0);
  const { enqueueSnackbar } = useSnackbar();
  const [isSending, setIsSending] = useState(false);

  const { currentAddress, countStamps } = useContext(EVMWalletContext);
  const tooltipText =
    'When users "STAMP" the content, the STAMP Protocol gives creators and sponsors $STAMP Tokens every day.';

  useEffect(() => {
    (async () => {
      if (targetTx.id) {
        try {
          const countMap = await countStamps([ targetTx.id ]);
          const irys = new Query();
  
          if (currentAddress !== '') {
            const [ hasStamped ] = await irys.search('irys:transactions').tags([
              { name: 'Protocol-Name', values: ['Stamp'] },
              { name: 'Data-Source', values: [targetTx.id] },
            ]).from([ currentAddress ]).limit(1);
  
            setIsStamped(!!hasStamped);
          }
  
          setTotalStamps(countMap ? countMap[targetTx.id] : 0);
        } catch (error) {
          if (error instanceof Error) {
            enqueueSnackbar(error.message, { variant: 'error' });
          } else {
            enqueueSnackbar(JSON.stringify(error), { variant: 'error' });
          }
        }
      }
    })();
  }, [targetTx.id, currentAddress]);

  const handleStampClick = useCallback(async () => {
    if (isSending) {
      return;
    }
    if (isStamped) {
      enqueueSnackbar(`You already stamped this ${targetTx.type.toLocaleLowerCase()}.`, {
        variant: 'info',
      });
      return;
    }
    if (currentAddress === '') {
      enqueueSnackbar('Connect your wallet first.', { variant: 'warning' });
      return;
    }

    if (!isStamped) {
      try {
        setIsSending(true);
        await postOnArweave('Stamp', [
          { name: 'Protocol-Name', value: 'Stamp' },
          { name: 'Data-Source', value: targetTx.id },
        ]);
        setTotalStamps((count) => count + 1);
        setIsStamped(true);
        setIsSending(false);
        enqueueSnackbar(`The ${targetTx.type.toLocaleLowerCase()} has been stamped sucessffully!`, {
          variant: 'success',
        });
      } catch (error) {
        if (error instanceof Error) {
          enqueueSnackbar(error.message, { variant: 'error' });
        } else {
          enqueueSnackbar(JSON.stringify(error), { variant: 'error' });
        }
        setIsSending(false);
      }
    }
  }, [isSending, isStamped, currentAddress]);

  return (
    <>
      <HtmlTooltip
        title={
          <div>
            <div>
              Total: {totalStamps}
            </div>
            <br></br>
            <div>{tooltipText}</div>
          </div>
        }
      >
        <span>
          <LoadingButton
            variant='contained'
            loading={isSending}
            onClick={handleStampClick}
            className={`plausible-event-name=Stamp+Click plausible-event-type=${targetTx.type}`}
          >
            Stamp {targetTx.type} ({totalStamps})
          </LoadingButton>
        </span>
      </HtmlTooltip>
    </>
  );
};

export default StampsMenu;
