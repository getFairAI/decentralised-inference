import { TAG_NAMES } from '@/constants';
import FilterContext from '@/context/filter';
import { IContractEdge } from '@/interfaces/arweave';
import { commonUpdateQuery, findTagsWithKeyword } from '@/utils/common';
import { useQuery, NetworkStatus, gql } from '@apollo/client';
import { RefObject, useState, useContext, useEffect, useMemo } from 'react';
import useOnScreen from './useOnScreen';
import FairSDKWeb from 'fair-protocol-sdk/web';

const useModels = (target?: RefObject<HTMLElement>, featuredElements?: number) => {
  const [hasNextPage, setHasNextPage] = useState(false);
  const [txs, setTxs] = useState<IContractEdge[]>([]);
  const [featuredTxs, setFeaturedTxs] = useState<IContractEdge[]>([]);
  const [ validTxs, setValidTxs ] = useState<IContractEdge[]>([]);
  const [ filtering, setFiltering ] = useState(false);
  
  const filterValue = useContext(FilterContext);

  const elementsPerPage = 5;
  const defaultFeaturedElements = 3;
  const query = FairSDKWeb.utils.getModelsQuery(elementsPerPage);
  const { data, loading, error, fetchMore, networkStatus } = useQuery(gql(query.query), { variables: query.variables });

  const loadingOrFiltering = useMemo(() => filtering || loading, [filtering, loading]);

  useEffect(() => {
    if (data && networkStatus === NetworkStatus.ready) {
      (async () => {
        setFiltering(true);
        const filtered = await FairSDKWeb.utils.modelsFilter(data.transactions.edges);
        setHasNextPage(data.transactions.pageInfo.hasNextPage);
        setTxs(filtered);
        setValidTxs(filtered);
        if (featuredTxs.length === 0) {
          setFeaturedTxs(filtered.slice(0, featuredElements || defaultFeaturedElements));
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
            [TAG_NAMES.modelName, TAG_NAMES.description, TAG_NAMES.category],
            filterValue,
          ),
      );
      setTxs(filtered);
      setFiltering(false);
    }
  }, [filterValue]);

  if (target) {
    const isOnScreen = useOnScreen(target);

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
      txs,
      loading: loadingOrFiltering,
      isOnScreen,
      featuredTxs,
      error,
    };
  } else {
    return {
      txs,
      loading: loadingOrFiltering,
      featuredTxs,
      error,
    };
  }
};

export default useModels;
