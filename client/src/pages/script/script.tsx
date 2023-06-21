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
  AVATAR_ATTACHMENT,
  DEFAULT_TAGS_RETRO,
  MODEL_ATTACHMENT,
  NOTES_ATTACHMENT,
  TAG_NAMES,
} from '@/constants';
import { RouteLoaderResult } from '@/interfaces/router';
import { GET_LATEST_MODEL_ATTACHMENTS, GET_TX } from '@/queries/graphql';
import { client } from '@/utils/apollo';
import { findTag } from '@/utils/common';
import { Outlet, Params } from 'react-router-dom';

export const getScriptAttachments = async ({
  params,
}: {
  params: Params<string>;
}): Promise<RouteLoaderResult> => {
  const txOwnerResult = await client.query({
    query: GET_TX,
    variables: { id: params.txid },
  });
  const tx = txOwnerResult.data.transactions.edges[0];
  const txOwner = tx.node.owner.address;
  const modelTxId = findTag(tx, 'modelTransaction');
  const modelName = findTag(tx, 'modelName');

  // get attachments teransactions
  const attachmentAvatarTags = [
    ...DEFAULT_TAGS_RETRO,
    { name: TAG_NAMES.operationName, values: [MODEL_ATTACHMENT] },
    { name: TAG_NAMES.attachmentRole, values: [AVATAR_ATTACHMENT] },
    { name: TAG_NAMES.scriptTransaction, values: [params.txid] },
  ];
  const avatarAttachmentsResult = await client.query({
    query: GET_LATEST_MODEL_ATTACHMENTS,
    variables: {
      tags: attachmentAvatarTags,
      owner: txOwner,
    },
  });

  const avatarTxId =
    avatarAttachmentsResult.data.transactions.edges &&
    avatarAttachmentsResult.data.transactions.edges[0]
      ? avatarAttachmentsResult.data.transactions.edges[0].node.id
      : '';

  const attachmentNotestTags = [
    ...DEFAULT_TAGS_RETRO,
    { name: TAG_NAMES.operationName, values: [MODEL_ATTACHMENT] },
    { name: TAG_NAMES.attachmentRole, values: [NOTES_ATTACHMENT] },
    { name: TAG_NAMES.scriptTransaction, values: [params.txid] },
  ];
  const notesAttachmentsResult = await client.query({
    query: GET_LATEST_MODEL_ATTACHMENTS,
    variables: {
      tags: attachmentNotestTags,
      owner: txOwner,
    },
  });

  const notesTxId =
    notesAttachmentsResult.data.transactions.edges &&
    notesAttachmentsResult.data.transactions.edges[0]
      ? notesAttachmentsResult.data.transactions.edges[0].node.id
      : '';

  return {
    avatarTxId,
    notesTxId,
    modelTxId,
    modelName,
  };
};

const Script = () => {
  return <Outlet />;
};

export default Script;
