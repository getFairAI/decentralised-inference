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

import fs from 'node:fs';
import { Contract, JWKInterface, WarpFactory } from 'warp-contracts';

interface UCMOrder {
  creator: string;
  id: string;
  originalQuantity: number;
  price: number;
  quantity: number;
  token: string;
  transfer: string;
}

interface UCMState {
  state: {
    U: string;
    canEvolve: boolean;
    name: string;
    ticker: string;
    settings: Array<Array<string>>;
    balances: { [address: string]: number };
    claimable: Array<{ txID: string; to: string; qty: number; from: string }>;
    divisibility: number;
    contributors: unknown;
    creator: string;
    lastReward: number;
    originHeight: number;
    pairs: [
      {
        pair: string[];
        orders: UCMOrder[];
      },
    ];
    recentRewards: {
      [key: string]: number;
    };
    streaks: {
      days: number;
      lastHeight: number;
    };
    transferable: boolean;
  };
}

const UCM_CONTRACT_ID = 'tfalT8Z-88riNtoXdF5ldaBtmsfcSmbMqWLh2DHJIbg';
const U_CONTRACT_ID = 'KTzTXT_ANmF84fWEKHzWURD1LWd9QaFR9yfYUwH2Lxw';
const U_DIVIDER = 1e6;

const warp = WarpFactory.forMainnet();

const contract = warp.contract(UCM_CONTRACT_ID).setEvaluationOptions({
  remoteStateSyncSource: 'https://dre-u.warp.cc/contract',
  remoteStateSyncEnabled: true,
  unsafeClient: 'skip',
  allowBigInt: true,
  internalWrites: true,
});

const JWK: JWKInterface = JSON.parse(fs.readFileSync('wallet.json').toString());

const items = [
  ''
];

const createPair = async (assetAddr: string, currencyAssetAddr: string) => {
  await contract.writeInteraction(
    {
      function: 'addPair',
      pair: [assetAddr, currencyAssetAddr],
    },
    { strict: true },
  );
};

const checkPairExists = async (assetAddr: string, currencyAssetAddr: string) => {
  const { cachedValue } = await contract.readState();

  const pairIdx = (cachedValue as UCMState).state.pairs.findIndex(
    (pairObj) => pairObj.pair.includes(assetAddr) && pairObj.pair.includes(currencyAssetAddr),
  );

  return pairIdx >= 0;
};

const allowUCMonAsset = async (assetContract: Contract<unknown>, qty: number) => {
  const result = await assetContract.writeInteraction(
    {
      function: 'allow',
      target: UCM_CONTRACT_ID,
      qty,
    },
    { strict: true },
  );

  return result?.originalTxId;
};

const isAssetAllowed = async (
  assetContract: Contract<unknown>,
  currentAddress: string,
  target: string,
) => {
  const { cachedValue } = await assetContract.readState();

  if (!(cachedValue as UCMState).state.claimable) {
    return undefined;
  }
  const userBalance = (cachedValue as UCMState).state.balances[currentAddress];

  const existingClaim = (cachedValue as UCMState).state.claimable.find(
    (claim) => claim.from === currentAddress && claim.to === target && claim.qty === userBalance,
  );

  return existingClaim?.txID;
};

const existsOrder = async (
  assetAddr: string,
  qty: number,
  transaction: string,
  currencyAssetAddr = UCM_CONTRACT_ID,
) => {
  const { cachedValue } = await contract.readState();

  const matchingPairs = (cachedValue as UCMState).state.pairs.filter(
    (pairObj) => pairObj.pair.includes(assetAddr) && pairObj.pair.includes(currencyAssetAddr),
  );

  let exists = false;
  for (const pair of matchingPairs) {
    // check orders
    const matchingOrderIdx = pair.orders.filter(
      (order) =>
        order.token === assetAddr && order.transfer === transaction && order.quantity === qty,
    );
    if (matchingOrderIdx.length > 0) {
      exists = true;
    } else {
      // ignore
    }
  }

  return exists;
};

const createSellOrder = async (
  assetAddr: string,
  qty: number,
  price: number,
  transaction: string,
  currencyAssetAddr: string,
  divider: number
) => await contract.writeInteraction(
  {
    function: 'createOrder',
    pair: [assetAddr, currencyAssetAddr],
    price: price * divider,
    qty,
    transaction,
  },
  { strict: true },
);

(async () => {
  const wallet = await warp.arweave.wallets.jwkToAddress(JWK);

  for (const tx of items) {
    const assetContract = warp.contract(tx).connect(JWK);
    const existsPair = await checkPairExists(tx, U_CONTRACT_ID);

    if (!existsPair) {
      await createPair(tx, U_CONTRACT_ID);
    }

    

    let allowTxId = await isAssetAllowed(assetContract,wallet, UCM_CONTRACT_ID);

    if (!allowTxId) {
      allowTxId = await allowUCMonAsset(assetContract, 1);
    }

    if (!allowTxId) {
      throw new Error('Could not allow asset on ucm');
    }

    const existingOrder = await existsOrder(tx, 1, allowTxId, U_CONTRACT_ID);

    if (!existingOrder) {
      const result = await createSellOrder(tx, 1, 1, allowTxId, U_CONTRACT_ID, U_DIVIDER);

      console.log(result);
    }
  }
})();
