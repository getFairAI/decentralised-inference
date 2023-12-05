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

import { TAG_NAMES } from '@/constants';
import FilterContext from '@/context/filter';
import { IContractEdge } from '@/interfaces/arweave';
import { commonUpdateQuery, findTagsWithKeyword, findTag } from '@/utils/common';
import { useQuery, NetworkStatus } from '@apollo/client';
import { RefObject, useState, useContext, useEffect, useMemo } from 'react';
import useOnScreen from './useOnScreen';
import FairSDKWeb from '@fair-protocol/sdk/web';
import _ from 'lodash';
import Stamps, { CountResult } from '@permaweb/stampjs';
import { WarpFactory } from 'warp-contracts';
import Arweave from 'arweave';


const useModels = (target?: RefObject<HTMLElement>, featuredElements?: number) => {
  const [hasNextPage, setHasNextPage] = useState(false);
  const [txs, setTxs] = useState<IContractEdge[]>([]);
  const [featuredTxs, setFeaturedTxs] = useState<IContractEdge[]>([]);
  const [validTxs, setValidTxs] = useState<IContractEdge[]>([]);
  const [filtering, setFiltering] = useState(false);
  const [txsCountsMap, setTxsCountsMap] = useState<Map<string, CountResult>>(new Map());

  const filterValue = useContext(FilterContext);
  const isOnScreen = useOnScreen(target);

  const elementsPerPage = 5;
  const defaultFeaturedElements = 3;
  const queryObject = FairSDKWeb.utils.getModelsQuery(elementsPerPage);
  const { data, loading, error, fetchMore, networkStatus } = useQuery(queryObject.query, {
    variables: queryObject.variables,
  });

  const loadingOrFiltering = useMemo(() => filtering || loading, [filtering, loading]);

  const transformCountsToObjectMap = (counts: CountResult[]): Map<string, CountResult> => {
    return new Map(Object.entries(counts));
  };

  const totalStamps = async (targetTxs: (string | undefined)[]) => {
    try {
      const filteredTxsIds = targetTxs.filter((txId) => txId !== undefined) as string[];
      const stampsInstance = Stamps.init({
        warp: WarpFactory.forMainnet(),
        arweave: Arweave.init({}),
        wallet: window.arweaveWallet,
        dre: 'https://dre-u.warp.cc/contract', 
        graphql: 'https://arweave.net/graphql' 
      });
      const counts =  await stampsInstance.counts(filteredTxsIds);

      return transformCountsToObjectMap(counts);
    } catch (error) {
      console.log('error',JSON.stringify(error));
      return new Map<string, CountResult>();
    }
    };

  useEffect(() => {
    if (data && networkStatus === NetworkStatus.ready) {
      (async () => {
        setFiltering(true);
        const filtered = await FairSDKWeb.utils.modelsFilter(data.transactions.edges);
        const targetTxs = filtered.map((el) => findTag(el, 'modelTransaction'));
        const mapTxsCountStamps = await totalStamps(targetTxs);
        setTxsCountsMap(mapTxsCountStamps);
        setHasNextPage(data.transactions.pageInfo.hasNextPage);
        setTxs(filtered);
        setValidTxs(filtered);
        const newFilteredTxs = filtered.slice(0, featuredElements ?? defaultFeaturedElements);
        if (!_.isEqual(newFilteredTxs, featuredTxs)) {
          setFeaturedTxs(newFilteredTxs);
        }
        setFiltering(false);
      })();
    }
  }, [data]);

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
      (async () => {
        await fetchMore({
          variables: {
            after: txs.length > 0 ? txs[txs.length - 1].cursor : undefined,
          },
          updateQuery: commonUpdateQuery,
        });
      })();
    }
  }, [isOnScreen, txs]);

  return {
    loading: loadingOrFiltering,
    txs,
    txsCountsMap,
    isOnScreen,
    featuredTxs,
    error,
  };
};

export default useModels;
