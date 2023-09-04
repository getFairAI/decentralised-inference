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

import { UCM_CONTRACT_ID, UCM_DIVIDER, U_CONTRACT_ID } from '@/constants';
import { WarpFactory } from 'warp-contracts';

const warp = WarpFactory.forMainnet();

const contract = warp.contract(UCM_CONTRACT_ID).setEvaluationOptions({
  remoteStateSyncSource: 'https://dre-u.warp.cc/contract',
  remoteStateSyncEnabled: true,
  unsafeClient: 'skip',
  allowBigInt: true,
  internalWrites: true,
});

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

export const connectToUCM = () => {
  contract.connect('use_wallet');
};

export const getPxlBalance = async (address: string) => {
  try {
    const { cachedValue } = await contract.readState();

    return (cachedValue as UCMState).state.balances[address];
  } catch (error) {
    return '0';
  }
};

export const parsePxlBalance = (balance: string) => {
  try {
    const intBalance = parseInt(balance, 10);
    if (Number.isNaN(intBalance)) {
      throw new Error('NaN');
    }
    return intBalance / UCM_DIVIDER;
  } catch (error) {
    return 0;
  }
};

/**
 * Creates a pair in the ucm
 * @param assetAddr the asset address to create a pair with
 * @param currencyAssetAddr By default create pairs against U token
 */
export const createPair = async (assetAddr: string, currencyAssetAddr = U_CONTRACT_ID) => {
  await contract.writeInteraction(
    {
      function: 'addPair',
      pair: [assetAddr, currencyAssetAddr],
    },
    { strict: true },
  );
};

/**
 * Check if a pair already exists in UCM contract
 * @param assetAddr the asset address to create a pair with
 * @param currencyAssetAddr By default create pairs against U token
 */
export const checkPairExists = async (assetAddr: string, currencyAssetAddr = U_CONTRACT_ID) => {
  const { cachedValue } = await contract.readState();

  const pairIdx = (cachedValue as UCMState).state.pairs.findIndex(
    (pairObj) => pairObj.pair.includes(assetAddr) && pairObj.pair.includes(currencyAssetAddr),
  );

  return pairIdx >= 0;
};

/**
 * Allows UCM contract to access caller balance on asset contract
 * @param assetAddr the asset address to allow ucm to claim
 * @param qty Quantity to allow being claimed by ucm contract
 */
export const allowUCMonAsset = async (assetAddr: string, qty: number) => {
  const assetContract = warp.contract(assetAddr).connect('use_wallet').setEvaluationOptions({
    unsafeClient: 'skip',
    allowBigInt: true,
    internalWrites: true,
  });
  await assetContract.writeInteraction(
    {
      function: 'allow',
      target: UCM_CONTRACT_ID,
      qty,
    },
    { strict: true },
  );
};

/**
 * Reject UCM contract to access caller balance on asset contract
 * @param assetAddr the asset address to reject ucm to claim
 * @param tx claim tx to reject
 */
export const rejectUCMonAsset = async (assetAddr: string, tx: string) => {
  const assetContract = warp.contract(assetAddr).connect('use_wallet').setEvaluationOptions({
    unsafeClient: 'skip',
    allowBigInt: true,
    internalWrites: true,
  });
  await assetContract.writeInteraction(
    {
      function: 'reject',
      tx,
    },
    { strict: true },
  );
};

export const getAssetBalance = async (assetAddr: string, userAddr: string) => {
  const { cachedValue } = await warp
    .contract(assetAddr)
    .connect('use_wallet')
    .setEvaluationOptions({
      unsafeClient: 'skip',
      allowBigInt: true,
      internalWrites: true,
    })
    .readState();

  return (cachedValue as UCMState).state.balances[userAddr];
};

export const getAssetAllowance = async (
  assetAddr: string,
  currentAddress: string,
  target = UCM_CONTRACT_ID,
) => {
  const { cachedValue } = await warp
    .contract(assetAddr)
    .connect('use_wallet')
    .setEvaluationOptions({
      unsafeClient: 'skip',
      allowBigInt: true,
      internalWrites: true,
    })
    .readState();

  if (!(cachedValue as UCMState).state.claimable) {
    return 0;
  }

  const existingClaims = (cachedValue as UCMState).state.claimable.filter(
    (claim) => claim.from === currentAddress && claim.to === target,
  );

  return existingClaims.map((el) => el.qty).reduce((a, b) => a + b, 0);
};

export const getAssetClaims = async (
  assetAddr: string,
  currentAddress: string,
  target = UCM_CONTRACT_ID,
) => {
  const { cachedValue } = await warp
    .contract(assetAddr)
    .connect('use_wallet')
    .setEvaluationOptions({
      unsafeClient: 'skip',
      allowBigInt: true,
      internalWrites: true,
    })
    .readState();

  if (!(cachedValue as UCMState).state.claimable) {
    return [];
  }

  const existingClaims = (cachedValue as UCMState).state.claimable.filter(
    (claim) => claim.from === currentAddress && claim.to === target,
  );

  return existingClaims.map((claim) => claim.txID);
};

export const getAssetBalanceAndAllowed = async (assetAddr: string, currentAddress: string) => {
  const { cachedValue } = await warp
    .contract(assetAddr)
    .connect('use_wallet')
    .setEvaluationOptions({
      unsafeClient: 'skip',
      allowBigInt: true,
      internalWrites: true,
    })
    .readState();

  const balance = (cachedValue as UCMState).state.balances[currentAddress];

  if (!(cachedValue as UCMState).state.claimable) {
    return [balance, 0];
  }

  const existingClaims = (cachedValue as UCMState).state.claimable.filter(
    (claim) => claim.from === currentAddress,
  );
  const allowedBalance = existingClaims.map((el) => el.qty).reduce((a, b) => a + b, 0);

  return [balance, allowedBalance];
};

export const getClaimId = async (
  assetAddr: string,
  currentAddress: string,
  quantity: number,
  target = UCM_CONTRACT_ID,
) => {
  const { cachedValue } = await warp
    .contract(assetAddr)
    .connect('use_wallet')
    .setEvaluationOptions({
      unsafeClient: 'skip',
      allowBigInt: true,
      internalWrites: true,
    })
    .readState();

  const existingClaim = (cachedValue as UCMState).state.claimable.find(
    (claim) => claim.from === currentAddress && claim.to === target && claim.qty === quantity,
  );

  return existingClaim?.txID;
};

export const getUserOrdersForAsset = async (assetAddr: string, userAddr: string) => {
  const { cachedValue } = await contract.readState();

  const matchingPairs = (cachedValue as UCMState).state.pairs.filter((pairObj) =>
    pairObj.pair.includes(assetAddr),
  );

  const allOrders: UCMOrder[] = [];
  for (const pair of matchingPairs) {
    // check orders
    const matchingOrderIdx = pair.orders.filter((order) => order.creator === userAddr);
    allOrders.push(...matchingOrderIdx);
  }

  return allOrders;
};

export const existsOrder = async (
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
/**
 * Creates a pair in the ucm
 * @param assetAddr the asset address to create a pair with
 * @param currencyAssetAddr By default create pairs against U token
 * @returns
 */
export const createSellOrder = async (
  assetAddr: string,
  qty: number,
  price: number,
  transaction: string,
  currencyAssetAddr = U_CONTRACT_ID,
) => {
  await contract.writeInteraction(
    {
      function: 'createOrder',
      pair: [assetAddr, currencyAssetAddr],
      price: price * UCM_DIVIDER,
      qty,
      transaction,
    },
    { strict: true },
  );
};
