import { DEFAULT_TAGS } from '@/constants';
import { ITag } from '@/interfaces/arweave';
import { GET_LATEST_FEE_UPDATE } from '@/queries/graphql';
import { client } from '@/utils/apollo';
import { Outlet, Params } from 'react-router-dom';

export const getModelFee = async ({ params }: { params: Params<string> }) => {
  const tags = [
    ...DEFAULT_TAGS,
    { name: 'Operation-Name', values: ['Model Fee Update'] },
    { name: 'Model-Transaction', values: [params.txid] },
  ];
  const queryResult = await client.query({
    query: GET_LATEST_FEE_UPDATE,
    variables: { tags },
  });
  if (queryResult.data.length > 0) {
    const val = queryResult.data[0].node.tags.find((el: ITag) => el.name === 'Model-Fee').value;
    return val;
  } else {
    return null;
  }
};

const Model = () => {
  return <Outlet />;
};

export default Model;
