import Arweave from 'arweave';
import { useState } from 'react';

const arweave = Arweave.init({
  host: '127.0.0.1',
  port: 1984,
  protocol: 'http'
})

export const getTxTags = async (txid: string) => {
  const result = await arweave.transactions.get(txid);

  return result.tags;
}

const useArweave = () => {
  const [ addresses, setAddresses ] = useState<string[]>([]);
  const [ isLoading, setIsLoading ] = useState(false);
  const [ error, setError ] = useState('');
  const [ isConnected, setIsConnected ] = useState(false);
  const [ network, setNetwork ] = useState('');

  // Or manually specify a host
  /* const arweave = Arweave.init({
    host: 'arweave.dev',
    port: 443,
    protocol: 'https'
  }); */
  

  const connect = async () => {
    setIsLoading(true);
    try {
      await window.arweaveWallet.connect(['ACCESS_ALL_ADDRESSES']);
    }
    catch (error: any) {
      setError(`${error.message}. Refresh to try again.`);
    }
    const addresses = await window.arweaveWallet.getAllAddresses();
    const network = await (await arweave.network.getInfo()).network;
    setNetwork(network);
    setAddresses(addresses);
    setIsLoading(false);
    setIsConnected(true);
  }

  const getData = async (txid: string) => {
    const result = await arweave.transactions.getData(txid, { decode: true });

    return result;
  }

  const getDataPromise = (txid: string) => arweave.transactions.getData(txid, { decode: true });

  return {
    connect,
    getData,
    getDataPromise,
    arweave,
    addresses,
    isLoading,
    error,
    isConnected,
    network,
  }
};

export default useArweave;