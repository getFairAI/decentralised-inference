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
  TAG_NAMES,
  MARKETPLACE_EVM_ADDRESS,
  REGISTRATION_USDC_FEE,
} from '@/constants';
import { useQuery, NetworkStatus } from '@apollo/client';
import { useState, useEffect, useMemo } from 'react';
import _ from 'lodash';
import {
  findByTagsQuery,
  findByTagsAndOwnersDocument,
  getLinkedEvmWallet,
  validateDistributionFees,
  getUsdcSentLogs,
  decodeTxMemo,
  findByIdDocument,
} from '@fairai/evm-sdk';
import { OperatorData } from '@/interfaces/common';

const currentOperatorRegistrations = [
  'TJwdKL6m7mGGyWpjp_V2tO3UXilvylPdduLSstQQDyk',
  'FWNNrjjm8gFKcySaHfXltb3LtoDp3tUl_XxuXqAUbp4',
  'NC5gZBNACmfVCuEFRD-8W7Jo8XnOCJGFNyCRNzHSMkU',
  'EE0GajOfSDB3s5MqqPs_gBPkFpQjw-lQjIyTaaOjE5Y',
  'tNGQUyAw3KxN_iz66mSX_xz0eBfniBnxez14-GGZr24',
  'kAb3-8IG40wAIl3m3qayODH88ajUFGxSDrPziX6PpCs',
  'ViMaY4LUTS24QVyq04_m84HP7pGGbAZWTk-TRBC9kIE',
  'Vut0HO9JTPcNgK4GpVFDPsq8HGea1XZgQcwjplqVIDE',
];

const validateRegistration = async (
  operatorEvmAddress: `0x${string}`,
  registrationTx: string,
  timestamp: number,
) => {
  const blockRange = 2500;
  const logs = await getUsdcSentLogs(
    operatorEvmAddress,
    MARKETPLACE_EVM_ADDRESS,
    REGISTRATION_USDC_FEE,
    timestamp,
    blockRange,
  );

  for (const log of logs) {
    const arweaveTx = await decodeTxMemo(log.transactionHash!);

    if (arweaveTx === registrationTx) {
      return true;
    }
  }

  return false;
};

const useOperators = (solutions: findByTagsQuery['transactions']['edges']) => {
  const [hasNextPage, setHasNextPage] = useState(false);
  const [txs, setTxs] = useState<findByTagsQuery['transactions']['edges']>([]);
  const [validTxs, setValidTxs] = useState<OperatorData[]>([]);
  const [loadingMap, setLoadingMap] = useState<{ [solutionId: string]: boolean}>({
    'TJwdKL6m7mGGyWpjp_V2tO3UXilvylPdduLSstQQDyk': false,
    'FWNNrjjm8gFKcySaHfXltb3LtoDp3tUl_XxuXqAUbp4': false,
    'NC5gZBNACmfVCuEFRD-8W7Jo8XnOCJGFNyCRNzHSMkU': false,
    'EE0GajOfSDB3s5MqqPs_gBPkFpQjw-lQjIyTaaOjE5Y': false,
    'tNGQUyAw3KxN_iz66mSX_xz0eBfniBnxez14-GGZr24': false,
    'kAb3-8IG40wAIl3m3qayODH88ajUFGxSDrPziX6PpCs': false,
    'ViMaY4LUTS24QVyq04_m84HP7pGGbAZWTk-TRBC9kIE': false,
    'Vut0HO9JTPcNgK4GpVFDPsq8HGea1XZgQcwjplqVIDE': false,
  }); // initialize all false

  const ids = useMemo(() => txs.map((tx) => tx.node.id), [txs]);
  const owners = useMemo(() => txs.map((tx) => tx.node.owner.address), [txs]);

  const { data, previousData, error, fetchMore, networkStatus } = useQuery(
    findByIdDocument,
    {
      variables: {
        ids: currentOperatorRegistrations
      },
      notifyOnNetworkStatusChange: true,
    },
  );

  const { data: proofData } = useQuery(findByTagsAndOwnersDocument, {
    variables: {
      tags: [
        {
          name: 'Protocol-Name',
          values: ['FairAI'],
        },
        {
          name: 'Protocol-Version',
          values: ['2.0'],
        },
        {
          name: 'Operation-Name',
          values: ['Operator Active Proof'],
        },
      ],
      owners,
      first: 100,
      minBlock: 1519194, // query only after block 1519219
    },
    skip: owners.length === 0 || ids.length === 0,
  });

  /**
   * @description Effect that runs on data changes;
   * it is responsible to set the nextPage status and to update current loaded transactionsm
   * filtering correct payments
   */
  useEffect(() => {
    if (networkStatus === NetworkStatus.loading) {
      setLoadingMap((prev) => {
        Object.keys(prev).forEach((key) => {
          prev[key] = true;
        });

        return prev;
      });
    }
    // check has paid correct registration fee
    if (data && networkStatus === NetworkStatus.ready && !_.isEqual(data, previousData)) {
      setTxs(data.transactions.edges);
      setHasNextPage(data.transactions.pageInfo.hasNextPage);
    }
  }, [data, previousData, networkStatus]);

  useEffect(() => {
    if (hasNextPage) {
      const allTxs = data?.transactions?.edges || [];
      const fetchNextCursor = allTxs && allTxs.length > 0 ? allTxs[allTxs.length - 1].cursor : null;
      (async () =>
        fetchMore({
          variables: {
            after: fetchNextCursor,
          },
          updateQuery: (prev: findByTagsQuery, { fetchMoreResult }) => {
            if (!fetchMoreResult) {
              return prev;
            }

            return Object.assign({}, prev, {
              transactions: {
                edges: [...prev.transactions.edges, ...fetchMoreResult.transactions.edges],
                pageInfo: fetchMoreResult.transactions.pageInfo,
              },
            });
          },
        }))();
    }
  }, [data, hasNextPage]);

  useEffect(() => {
    if (proofData /* && cancellationData */) {
      const availableOperators = txs.filter(
        (op) =>
          proofData?.transactions.edges.find(
            (proof) =>
              proof.node.owner.address === op.node.owner.address &&
              Number(proof.node.tags.find((tag) => tag.name === 'Unix-Time')?.value) >
                Date.now() / 1000 - 30 * 60, // needs valid proof in the last 30 min
          ),
      );

      (async () => {
        // validate previous requests
        const filtered = [];
        const registrationFees = availableOperators.map((el) => ({
          solutionId: el.node.tags.find((tag) => tag.name === 'Solution-Transaction')?.value ?? '',
          fee: Number(el.node.tags.find((tag) => tag.name === 'Operator-Fee')?.value),
        }));

        const evmWalletsMap = new Map<string, { evmWallet: `0x${string}`, publicKey: string }>();
        for (const operator of availableOperators) {
          // operator fee
          const operatorFee = Number(
            operator.node.tags.find((tag) => tag.name === 'Operator-Fee')?.value,
          );

          // operator evm wallet
          let operatorEvmResult: { evmWallet: `0x${string}`, publicKey: string } | undefined;
          if (evmWalletsMap.has(operator.node.owner.address)) {
            operatorEvmResult = evmWalletsMap.get(operator.node.owner.address);
          } else {
            operatorEvmResult = await getLinkedEvmWallet(operator.node.owner.address);
            evmWalletsMap.set(operator.node.owner.address, operatorEvmResult!);
          }
          
          const solutionId = operator.node.tags.find((tag) => tag.name === 'Solution-Transaction')
            ?.value as string;
          const curatorEvmAddress = solutions
            .find((solution) => solution.node.id === solutionId)
            ?.node.tags.find((tag) => tag.name === TAG_NAMES.rewardsEvmAddress)?.value as
            | `0x${string}`
            | undefined;

          const timestamp = Number(
            operator.node.tags.find((tag) => tag.name === 'Unix-Time')?.value,
          );
          // validate operator paid registration fee && distributed fees for requests received
          if (
            operatorEvmResult?.evmWallet &&
            (await validateRegistration(
              operatorEvmResult.evmWallet,
              operator.node.id,
              timestamp,
            )) &&
            (await validateDistributionFees(
              operatorEvmResult?.evmWallet,
              operator.node.owner.address,
              registrationFees,
              timestamp,
              curatorEvmAddress,
            ))
          ) {
            filtered.push({
              tx: operator,
              evmWallet: operatorEvmResult?.evmWallet,
              evmPublicKey: operatorEvmResult?.publicKey,
              arweaveWallet: operator.node.owner.address,
              operatorFee,
              solutionId,
            });
            setValidTxs(filtered);
            setLoadingMap((prev) => {
              const solutionId = operator.node.tags.find((tag) => tag.name === 'Solution-Transaction')
                ?.value as string;
              if (solutionId) {
                prev[solutionId] = false;
              }
              return prev;
            });
            // "stream updates"
          }
        }
      })();
    }
  }, [proofData, txs]);

  return {
    loadingMap,
    validTxs,
    error,
  };
};

export default useOperators;
