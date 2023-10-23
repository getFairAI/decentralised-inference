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

import {
  APACHE_ID,
  CREATIVEML_M_ID,
  CREATIVEML_PLUSPLUS_M_ID,
  MARKETPLACE_ADDRESS,
  MIT_ID,
  MODEL_DELETION,
  NET_ARWEAVE_URL,
  SCRIPT_DELETION,
  TAG_NAMES,
  UDL_ID,
  defaultDecimalPlaces,
  secondInMS,
} from '@/constants';
import { IContractEdge, IEdge, ITag, ITransactions } from '@/interfaces/arweave';
import { QUERY_TX_WITH_OWNERS } from '@/queries/graphql';
import { client } from './apollo';
import redstone from 'redstone-api';
import { LicenseForm } from '@/interfaces/common';

export const formatNumbers = (value: string) => {
  try {
    return parseFloat(value).toFixed(defaultDecimalPlaces);
  } catch (error) {
    return '0';
  }
};

export const genLoadingArray = (numElements: number) =>
  Array.from({ length: numElements }, (_, index) => index);

type tagName = keyof typeof TAG_NAMES;
export const findTag = (tx: IEdge | IContractEdge, tagName: tagName) =>
  tx.node.tags.find((tag) => tag.name === TAG_NAMES[tagName])?.value;

export const findTagsWithKeyword = (
  tx: IEdge | IContractEdge,
  tagNames: string[],
  searchKeyword: string,
): boolean =>
  tx.node.tags.some(
    (tag) =>
      tagNames.includes(tag.name) &&
      tag.value.toLowerCase()?.includes(searchKeyword.toLowerCase().trim()),
  );

interface QueryContent {
  transactions: ITransactions;
}

export const commonUpdateQuery = (
  prev: QueryContent,
  { fetchMoreResult }: { fetchMoreResult: QueryContent },
) => {
  if (!fetchMoreResult) {
    return prev;
  }
  const newData: IEdge[] = fetchMoreResult.transactions.edges;
  newData.sort((a: IEdge, b: IEdge) => {
    const aTimestamp =
      parseInt(findTag(a, 'unixTime') ?? '', 10) ??
      a.node.block?.timestamp ??
      Date.now() / secondInMS;
    const bTimestamp =
      parseInt(findTag(b, 'unixTime') ?? '', 10) ??
      b.node.block?.timestamp ??
      Date.now() / secondInMS;

    return aTimestamp - bTimestamp;
  });

  const merged: IEdge[] = prev?.transactions?.edges ? prev.transactions.edges.slice(0) : [];
  for (const i of newData) {
    if (!merged.find((el: IEdge) => el.node.id === i.node.id)) {
      merged.push(i);
    }
  }

  return Object.assign({}, prev, {
    transactions: {
      edges: merged,
      pageInfo: fetchMoreResult.transactions.pageInfo,
    },
  });
};

export const printSize = (args: File | number) => {
  let size;
  if (typeof args === 'number') {
    size = args;
  } else {
    size = args.size;
  }

  const kb = 1024;
  const mbElevation = 2;
  const mb = Math.pow(kb, mbElevation);
  const gbElevation = 3;
  const gb = Math.pow(kb, gbElevation);
  const divider = 100;

  if (size < kb) {
    return `${size} bytes`;
  } else if (size < mb) {
    const kbSize = size / kb;
    return `${Math.round((kbSize + Number.EPSILON) * divider) / divider} KB`;
  } else if (size < gb) {
    const mbSize = size / mb;
    return `${Math.round((mbSize + Number.EPSILON) * divider) / divider} MB`;
  } else {
    const gbSize = size / gb;
    return `${Math.round((gbSize + Number.EPSILON) * divider) / divider} GB`;
  }
};

export const download = (name: string, txid: string) => {
  const a = document.createElement('a');
  a.href = `${NET_ARWEAVE_URL}/${txid}`;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

export const parseUnixTimestamp = (timestamp: number | string) => {
  if (typeof timestamp === 'string') {
    return new Date(parseFloat(timestamp) * secondInMS).toLocaleString();
  } else {
    return new Date(timestamp * secondInMS).toLocaleString();
  }
};

const start = 0;
const firstSliceEnd = 6;
const secondSliceStart = -2;

export const displayShortTxOrAddr = (addrOrTx: string) =>
  `${addrOrTx.slice(start, firstSliceEnd)}...${addrOrTx.slice(secondSliceStart)}`;

export const isFakeDeleted = async (txid: string, owner: string, type: 'script' | 'model') => {
  const deleteTags = [];

  if (type === 'model') {
    deleteTags.push({ name: TAG_NAMES.operationName, values: [MODEL_DELETION] });
    deleteTags.push({ name: TAG_NAMES.modelTransaction, values: [txid] });
  } else {
    deleteTags.push({ name: TAG_NAMES.operationName, values: [SCRIPT_DELETION] });
    deleteTags.push({ name: TAG_NAMES.scriptTransaction, values: [txid] });
  }

  const { data } = await client.query({
    query: QUERY_TX_WITH_OWNERS,
    variables: { tags: deleteTags, owners: [MARKETPLACE_ADDRESS, owner] },
  });

  return data.transactions.edges.length > 0;
};

export const getArPriceUSD = async () => {
  const price = await redstone.getPrice('AR');
  return price.value;
};

export const parseCost = async (cost: number) => {
  const arPrice = await getArPriceUSD();
  return cost * arPrice;
};

export const addLicenseConfigTags = (tags: ITag[], licenseProps: LicenseForm, license?: string) => {
  const licenseTags = [];
  if (!license || license === 'Default') {
    return;
  } else if (license === 'Universal Data License (UDL) Default Public Use') {
    licenseTags.push({ name: TAG_NAMES.license, value: UDL_ID });
  } else if (license === 'Universal Data License (UDL) Commercial - One Time Payment') {
    licenseTags.push({ name: TAG_NAMES.license, value: UDL_ID });
    // other options
    licenseTags.push({ name: TAG_NAMES.commercialUse, value: 'Allowed' });
    licenseTags.push({ name: TAG_NAMES.licenseFee, value: `One-Time-${licenseProps.licenseFee}` });
    licenseTags.push({ name: TAG_NAMES.currency, value: licenseProps.currency as string });
  } else if (
    license === 'Universal licenseProps License (UDL) Derivative Works - One Time Payment'
  ) {
    licenseTags.push({ name: TAG_NAMES.license, value: UDL_ID });
    // other options
    licenseTags.push({ name: TAG_NAMES.derivation, value: 'With-Credit' });
    licenseTags.push({ name: TAG_NAMES.licenseFee, value: `One-Time-${licenseProps.licenseFee}` });
    licenseTags.push({ name: TAG_NAMES.currency, value: licenseProps.currency as string });
  } else if (license === 'Universal licenseProps License (UDL) Custom') {
    licenseTags.push({ name: TAG_NAMES.license, value: UDL_ID });
    // other options
    if (licenseProps.derivations && licenseProps.revenueShare) {
      licenseTags.push({
        name: TAG_NAMES.derivation,
        value: `Allowed-With-RevenueShare-${licenseProps.revenueShare}%`,
      });
    } else if (licenseProps.derivations) {
      licenseTags.push({ name: TAG_NAMES.derivation, value: licenseProps.derivations });
    } else {
      // ignore
    }

    if (licenseProps.commercialUse) {
      licenseTags.push({ name: TAG_NAMES.commercialUse, value: licenseProps.commercialUse });
    }

    if (licenseProps.licenseFeeInterval && licenseProps.licenseFee) {
      licenseTags.push({
        name: TAG_NAMES.licenseFee,
        value: `${licenseProps.licenseFeeInterval}-${licenseProps.licenseFee}`,
      });
    }

    if (licenseProps.currency) {
      licenseTags.push({ name: TAG_NAMES.currency, value: licenseProps.currency });
    }

    if (licenseProps.expires) {
      licenseTags.push({ name: TAG_NAMES.expires, value: licenseProps.expires.toString() });
    }

    if (licenseProps.paymentAddress) {
      licenseTags.push({ name: TAG_NAMES.paymentAddress, value: licenseProps.paymentAddress });
    }

    if (licenseProps.paymentMode) {
      licenseTags.push({ name: TAG_NAMES.paymentMode, value: licenseProps.paymentMode });
    }
  } else if (license === 'APACHE 2.0') {
    licenseTags.push({ name: TAG_NAMES.license, value: APACHE_ID });
  } else if (license === 'MIT') {
    licenseTags.push({ name: TAG_NAMES.license, value: MIT_ID });
  } else if (license === 'CreativeML Open RAIL-M') {
    licenseTags.push({ name: TAG_NAMES.license, value: CREATIVEML_M_ID });
  } else if (license === 'CreativeML Open RAIL++-M') {
    licenseTags.push({ name: TAG_NAMES.license, value: CREATIVEML_PLUSPLUS_M_ID });
  } else {
    licenseTags.push({ name: TAG_NAMES.license, value: license });
  }

  const LicenseConfigTag = { name: TAG_NAMES.licenseConfig, value: JSON.stringify(licenseTags) };
  tags.push(LicenseConfigTag);
};
