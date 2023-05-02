import { TAG_NAMES } from '@/constants';
import { IEdge, ITransactions } from '@/interfaces/arweave';
export const formatNumbers = (value: string) => {
  try {
    return parseFloat(value).toFixed(4);
  } catch (error) {
    return '0';
  }
};

export const genLoadingArray = (numElements: number) => {
  return Array.from(new Array(numElements).keys());
};

type tagName = keyof typeof TAG_NAMES;
export const findTag = (tx: IEdge, tagName: tagName) => {
  return tx.node.tags.find((tag) => tag.name === TAG_NAMES[tagName])?.value;
};

interface QueryContent {
  transactions: ITransactions;
}

export const commonUpdateQuery = (
  prev: QueryContent,
  { fetchMoreResult }: { fetchMoreResult: QueryContent },
) => {
  if (!fetchMoreResult) return prev;
  const newData: IEdge[] = fetchMoreResult.transactions.edges;
  newData.sort((a: IEdge, b: IEdge) => {
    const aTimestamp =
      parseInt(findTag(a, 'unixTime') || '') || a.node.block?.timestamp || Date.now() / 1000;
    const bTimestamp =
      parseInt(findTag(b, 'unixTime') || '') || b.node.block?.timestamp || Date.now() / 1000;

    return aTimestamp - bTimestamp;
  });

  const merged: IEdge[] = prev && prev.transactions?.edges ? prev.transactions.edges.slice(0) : [];
  for (const i of newData) {
    if (!merged.find((el: IEdge) => el.node.id === i.node.id)) {
      merged.push(i);
    }
  }
  const newResult = Object.assign({}, prev, {
    transactions: {
      edges: merged,
      pageInfo: fetchMoreResult.transactions.pageInfo,
    },
  });
  return newResult;
};
