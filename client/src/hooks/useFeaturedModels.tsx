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

import { IContractEdge } from '@/interfaces/arweave';
import { commonUpdateQuery } from '@/utils/common';
import { useQuery, NetworkStatus } from '@apollo/client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import FairSDKWeb from '@fair-protocol/sdk/web';
import _ from 'lodash';
import { TAG_NAMES } from '@/constants';
type fetchWithFilterParam = 'none' | 'text' | 'video' | 'audio' | 'image';
const defaultFeaturedElements = 3;

const useFeaturedModels = (featuredElements = defaultFeaturedElements) => {
  const [hasNextPage, setHasNextPage] = useState(false);
  const [featuredTxs, setFeaturedTxs] = useState<IContractEdge[]>([]);
  const [filtering, setFiltering] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const elementsPerPage = 10;

  const queryObject = FairSDKWeb.utils.getModelsQuery(elementsPerPage);
  const { data, loading, error, networkStatus, refetch, fetchMore } = useQuery(queryObject.query, {
    variables: queryObject.variables,
    notifyOnNetworkStatusChange: true,
  });

  const loadingOrFiltering = useMemo(() => filtering || loading, [ filtering, loading ]);

  useEffect(() => {
    if (data && networkStatus === NetworkStatus.ready) {
      (async () => {
        setFiltering(true);
        const filtered = await FairSDKWeb.utils.modelsFilter(data.transactions.edges);
        setHasNextPage(data.transactions.pageInfo.hasNextPage);

        const newFilteredTxs = filtered.slice(currentPage, featuredElements);
        if (!_.isEqual(newFilteredTxs, featuredTxs)) {
          setFeaturedTxs(newFilteredTxs);
        }
        setFiltering(false);
      })();
    }
  }, [data, networkStatus, currentPage]);

  const fetchNext = useCallback(() => {
    if (data && hasNextPage) {
      (async () => {
        const txs = data?.transactions.edges;
        await fetchMore({
          variables: {
            after: txs > 0 ? txs[txs.length - 1].cursor : undefined,
          },
          updateQuery: commonUpdateQuery,
        });
        setCurrentPage((page) => page + 1);
      })();
    }
  }, [hasNextPage, data]);

  const fetchWithFilter = useCallback(
    (filter: fetchWithFilterParam) => {
      setFiltering(true);
      if (filter !== 'none') {
        const cloneVariables = _.cloneDeep(queryObject.variables);
        cloneVariables.tags.push({
          name: TAG_NAMES.category,
          values: [filter],
        });

        refetch(cloneVariables);
      } else {
        refetch(queryObject.variables);
      }
    },
    [queryObject, setFiltering, refetch ],
  );

  return {
    loading: loadingOrFiltering,
    featuredTxs,
    error,
    fetchNext,
    fetchWithFilter,
  };
};

export default useFeaturedModels;
