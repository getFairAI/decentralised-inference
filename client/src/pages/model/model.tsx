import { getData, getTxTags } from '@/context/arweave';
import { Container } from '@mui/material';
import { Outlet, Params } from 'react-router-dom';

export const txLoader = async ({ params }: { params: Params<string>}) => {
  const txid = decodeURIComponent(params.txid!);
  const res = await getData(txid);
  return res;
};

const Model = () => { 

  return (
    <Outlet />
  );
};

export default Model;