/*
 * Fair Protocol, open source decentralised inference marketplace for artificial intelligence.
 * Copyright (C) 2023 Fair Protocol
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 */

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

export const getData = async (txid: string, fileName?: string) => {
  const result = await fetch(`${NET_ARWEAVE_URL}/${txid}`);
  const contentType = result.headers.get('Content-Type');
  if (contentType?.includes('text') || contentType?.includes('json')) {
    return (await result.blob()).text();
  } else {
    const blob = await result.blob();
    return new File([blob], fileName ?? blob.name, { type: blob.type });
  }
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
