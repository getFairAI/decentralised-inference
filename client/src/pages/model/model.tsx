import { getData } from "@/context/arweave";
import { Container } from "@mui/material";
import { Outlet, Params } from "react-router-dom";

export const txLoader = async ({ params }: { params: Params<string>}) => {
  const res = await getData(params.txid!);
  return res;
};

const Model = () => { 

  return (
    <Outlet />
  )
}

export default Model;