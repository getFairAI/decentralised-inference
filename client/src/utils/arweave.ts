import { MIN_CONFIRMATIONS, NET_ARWEAVE_URL } from '../constants';
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
  const result = await fetch(NET_ARWEAVE_URL + '/' + txid);
  const text = await (await result.blob()).text();

  return text;
};

/**
 * Checks if a specific transaction has at least 20 confirmations in the network
 * @param txid id of the transaction to check
 * @returns {boolean} true if the transaction is confirmed and has at least 20 confiramtions, false otherwise
 */
export const isTxConfirmed = async (txid: string) => {
  const result = await arweave.transactions.getStatus(txid);

  return !!result.confirmed && result.confirmed.number_of_confirmations > MIN_CONFIRMATIONS;
};

export const parseWinston = (value?: string) => {
  try {
    return parseFloat(arweave.ar.winstonToAr(value as string)).toFixed(4);
  } catch (error) {
    return '0';
  }
};

export default arweave;
