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

import { useState, useEffect, useMemo } from 'react';
import { findByTagsQuery } from '@fairai/evm-sdk';
import { OperatorData } from '@/interfaces/common';
import ao from '@/utils/ao';

const useOperators = (solutions: findByTagsQuery['transactions']['edges']) => {
  const [txs, setTxs] = useState<OperatorData[]>([]);
  const [filteredTxs, setFilteredTxs] = useState<OperatorData[]>([]);
  const [filtering, setFiltering] = useState(false);
  const [error, setError] = useState('');

  const loadingOrFiltering = useMemo(() => filtering, [filtering]);

  useEffect(() => {
    (async () => {
      setFiltering(true);
      // request operators from ao process
      try {
        console.log('use operators');
        const result = await ao.dryrun({
          process: 'h9AowtfL42rKUEV9C-LjsP5yWitnZh9n1cKLBZjipk8',
          tags: [{ name: 'Action', value: 'Manager-Get-Registrations' }],
        });
        console.log(result, 'registrations result');
        // parse result
        const {
          Messages: [{ Data: registrationsStr }],
        } = result;

        const txs: {
          solutions: string[];
          id: string;
          fee: number;
          label: string;
          evmAddress: `0x${string}`;
          evmPublicKey: string;
          owner: string;
        }[] = JSON.parse(registrationsStr);
        setTxs(
          txs.map((el) => ({
            txId: el.id,
            operatorFee: el.fee,
            evmPublicKey: el.evmPublicKey,
            evmWallet: el.evmAddress,
            arweaveWallet: el.owner,
            label: el.label,
            solutionIds: el.solutions,
          })),
        );
      } catch (err) {
        setFilteredTxs([]);
        setError('Error fetching operators');
      }

      setFiltering(false);
    })();
  }, [ao]);

  useEffect(() => {
    if (txs.length > 0 && solutions.length > 0) {
      const filtered = txs.filter((el) =>
        solutions.some((sol) => el.solutionIds.includes(sol.node.id)),
      );
      // filter out operators with solutions
      setFilteredTxs(filtered);
    }
  }, [txs, solutions]);

  return {
    loading: loadingOrFiltering,
    validTxs: filteredTxs,
    error,
  };
};

export default useOperators;
