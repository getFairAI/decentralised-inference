import Arweave from 'arweave';
import { useEffect, useState } from 'react';
import { WebBundlr } from 'bundlr-custom';
import { PermissionType } from 'arconnect';

const arweave = Arweave.init({
  host: 'arweave.dev',
  port: 443,
  protocol: 'https'
});

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
  const [ bundlr, setBundlr ] = useState<WebBundlr | undefined>(undefined);
  const [ permissions, setPermissions ] = useState<PermissionType[]>(['ACCESS_ALL_ADDRESSES', 'ACCESS_PUBLIC_KEY', 'SIGNATURE', 'ACCESS_ADDRESS' ]);

  // Or manually specify a host
  /* const arweave = Arweave.init({
    host: 'arweave.dev',
    port: 443,
    protocol: 'https'
  }); */
  

  const connect = async () => {
    setIsLoading(true);
    try {
      await window.arweaveWallet.connect(permissions);
      console.log(error, 'err');
      const addresses = await window.arweaveWallet.getAllAddresses();
      const network = await (await arweave.network.getInfo()).network;
      setNetwork(network);
      setAddresses(addresses);
      console.log(addresses);
      setIsLoading(false);
      setIsConnected(true);
      // await signer.refresh(window.arweaveWallet);
      const bundlr = new WebBundlr('https://node1.bundlr.network', "arweave", window.arweaveWallet);
      await bundlr.ready();
      setBundlr(bundlr);
    }
    catch (error: any) {
      setError(`${error.message}. Refresh to try again.`);
    }
    
  }

  const getData = async (txid: string) => {
    const result = await arweave.transactions.getData(txid, { decode: true });

    return result;
  }

  const getDataPromise = (txid: string) => arweave.transactions.getData(txid, { decode: true });

  const getNodeBalance = async (bundlr: WebBundlr) => {
    // Get loaded balance in atomic units
    let atomicBalance = await bundlr?.getLoadedBalance();

    // Convert balance to an easier to read format
    let convertedBalance = bundlr?.utils.unitConverter(atomicBalance!);
    return convertedBalance!.toNumber();
  };

  const getWalletBalance = async () => {
    const winstonBalance = await arweave.wallets.getBalance(await window.arweaveWallet.getActiveAddress());
    return arweave.ar.winstonToAr(winstonBalance);
  }

  const connectWallet = async () => {
    if (window !== undefined && window.arweaveWallet) {
      await window.arweaveWallet.connect(permissions);
      const addr = await window.arweaveWallet.getActiveAddress();
      const network = await (await arweave.network.getInfo()).network;
      setNetwork(network);
      setAddresses([addr]);
      setIsConnected(true);
    }
  }

  useEffect(() => { connectWallet()}, [ window ]);
  useEffect(() => { connectWallet()}, [ permissions ])

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
    bundlr,
    getNodeBalance,
    getWalletBalance,
  }
};

export default useArweave;
