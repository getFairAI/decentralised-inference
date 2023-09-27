import { DEFAULT_TAGS, MODEL_CREATION_PAYMENT_TAGS, TAG_NAMES } from '@/constants';
import FilterContext from '@/context/filter';
import { IEdge } from '@/interfaces/arweave';
import { FIND_BY_TAGS } from '@/queries/graphql';
import { commonUpdateQuery, findTag, isFakeDeleted, findTagsWithKeyword } from '@/utils/common';
import { useQuery, NetworkStatus } from '@apollo/client';
import { RefObject, useState, useContext, useEffect } from 'react';
import useOnScreen from './useOnScreen';

const useModels = (target: RefObject<HTMLElement>) => {
  const [hasNextPage, setHasNextPage] = useState(false);
  const [txs, setTxs] = useState<IEdge[]>([]);
  const [featuredTxs, setFeaturedTxs] = useState<IEdge[]>([]);
  const isOnScreen = useOnScreen(target);
  const filterValue = useContext(FilterContext);

  const elementsPerPage = 5;
  const featuredElements = 3;
  const { data, loading, error, fetchMore, networkStatus } = useQuery(FIND_BY_TAGS, {
    variables: {
      tags: [...DEFAULT_TAGS, ...MODEL_CREATION_PAYMENT_TAGS],
      first: elementsPerPage,
    },
  });

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

  useEffect(() => {
    if (data && networkStatus === NetworkStatus.ready) {
      (async () => {
        const filtered: IEdge[] = [];
        for (const el of data.transactions.edges) {
          const modelId = findTag(el, 'modelTransaction') as string;
          const modelOwner = findTag(el, 'sequencerOwner') as string;

          if (!modelOwner || !modelId) {
            // ignore
          } else if (!(await isFakeDeleted(modelId, modelOwner, 'model'))) {
            filtered.push(el);
          } else {
            // ignore
          }
        }
        setHasNextPage(data.transactions.pageInfo.hasNextPage);
        setTxs(filtered);
        if (featuredTxs.length === 0) {
          setFeaturedTxs(filtered.slice(0, featuredElements));
        }
      })();
    }
  }, [data]);

  useEffect(() => {
    if (data) {
      const filtered: IEdge[] = data.transactions.edges.filter(
        (el: IEdge) =>
          filterValue.trim() === '' ||
          findTagsWithKeyword(
            el,
            [TAG_NAMES.modelName, TAG_NAMES.description, TAG_NAMES.category],
            filterValue,
          ),
      );
      setTxs(filtered);
    }
  }, [filterValue]);

  return {
    txs,
    loading,
    isOnScreen,
    featuredTxs,
    error,
  };
};

export default useModels;
