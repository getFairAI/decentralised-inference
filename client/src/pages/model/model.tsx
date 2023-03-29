import { DEFAULT_TAGS, MODEL_FEE_UPDATE, TAG_NAMES } from '@/constants';
import { GET_LATEST_FEE_UPDATE } from '@/queries/graphql';
import { client } from '@/utils/apollo';
import { findTag } from '@/utils/common';
import { Outlet, Params } from 'react-router-dom';

export const getModelFee = async ({ params }: { params: Params<string> }) => {
  const tags = [
    ...DEFAULT_TAGS,
    { name: TAG_NAMES.operationName, values: [ MODEL_FEE_UPDATE ] },
    { name: TAG_NAMES.modelTransaction, values: [ params.txid ] },
  ];
  const queryResult = await client.query({
    query: GET_LATEST_FEE_UPDATE,
    variables: { tags },
  });
  if (queryResult.data.length > 0) {
    const val = findTag(queryResult.data[0], 'modelFee');
    return val;
  } else {
    return null;
  }
};

const Model = () => {
  return <Outlet />;
};

export default Model;
