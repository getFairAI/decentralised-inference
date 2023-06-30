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

import { MARKETPLACE_ADDRESS, SCRIPT_DELETION, TAG_NAMES } from '@/constants';
import { client } from './apollo';
import { QUERY_TX_WITH } from '@/queries/graphql';
import { IContractEdge, IEdge } from '@/interfaces/arweave';
import { findTag } from './common';

export const isFakeDeleted = async (txid: string) => {
  const delteTags = [
    // do not use default tags for filtering
    { name: TAG_NAMES.operationName, values: [SCRIPT_DELETION] },
    { name: TAG_NAMES.scriptTransaction, values: [txid] },
  ];
  const { data } = await client.query({
    query: QUERY_TX_WITH,
    variables: { tags: delteTags, address: MARKETPLACE_ADDRESS },
  });

  return data.transactions.edges.length > 0;
};

export const filterPreviousVersions = <T extends Array<IContractEdge | IEdge>>(data: T) => {
  const oldVersionsTxIds: string[] = [];

  for (const el of data) {
    // const previousVersion = findTag(el, 'updateFor');
    // previousVersions should include all versions including updateFor
    const olderVersions = findTag(el, 'previousVersions');
    if (olderVersions) {
      const versionsArray: string[] = JSON.parse(olderVersions);
      oldVersionsTxIds.push(...versionsArray);
    }
    // Array.from(new Set(el))
  }

  return data.filter((el) => !oldVersionsTxIds.find((oldTxId) => el.node.id === oldTxId)) as T;
};
