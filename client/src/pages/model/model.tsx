import { getData } from '@/context/arweave';
import { Outlet, Params } from 'react-router-dom';

export const txLoader = async ({ params }: { params: Params<string>}) => {
  if (params.txid) {
    const txid = decodeURIComponent(params.txid);
    const res = await getData(txid);
    return res;
  }
  return undefined;
};

const Model = () => {
  return (
    <Outlet />
  );
};

export default Model;