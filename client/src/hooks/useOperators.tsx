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
  PROTOCOL_NAME,
  REGISTER_OPERATION,
  TAG_NAMES,
  MARKETPLACE_EVM_ADDRESS,
  REGISTRATION_USDC_FEE,
  PROTOCOL_VERSION,
} from '@/constants';
import { useQuery, NetworkStatus } from '@apollo/client';
import { useState, useEffect, useMemo } from 'react';
import _ from 'lodash';
import Stamps, { CountResult } from '@permaweb/stampjs';
import { WarpFactory } from 'warp-contracts';
import Arweave from 'arweave';
import {
  findByTagsQuery,
  findByTagsAndOwnersDocument,
  findByTagsDocument,
  getLinkedEvmWallet,
  validateDistributionFees,
  getUsdcSentLogs,
  decodeTxMemo,
} from '@fairai/evm-sdk';
import { OperatorData } from '@/interfaces/common';

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
  const [filtering, setFiltering] = useState(false);

  const ids = useMemo(() => txs.map((tx) => tx.node.id), [txs]);
  const owners = useMemo(() => txs.map((tx) => tx.node.owner.address), [txs]);
  const solutionIds = useMemo(() => solutions.map((solution) => solution.node.id), [solutions]);

  /*   const { currentAddress } = useContext(EVMWalletContext); */

  const elementsPerPage = 100;

  const { data, previousData, loading, error, fetchMore, networkStatus } = useQuery(
    findByTagsDocument,
    {
      variables: {
        tags: [
          { name: TAG_NAMES.protocolName, values: [PROTOCOL_NAME] }, // keep Fair Protocol in tags to keep retrocompatibility
          { name: TAG_NAMES.protocolVersion, values: [PROTOCOL_VERSION] },
          { name: TAG_NAMES.operationName, values: [REGISTER_OPERATION] },
          { name: TAG_NAMES.solutionTransaction, values: solutionIds },
        ],
        first: elementsPerPage,
      },
      skip: !solutionIds /* || !currentAddress, // skip if no address as well because the operators validation require a evm connection */,
    },
  );

  const { data: cancellationData } = useQuery(findByTagsDocument, {
    variables: {
      tags: [
        {
          name: 'Protocol-Name',
          values: ['FairAI', 'Fair Protocol'],
        },
        {
          name: 'Protocol-Version',
          values: ['2.0', '1.0'],
        },
        {
          name: 'Operation-Name',
          values: ['Operator Cancellation'],
        },
        {
          name: 'Registration-Transaction',
          values: ids,
        },
      ],
      first: 100,
    },
    skip: ids.length === 0,
  });

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
    },
    skip: owners.length === 0 || ids.length === 0,
  });

  const loadingOrFiltering = useMemo(() => filtering || loading, [filtering, loading]);

  const transformCountsToObjectMap = (counts: CountResult[]): Map<string, CountResult> =>
    new Map(Object.entries(counts));

  const totalStamps = async (targetTxs: (string | undefined)[]) => {
    try {
      const filteredTxsIds = targetTxs.filter((txId) => txId !== undefined) as string[];
      const stampsInstance = Stamps.init({
        warp: WarpFactory.forMainnet(),
        arweave: Arweave.init({}),
        wallet: undefined,
        dre: 'https://dre-u.warp.cc/contract',
        graphql: 'https://arweave.net/graphql',
      });
      const counts = await stampsInstance.counts(filteredTxsIds);

      return transformCountsToObjectMap(counts);
    } catch (errorObj) {
      return new Map<string, CountResult>();
    }
  };

  /**
   * @description Effect that runs on data changes;
   * it is responsible to set the nextPage status and to update current loaded transactionsm
   * filtering correct payments
   */
  useEffect(() => {
    if (networkStatus === NetworkStatus.loading) {
      setFiltering(true);
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
    if (proofData && cancellationData) {
      const availableOperators = txs.filter(
        (op) =>
          !cancellationData?.transactions.edges.find(
            (cancellation) =>
              cancellation.node.owner.address === op.node.owner.address &&
              cancellation.node.tags.find(
                (tag) => tag.name === 'Registration-Transaction' && tag.value === op.node.id,
              ),
          ) &&
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

        for (const operator of availableOperators) {
          // operator fee
          const operatorFee = Number(
            operator.node.tags.find((tag) => tag.name === 'Operator-Fee')?.value,
          );

          // operator evm wallet
          const operatorEvmResult = await getLinkedEvmWallet(operator.node.owner.address);
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
              operatorFee,
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
          }
        }

        // order by stamps
        const stampsCount = await totalStamps(filtered.map((op) => op.tx.node.id) ?? []);

        if (!stampsCount) {
          return filtered;
        }

        // return filtered operators sorted by stamps
        filtered.sort((a, b) => {
          const aTxid = a.tx.node.id;
          const bTxid = b.tx.node.id;

          return (stampsCount.get(aTxid)?.total ?? 0) - (stampsCount.get(bTxid)?.total ?? 0);
        });

        setValidTxs(filtered);
        setFiltering(false);
      })();
    }
  }, [proofData, cancellationData, txs]);

  return {
    loading: loadingOrFiltering,
    validTxs,
    error,
  };
};

export default useOperators;
