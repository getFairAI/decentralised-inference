import { NET_ARWEAVE_URL } from '@/constants';
import Arweave from 'arweave';

const arweave = Arweave.init({
  host: NET_ARWEAVE_URL.split('//')[1],
  port: 443,
  protocol: 'https',
});

export const getWalletBalance = async () => {
  const winstonBalance = await arweave.wallets.getBalance(
    await window.arweaveWallet.getActiveAddress(),
  );

  return arweave.ar.winstonToAr(winstonBalance);
};

export const getData = async (txid: string) => {
  const result = await fetch('http://arweave.net/' + txid);
  const text = await (await result.blob()).text();

  return text;
};

export default arweave;
