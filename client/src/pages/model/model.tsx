import { AVATAR_ATTACHMENT, DEFAULT_TAGS, MODEL_ATTACHMENT, MODEL_FEE_UPDATE, NOTES_ATTACHMENT, TAG_NAMES } from '@/constants';
import { RouteLoaderResult } from '@/interfaces/router';
import { GET_LATEST_FEE_UPDATE, GET_LATEST_MODEL_ATTACHMENTS, GET_TX_OWNER } from '@/queries/graphql';
import { client } from '@/utils/apollo';
import { findTag } from '@/utils/common';
import { Outlet, Params } from 'react-router-dom';

export const getModelFeeAndAttachments = async ({ params }: { params: Params<string> }): Promise<RouteLoaderResult> => {
  const txOwnerResult = await client.query({
    query: GET_TX_OWNER,
    variables: { id: params.txid }
  });
  const txOwner = txOwnerResult.data.transactions.edges[0].node.owner.address;

  // get update fee transactions
  const updateFeeTags = [
    ...DEFAULT_TAGS,
    { name: TAG_NAMES.operationName, values: [ MODEL_FEE_UPDATE ] },
    { name: TAG_NAMES.modelTransaction, values: [ params.txid ] },
  ];
  const queryResult = await client.query({
    query: GET_LATEST_FEE_UPDATE,
    variables: { tags: updateFeeTags, owner: txOwner },
  });
  const updatedFee = queryResult.data.transactions.edges && queryResult.data.transactions.edges[0] ?
    findTag(queryResult.data.transactions.edges[0], 'modelFee') : '';

  // get attachments teransactions
  const attachmentAvatarTags = [
    ...DEFAULT_TAGS,
    { name: TAG_NAMES.operationName, values: [ MODEL_ATTACHMENT ] },
    { name: TAG_NAMES.attachmentRole, values: [ AVATAR_ATTACHMENT ]},
    { name: TAG_NAMES.modelTransaction, values: [ params.txid ] },
  ];
  const avatarAttachmentsResult = await client.query({
    query: GET_LATEST_MODEL_ATTACHMENTS,
    variables: {
      tags: attachmentAvatarTags,
      owner: txOwner
    }
  });

  const avatarTxId = avatarAttachmentsResult.data.transactions.edges && avatarAttachmentsResult.data.transactions.edges[0] ?
    avatarAttachmentsResult.data.transactions.edges[0].node.id : '';

  const attachmentNotestTags = [
    ...DEFAULT_TAGS,
    { name: TAG_NAMES.operationName, values: [ MODEL_ATTACHMENT ] },
    { name: TAG_NAMES.attachmentRole, values: [ NOTES_ATTACHMENT ]},
    { name: TAG_NAMES.modelTransaction, values: [ params.txid ] },
  ];
  const notesAttachmentsResult = await client.query({
    query: GET_LATEST_MODEL_ATTACHMENTS,
    variables: {
      tags: attachmentNotestTags,
      owner: txOwner
    }
  });

  const notesTxId = notesAttachmentsResult.data.transactions.edges && notesAttachmentsResult.data.transactions.edges[0] ?
    notesAttachmentsResult.data.transactions.edges[0].node.id : '';
  
  return {
    updatedFee,
    avatarTxId,
    notesTxId
  };
};

const Model = () => {
  return <Outlet />;
};

export default Model;
