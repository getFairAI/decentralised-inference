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
  DEFAULT_TAGS,
  INFERENCE_PAYMENT,
  SCRIPT_INFERENCE_RESPONSE,
  TAG_NAMES,
  U_CONTRACT_ID,
} from '@/constants';
import { IContractEdge, IEdge } from '@/interfaces/arweave';
import { FIND_BY_TAGS, QUERY_RESPONSES_BY_OPERATOR } from '@/queries/graphql';
import { useLazyQuery, useQuery } from '@apollo/client';
import { Checkbox, IconButton, TableCell, TableRow, Tooltip, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import CopyIcon from '@mui/icons-material/ContentCopy';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import {
  commonUpdateQuery,
  displayShortTxOrAddr,
  findTag,
  parseCost,
  parseUnixTimestamp,
} from '@/utils/common';
import { parseUBalance } from '@/utils/u';

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
  state,
  index,
  isSelected,
  setSelected,
}: {
  operatorTx: IEdge | IContractEdge;
  state: IEdge;
  index: number;
  isSelected: boolean;
  setSelected: (index: number) => void;
}) => {
  const [row, setRow] = useState<Partial<RowData> | undefined>(undefined);

  const scriptCurator = useMemo(() => findTag(state, 'sequencerOwner') as string, [state]);
  const scriptName = useMemo(() => findTag(state, 'scriptName') as string, [state]);
  const scriptTransaction = useMemo(() => findTag(state, 'scriptTransaction') as string, [state]);
  const [usdFee, setUsdFee] = useState(0);

  const input = useMemo(() => {
    const qty = parseFloat(findTag(operatorTx, 'operatorFee') as string);
    const address =
      (findTag(operatorTx, 'sequencerOwner') as string) ?? operatorTx.node.owner.address;

    const requestPaymentsInputNumber = JSON.stringify({
      function: 'transfer',
      target: address,
      qty,
    });
    const requestPaymentsInputStr = JSON.stringify({
      function: 'transfer',
      target: address,
      qty: qty.toString(),
    });

    return [requestPaymentsInputNumber, requestPaymentsInputStr];
  }, [operatorTx]);

  const requestTags = [
    ...DEFAULT_TAGS,
    {
      name: TAG_NAMES.scriptCurator,
      values: [scriptCurator],
    },
    {
      name: TAG_NAMES.scriptName,
      values: [scriptName],
    },
    {
      name: TAG_NAMES.operationName,
      values: [INFERENCE_PAYMENT],
    },
    { name: TAG_NAMES.contract, values: [U_CONTRACT_ID] },
    { name: TAG_NAMES.input, values: input },
  ];
  const { data, /* loading, error,  */ fetchMore } = useQuery(FIND_BY_TAGS, {
    skip: !scriptCurator && !scriptName && !input,
    variables: {
      first: 10,
      tags: requestTags,
    },
  });

  const [getOpResponses, opResponses] = useLazyQuery(QUERY_RESPONSES_BY_OPERATOR);

  /**
   * @description Effect that runs on `operatorTx` changes; it will create an easier to read object
   * with the necessary props for the row (except availability)
   */
  useEffect(() => {
    const address =
      (findTag(operatorTx, 'sequencerOwner') as string) ?? operatorTx.node.owner.address;
    const stamps = 0;
    const fee = findTag(operatorTx, 'operatorFee');
    const registrationTimestamp = findTag(operatorTx, 'unixTime');
    const operatorName = findTag(operatorTx, 'operatorName') || 'No Name';

    setRow({
      address,
      stamps,
      fee,
      registrationTimestamp,
      scriptTransaction,
      scriptName,
      scriptCurator,
      operatorName,
    });
  }, [operatorTx]);

  /**
   * @description Effect that runs when data from `QUERY_REEQUEST_FOR_OPERATOR` changes;
   * It is responsible to fetch more data while `hasNextPage` is true, otherwise it will
   * execute `getOpResponses` to fetch the responses for all the received requests
   */
  useEffect(() => {
    if (data && data.transactions && data.transactions.pageInfo.hasNextPage) {
      fetchMore({
        variables: {
          after: data.transactions.edges[data.transactions.edges.length - 1].cursor,
        },
        updateQuery: commonUpdateQuery,
      });
    } else if (data && data.transactions) {
      const inferenceReqIds = (data.transactions.edges as IEdge[]).map((req) => {
        return findTag(req, 'inferenceTransaction');
      });

      const owner = findTag(operatorTx, 'sequencerOwner') ?? operatorTx.node.owner.address;

      const responseTags = [
        ...DEFAULT_TAGS,
        {
          name: TAG_NAMES.scriptCurator,
          values: [scriptCurator],
        },
        {
          name: TAG_NAMES.scriptName,
          values: [scriptName],
        },
        {
          name: TAG_NAMES.operationName,
          values: [SCRIPT_INFERENCE_RESPONSE],
        },
        {
          name: TAG_NAMES.requestTransaction,
          values: inferenceReqIds,
        },
      ];
      getOpResponses({
        variables: {
          first: 10,
          tags: responseTags,
          owner,
        },
      });
    }
  }, [data]);

  /**
   * @description Effect that runs when data from `QUERY_RESPONSES_BY_OPERATOR` changes;
   * It is responsible to fetch more responses while `hasNextPage` is true, otherwise it will
   * calculate operator availability (requests/ responses) and execute `getPaidFee` to check if there
   * is a payment transaction with the correct value for each response
   */
  useEffect(() => {
    if (
      opResponses.data &&
      opResponses.data.transactions &&
      opResponses.data.transactions.pageInfo.hasNextPage
    ) {
      opResponses.fetchMore({
        variables: {
          after:
            opResponses.data.transactions.edges[opResponses.data.transactions.edges.length - 1]
              .cursor,
        },
        updateQuery: commonUpdateQuery,
      });
    } else if (opResponses.data) {
      const reqs = data.transactions.edges;
      const responses = opResponses.data.transactions.edges;
      const availability = (reqs.length / responses.length) * 100;
      setRow({ ...row, availability });
    }
  }, [opResponses.data]);

  useEffect(() => {
    (async () => {
      const uBalance = parseUBalance(row?.fee ?? '0');
      const price = await parseCost(uBalance);
      setUsdFee(price);
    })();
  }, [row?.fee]);

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
          {parseUBalance(row?.fee ?? '0')}/{usdFee.toPrecision(4)}
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
        <TableCell align='right'>{row?.stamps}</TableCell>
        <TableCell align='right'>
          <Checkbox color='primary' checked={isSelected} onChange={() => setSelected(index)} />
        </TableCell>
      </TableRow>
    </>
  );
};

export default OperatorRow;
