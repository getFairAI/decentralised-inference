import Arweave from 'arweave';
import { useEffect, useState } from 'react';
import { WebBundlr } from 'bundlr-custom';
import { PermissionType } from 'arconnect';
import { NET_ARWEAVE_URL } from '@/constants';

const arweave = Arweave.init({
  host: NET_ARWEAVE_URL.split('//')[1],
  port: 443,
  protocol: 'https',
});

export const getTxTags = async (txid: string) => {
  const result = await arweave.transactions.get(txid);

  return result.tags;
};

export const getData = async (txid: string) => {
  // const result = await arweave.transactions.getData(txid);
  const result = await fetch('http://arweave.net/' + txid);
  const f = new File([(await result.blob())], 'test');
  return '';
 /*  const text = await (await result.blob()).text();
  console.log(text);
  return text; */
};

export const getActiveAddress = async () => {
  const addr = await window.arweaveWallet.getActiveAddress();
  return addr;
};

const useArweave = () => {
  const [addresses, setAddresses] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [network, setNetwork] = useState('');
  const [permissions] = useState<PermissionType[]>([
    'ACCESS_PUBLIC_KEY',
    'SIGNATURE',
    'ACCESS_ADDRESS',
    'SIGN_TRANSACTION',
  ]);

  const connect = async () => {
    setIsLoading(true);
    try {
      await window.arweaveWallet.connect(permissions);
      const addresses = await window.arweaveWallet.getAllAddresses();
      const network = await (await arweave.network.getInfo()).network;
      setNetwork(network);
      setAddresses(addresses);
      setIsLoading(false);
      setIsConnected(true);
    } catch (error) {
      setError(`${(error as { message: string }).message}. Refresh to try again.`);
    }
  };

  const disconnect = async () => {
    try {
      await window.arweaveWallet.disconnect();
      setNetwork('');
      setAddresses([]);
      setIsLoading(false);
      setIsConnected(false);
    } catch (err) {
      console.log(err);
    }
  };

  const getDataPromise = (txid: string) => arweave.transactions.getData(txid, { decode: true });

  const getNodeBalance = async (bundlr: WebBundlr) => {
    // Get loaded balance in atomic units
    const atomicBalance = await bundlr?.getLoadedBalance();

    // Convert balance to an easier to read format
    const convertedBalance = bundlr?.utils.unitConverter(atomicBalance);
    return convertedBalance.toNumber();
  };

  const getWalletBalance = async () => {
    const winstonBalance = await arweave.wallets.getBalance(
      await window.arweaveWallet.getActiveAddress(),
    );
    return arweave.ar.winstonToAr(winstonBalance);
  };

  const connectWallet = async () => {
    if (window.arweaveWallet && !isConnected) {
      try {
        //
        const perms = await window.arweaveWallet.getPermissions();
        if (perms != permissions) {
          await window.arweaveWallet.connect(permissions);
        }
        // await window.arweaveWallet.connect(permissions);
        const addr = await window.arweaveWallet.getActiveAddress();
        const network = await (await arweave.network.getInfo()).network;
        setNetwork(network);
        setAddresses([addr]);
        setIsConnected(true);
      } catch (err) {
        setIsConnected(false);
      }
    }
  };

  const handleWalletSwitch = (event: { detail: { address: string } }) => {
    setAddresses([event.detail.address]);
  };

  useEffect(() => {
    connectWallet();
  }, [permissions]);

  useEffect(() => {
    const arweaveWalletLoaded = async () => {
      await connectWallet();
    };
    window.addEventListener('arweaveWalletLoaded', arweaveWalletLoaded);

    return () => {
      window.removeEventListener('arweaveWalletLoaded', arweaveWalletLoaded);
    };
  }, []);

  useEffect(() => {
    window.addEventListener('walletSwitch', (e) => handleWalletSwitch(e));

    return () => {
      window.removeEventListener('walletSwitch', (e) => handleWalletSwitch(e));
    };
  }, []);

  return {
    connect,
    getDataPromise,
    arweave,
    addresses,
    isLoading,
    error,
    isConnected,
    network,
    getNodeBalance,
    getWalletBalance,
    disconnect,
  };
};

export default useArweave;
