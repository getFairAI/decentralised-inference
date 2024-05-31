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

import { useQuery, NetworkStatus } from '@apollo/client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import _ from 'lodash';
import { TAG_NAMES } from '@/constants';
import { findByIdDocument, findByIdQuery } from '@fairai/evm-sdk';
type fetchWithFilterParam = 'none' | 'text' | 'video' | 'audio' | 'image';

const useFeaturedModels = () => {
  const [featuredTxs, setFeaturedTxs] = useState<findByIdQuery['transactions']['edges']>([]);
  const [filtering, setFiltering] = useState(false);

  const hardcodedIds = [
    'k-15FFlgqRbZaoqnz1RyHwCC0NYUdf0YCb5B4smjZP4',
    'yehWFToOVkPcD4SnFD-LGUi9stIm-kex8YYm2rF3X28',
    'Pwip-YVna2wMDyuqVKfHPRRovoOxrMbOmkuXty8Z2Yk',
    'D0ORC_JvuAd5yA51PwyzX-XdSQe_PX_mg83xy4xHYuA',
  ];

  const { data, loading, error, networkStatus } = useQuery(findByIdDocument, {
    variables: { ids: hardcodedIds },
    notifyOnNetworkStatusChange: true,
  });

  const loadingOrFiltering = useMemo(() => filtering || loading, [filtering, loading]);

  useEffect(() => {
    if (data && networkStatus === NetworkStatus.ready) {
      (async () => {
        setFiltering(true);

        if (!_.isEqual(data.transactions.edges, featuredTxs)) {
          setFeaturedTxs(data.transactions.edges.reverse());
        }
        setFiltering(false);
      })();
    }
  }, [data, networkStatus]);

  const fetchWithFilter = useCallback(
    (filter: fetchWithFilterParam) => {
      setFiltering(true);
      if (filter !== 'none') {
        const txs = data?.transactions.edges;
        const filtered = txs?.filter(
          (tx) =>
            tx.node.tags.find((tag) => tag.name === TAG_NAMES.modelCategory)?.value === filter,
        );
        setFeaturedTxs(filtered ?? []);
      } else {
        setFeaturedTxs(data?.transactions.edges ?? []);
      }
      setFiltering(false);
    },
    [data, setFeaturedTxs, setFiltering],
  );

  return {
    loading: loadingOrFiltering,
    featuredTxs,
    error,
    fetchWithFilter,
  };
};

export default useFeaturedModels;
