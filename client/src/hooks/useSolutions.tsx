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
  MARKETPLACE_ADDRESS,
  SOLUTION_DELETION,
  TAG_NAMES,
} from '@/constants';
import FilterContext from '@/context/filter';
import { IContractEdge } from '@/interfaces/arweave';
import { findTagsWithKeyword, findTag } from '@/utils/common';
import { useQuery, NetworkStatus } from '@apollo/client';
import { RefObject, useState, useContext, useEffect, useMemo } from 'react';
import useOnScreen from './useOnScreen';
import _ from 'lodash';
import Stamps, { CountResult } from '@permaweb/stampjs';
import { WarpFactory } from 'warp-contracts';
import Arweave from 'arweave';
import { client } from '@/utils/apollo';
import { findByTagsQuery, findByTagsAndOwnersDocument, findByIdDocument } from '@fairai/evm-sdk';

const currentMarketplaceSolutions = [
  'x8D4-9-lR05EJPlQ_UeRYkL1KPI28Of2NLeepY7CBbo',
  '5tl8yIoz0tI9MMTA4ereCBLxY4ioZRsnBmpjh0heW-4',
  'nXIPpMJ8jN9wusSxcTIijwSHgvb6Z19-Iswzr8A3g2Q',
  'XK1YGb6o2pn10t0usz8VpeICazYlRM5VOTf-1YG80mc',
  'vLeSUPae1fEzEBRYrXJaplikgPAqa3eOVC38mUaDYZk',
  'j8wkH4jRdPygr6DY106n9ibq_WLeA1jaoDgJ16PlFJI',
  'RuBfsVIARw1jLKsGjQCrEHL_QBCAmAAIJ0E3UUu5X0w',
  'zq5_Jvd4miO6QDl42XRpPx9iICDe0AVzanvTepJ_s50',
  'mcr5GzGYhfP69YU-9eGanEc64zv-b5OooSKmC3dvuFk'
];

const useSolutions = (target?: RefObject<HTMLElement>) => {
  const [hasNextPage, setHasNextPage] = useState(false);
  const [txs, setTxs] = useState<IContractEdge[]>([]);
  const [validTxs, setValidTxs] = useState<IContractEdge[]>([]);
  const [filtering, setFiltering] = useState(false);
  const [txsCountsMap, setTxsCountsMap] = useState<Map<string, CountResult>>(new Map());

  const filterValue = useContext(FilterContext);
  const isOnScreen = useOnScreen(target);

  const { data, previousData, loading, error, fetchMore, networkStatus, refetch } = useQuery(
    findByIdDocument,
    {
      errorPolicy: 'all',
      variables: {
        ids: currentMarketplaceSolutions
      },
      notifyOnNetworkStatusChange: true,
    },
  );
  const loadingOrFiltering = useMemo(() => filtering || loading, [filtering, loading]);

  const transformCountsToObjectMap = (counts: CountResult[]): Map<string, CountResult> =>
    new Map(Object.entries(counts));

  const totalStamps = async (targetTxs: (string | undefined)[]) => {
    try {
      const filteredTxsIds = targetTxs.filter((txId) => txId !== undefined) as string[];
      const stampsInstance = Stamps.init({
        warp: WarpFactory.forMainnet(),
        arweave: Arweave.init({}),
        wallet: window.arweaveWallet,
        dre: 'https://dre-u.warp.cc/contract',
        graphql: 'https://arweave.net/graphql',
      });
      const counts = await stampsInstance.counts(filteredTxsIds);

      return transformCountsToObjectMap(counts);
    } catch (errorObj) {
      return new Map<string, CountResult>();
    }
  };


  useEffect(() => {
    if (networkStatus === NetworkStatus.refetch || networkStatus === NetworkStatus.loading) {
      setFiltering(true);
    } else if (networkStatus === NetworkStatus.error) {
      setFiltering(false);
    }
  }, [ networkStatus ]);
  /**
   * @description Effect that runs on data changes;
   * it is responsible to set the nextPage status and to update current loaded transactionsm
   * filtering correct payments
   */
  useEffect(() => {
    // check has paid correct registration fee
    if (data && networkStatus === NetworkStatus.ready && !_.isEqual(data, previousData)) {
      (async () => {
        const txs = [...data.transactions.edges]; // mutable copy of txs
        let allPreviousVersionsTxs: string[] = [];
        const filtered = txs.reduce((acc, el) => {
          acc.push(el);
          // find previousVersionsTag
          const previousVersions = findTag(el, 'previousVersions');
          if (previousVersions) {
            allPreviousVersionsTxs = allPreviousVersionsTxs.concat(...JSON.parse(previousVersions));
            // remove previous versions from accumulator array
          }
          const newAcc = acc.filter((el) => !allPreviousVersionsTxs.includes(el.node.id));

          return newAcc;
        }, [] as findByTagsQuery['transactions']['edges']);

        const filteredCopy = [...filtered];
        for (const tx of filteredCopy) {
          const deleteTags = [
            { name: TAG_NAMES.operationName, values: [SOLUTION_DELETION] },
            { name: TAG_NAMES.solutionTransaction, values: [tx.node.id] },
          ];

          const owners = [MARKETPLACE_ADDRESS, tx.node.owner.address];

          const data = await client.query({
            query: findByTagsAndOwnersDocument,
            variables: {
              tags: deleteTags,
              first: filteredCopy.length,
              owners,
            },
          });

          if (data.data.transactions.edges.length > 0) {
            // remove scripts with cancellations
            filtered.splice(
              filtered.findIndex((el: IContractEdge) => el.node.id === tx.node.id),
              1,
            );
          }
        }

        setHasNextPage(data.transactions.pageInfo.hasNextPage);
        setFiltering(false);
        setTxs(filtered);
        setValidTxs(filtered);
        setTxsCountsMap(await totalStamps(filtered.map((el) => el.node.id)));
      })();
    }
  }, [data, previousData, networkStatus]);

  
  useEffect(() => {
    if (error) {
      setFiltering(false);
    }
  }, [ error ]);

  useEffect(() => {
    if (data) {
      setFiltering(true);
      const filtered: IContractEdge[] = validTxs.filter(
        (el: IContractEdge) =>
          filterValue.trim() === '' ||
          findTagsWithKeyword(
            el,
            [TAG_NAMES.modelName, TAG_NAMES.description, TAG_NAMES.modelCategory],
            filterValue,
          ),
      );
      setTxs(filtered);
      setFiltering(false);
    }
  }, [filterValue]);

  useEffect(() => {
    if (isOnScreen && hasNextPage) {
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
  }, [isOnScreen, data, hasNextPage]);

  return {
    loading: loadingOrFiltering,
    txs,
    txsCountsMap,
    isOnScreen,
    error,
    refetch,
  };
};

export default useSolutions;
