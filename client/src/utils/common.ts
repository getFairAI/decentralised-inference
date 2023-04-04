import { TAG_NAMES } from '@/constants';
import { IEdge } from '@/interfaces/arweave';
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
