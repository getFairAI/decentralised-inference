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

import { Checkbox, IconButton, TableCell, TableRow, Tooltip, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import CopyIcon from '@mui/icons-material/ContentCopy';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import {
  displayShortTxOrAddr,
  findTag,
  parseUnixTimestamp,
} from '@/utils/common';
import { findByTagsQuery } from '@fairai/evm-sdk';
import { useLocation } from 'react-router-dom';

export interface RowData {
  address: string;
  fee: string;
  availability: number;
  stamps: number;
  registrationTimestamp: string;
  scriptName: string;
  scriptCurator: string;
  scriptTransaction: string;
  operatorName: string;
}

/**
 * @description React Function component to handle displaying a row for an operator
 * @param props { operatorTx, modelCreator, modelName, state }
 * @returns
 */
const OperatorRow = ({
  operatorTx,
  index,
  totalStamps,
  isSelected,
  setSelected,
}: {
  operatorTx: { tx: findByTagsQuery['transactions']['edges'][0], evmWallet: `0x${string}`, arweaveWallet: string, operatorFee: number };
  index: number;
  totalStamps: number;
  isSelected: boolean;
  setSelected: (index: number) => void;
}) => {
  const { state } = useLocation();
  const [row, setRow] = useState<Partial<RowData> | undefined>(undefined);

  const scriptCurator = useMemo(
    () => state?.scriptCreator || 'No Curator',
    [state],
  );
  const scriptName = useMemo(() => state?.scriptName, [state]);
  const scriptTransaction = useMemo(() => state?.scriptTransaction, [state]);
  /**
   * @description Effect that runs on `operatorTx` changes; it will create an easier to read object
   * with the necessary props for the row (except availability)
   */
  useEffect(() => {
    const registrationTimestamp = findTag(operatorTx.tx, 'unixTime');
    const operatorName = findTag(operatorTx.tx, 'operatorName') || 'No Name';

    setRow({
      address: operatorTx.evmWallet,
      stamps: totalStamps,
      fee: operatorTx.operatorFee.toString(),
      registrationTimestamp,
      scriptTransaction,
      scriptName,
      scriptCurator,
      operatorName,
      availability: 100,
    });
  }, [operatorTx]);

  return (
    <>
      <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
        <TableCell scope='row'>
          <Tooltip title={row?.address}>
            <Typography>
              {displayShortTxOrAddr(row?.address ?? '')}
              <IconButton
                size='small'
                onClick={() => {
                  row?.address && navigator.clipboard.writeText(row?.address);
                }}
              >
                <CopyIcon fontSize='inherit' />
              </IconButton>
            </Typography>
          </Tooltip>
        </TableCell>
        <TableCell align='right'>{row?.operatorName}</TableCell>
        <TableCell align='right'>
          {parseUnixTimestamp(row?.registrationTimestamp as string)}
        </TableCell>
        <TableCell align='right'>
          {row?.fee}
        </TableCell>
        <TableCell align='right'>
          <Tooltip
            title={
              row?.availability && row.availability > 90
                ? 'Online'
                : row?.availability && row.availability > 50
                ? 'Availability Issues'
                : row?.availability && row.availability > 0
                ? 'Dangerous'
                : 'Offline'
            }
          >
            {row?.availability && row.availability > 90 ? (
              <FiberManualRecordIcon color='success' />
            ) : row?.availability && row.availability > 50 ? (
              <FiberManualRecordIcon color='warning' />
            ) : row?.availability && row.availability > 0 ? (
              <FiberManualRecordIcon color='error' />
            ) : (
              <FiberManualRecordIcon color='disabled' />
            )}
          </Tooltip>
          {}
        </TableCell>
        <TableCell align='right'>
          <span>
            {row?.stamps}
          </span>
        </TableCell>
        <TableCell align='right'>
          <Checkbox color='primary' checked={isSelected} onChange={() => setSelected(index)} />
        </TableCell>
      </TableRow>
    </>
  );
};

export default OperatorRow;
