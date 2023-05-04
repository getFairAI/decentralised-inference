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
  APP_NAME,
  APP_VERSION,
  DEFAULT_TAGS,
  DOWN_VOTE,
  REGISTER_OPERATION,
  SCRIPT_FEE_PAYMENT,
  TAG_NAMES,
  UP_VOTE,
  VOTE_FOR_MODEL,
  VOTE_FOR_OPERATOR,
  VOTE_FOR_SCRIPT,
  secondInMS,
} from '@/constants';
import { WalletContext } from '@/context/wallet';
import {
  QUERY_FEE_PAYMENT,
  QUERY_REGISTERED_OPERATORS,
  QUERY_REGISTERED_SCRIPTS,
  QUERY_USER_HAS_VOTED,
  QUERY_VOTES,
} from '@/queries/graphql';
import arweave from '@/utils/arweave';
import { useQuery } from '@apollo/client';
import { Box, CircularProgress, IconButton, Typography } from '@mui/material';
import { enqueueSnackbar } from 'notistack';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt';
import ThumbDownOffAltIcon from '@mui/icons-material/ThumbDownOffAlt';
import { commonUpdateQuery } from '@/utils/common';
import { voteForOptions } from '@/interfaces/common';
import { IEdge } from '@/interfaces/arweave';
import { isVouched } from '@/utils/vouch';
import { client } from '@/utils/apollo';

const countVouchedVotes = async (
  txid: string,
  fee: number,
  owner: string,
  voteTxs: IEdge[],
  voteFor: voteForOptions,
) => {
  const filtered: IEdge[] = [];
  await Promise.all(
    voteTxs.map(async (el: IEdge) => {
      const vouched = await isVouched(el.node.owner.address);
      let paidFee = false;
      switch (voteFor) {
        case 'model':
          paidFee = await checkCuratorPaidFee(txid, fee, owner, el.node.owner.address);
          break;
        case 'script':
          paidFee = await checkOperatorPaidFee(txid, fee, owner, el.node.owner.address);
          break;
        case 'operator':
          paidFee = await checkUserPaidFee(txid, fee, owner, el.node.owner.address);
          break;
        default: // do nothing
      }
      if (vouched && paidFee) {
        filtered.push(el);
      }
    }),
  );

  return filtered.length;
};

const checkCuratorPaidFee = async (txid: string, fee: number, owner: string, addr: string) => {
  const tags = [
    ...DEFAULT_TAGS,
    {
      name: TAG_NAMES.modelTransaction,
      values: [txid],
    },
  ];
  const queryResult = await client.query({
    query: QUERY_REGISTERED_SCRIPTS,
    variables: { tags, first: 1, addresses: [addr], recipients: [owner] },
  });
  if (queryResult.data.transactions.edges.length > 0) {
    const paymentTx = queryResult.data.transactions.edges[0];
    const correctFee = fee === parseInt(paymentTx.node.quantity.ar, 10);
    const correctTarget = paymentTx.node.recipient === owner;

    return correctFee && correctTarget;
  }
  return false;
};

const checkUserPaidFee = async (txid: string, fee: number, owner: string, addr: string) => {
  const tags = [
    ...DEFAULT_TAGS,
    { name: TAG_NAMES.scriptTransaction, values: txid },
    { name: TAG_NAMES.operationName, values: SCRIPT_FEE_PAYMENT },
  ];
  const queryResult = await client.query({
    query: QUERY_FEE_PAYMENT,
    variables: { tags, first: 1, addresses: [addr], recipients: [owner] },
  });
  if (queryResult.data.transactions.edges.length > 0) {
    const paymentTx = queryResult.data.transactions.edges[0];
    const correctFee = fee === parseInt(paymentTx.node.quantity.ar, 10);
    const correctTarget = paymentTx.node.recipient === owner;

    return correctFee && correctTarget;
  }
  return false;
};

const checkOperatorPaidFee = async (txid: string, fee: number, owner: string, addr: string) => {
  const tags = [
    ...DEFAULT_TAGS,
    {
      name: TAG_NAMES.operationName,
      values: [REGISTER_OPERATION],
    },
    {
      name: TAG_NAMES.scriptTransaction,
      values: [txid],
    },
  ];
  const queryResult = await client.query({
    query: QUERY_REGISTERED_OPERATORS,
    variables: { tags, first: 1, addresses: [addr], recipients: [owner] },
  });
  if (queryResult.data.transactions.edges.length > 0) {
    const paymentTx = queryResult.data.transactions.edges[0];
    const correctFee = fee === parseInt(paymentTx.node.quantity.ar, 10);
    const correctTarget = paymentTx.node.recipient === owner;

    return correctFee && correctTarget;
  }
  return false;
};

const vote = async (txid: string, voteForTag: string, up: boolean) => {
  try {
    const tx = await arweave.createTransaction({ data: up ? UP_VOTE : DOWN_VOTE });
    tx.addTag(TAG_NAMES.appName, APP_NAME);
    tx.addTag(TAG_NAMES.appVersion, APP_VERSION);
    tx.addTag(TAG_NAMES.operationName, up ? UP_VOTE : DOWN_VOTE);
    tx.addTag(TAG_NAMES.voteFor, voteForTag);
    tx.addTag(TAG_NAMES.votedTransaction, txid);
    tx.addTag(TAG_NAMES.unixTime, (Date.now() / secondInMS).toString());
    const result = await window.arweaveWallet.dispatch(tx);
    enqueueSnackbar(
      <>
        Updated Model Fee
        <br></br>
        <a href={`https://viewblock.io/arweave/tx/${result.id}`} target={'_blank'} rel='noreferrer'>
          <u>View Transaction in Explorer</u>
        </a>
      </>,
      {
        variant: 'success',
      },
    );
  } catch (e) {
    enqueueSnackbar('Could not Start Conversation', { variant: 'error' });
  }
};

const UpVote = ({
  upVotesCount,
  disabled,
  clickHandler,
}: {
  upVotesCount: number;
  disabled: boolean;
  clickHandler: () => Promise<void>;
}) => {
  return (
    <>
      <Typography>{upVotesCount}</Typography>
      <IconButton disabled={disabled} color='primary' onClick={clickHandler}>
        <ThumbUpOffAltIcon />
      </IconButton>
    </>
  );
};

const DownVote = ({
  downVotesCount,
  disabled,
  clickHandler,
}: {
  downVotesCount: number;
  disabled: boolean;
  clickHandler: () => Promise<void>;
}) => {
  return (
    <>
      <Typography>{downVotesCount}</Typography>
      <IconButton disabled={disabled} color='primary' onClick={clickHandler}>
        <ThumbDownOffAltIcon />
      </IconButton>
    </>
  );
};

const Loading = () => (
  <Box display={'flex'} alignItems={'center'} justifyContent={'flex-end'} paddingRight={'16px'}>
    <CircularProgress />
  </Box>
);

const ShowError = () => (
  <Box display={'flex'} alignItems={'center'} justifyContent={'flex-end'} paddingRight={'16px'}>
    <Typography>Could Not Fetch Voting Data</Typography>
  </Box>
);

const Vote = ({
  txid,
  fee,
  owner,
  voteFor,
}: {
  txid: string;
  fee: number;
  owner: string;
  voteFor: voteForOptions;
}) => {
  const [hasVoted, setHasVoted] = useState(false);
  const [canVote, setCanVote] = useState(false);
  const { currentAddress, isWalletVouched } = useContext(WalletContext);
  const [upVotesCount, setUpVotesCount] = useState(0);
  const [downVotesCount, setDownVotesCount] = useState(0);

  const voteForTag = useMemo(() => {
    switch (voteFor) {
      case 'script':
        return VOTE_FOR_SCRIPT;
      case 'operator':
        return VOTE_FOR_OPERATOR;
      case 'model':
      default:
        return VOTE_FOR_MODEL;
    }
  }, [voteFor]);

  const { data, loading, error } = useQuery(QUERY_USER_HAS_VOTED, {
    variables: {
      first: 1,
      address: currentAddress,
      tags: [
        ...DEFAULT_TAGS,
        { name: TAG_NAMES.operationName, values: [UP_VOTE, DOWN_VOTE] },
        { name: TAG_NAMES.votedTransaction, values: [txid] },
        { name: TAG_NAMES.voteFor, values: [voteForTag] },
      ],
    },
    skip: !currentAddress || !txid,
  });

  const {
    data: upVotesData,
    loading: upVotesLoading,
    error: upVotesError,
    fetchMore: upVotesFetchMore,
  } = useQuery(QUERY_VOTES, {
    variables: {
      first: 10,
      tags: [
        ...DEFAULT_TAGS,
        { name: TAG_NAMES.operationName, values: [UP_VOTE] },
        { name: TAG_NAMES.votedTransaction, values: [txid] },
        { name: TAG_NAMES.voteFor, values: [voteForTag] },
      ],
    },
    skip: !txid,
  });

  const {
    data: downVotesData,
    loading: downVotesLoading,
    error: downVotesError,
    fetchMore: downVotesFetchMore,
  } = useQuery(QUERY_VOTES, {
    variables: {
      first: 10,
      tags: [
        ...DEFAULT_TAGS,
        { name: TAG_NAMES.operationName, values: [DOWN_VOTE] },
        { name: TAG_NAMES.votedTransaction, values: [txid] },
        { name: TAG_NAMES.voteFor, values: [voteForTag] },
      ],
    },
    skip: !txid,
  });

  const isLoading = useMemo(
    () => [loading, upVotesLoading, downVotesLoading].some(Boolean),
    [loading, upVotesLoading, downVotesLoading],
  );
  const hasError = useMemo(
    () => [error, upVotesError, downVotesError].some(Boolean),
    [error, upVotesError, downVotesError],
  );
  const disabled = useMemo(
    () => !currentAddress || !isWalletVouched || hasVoted || !canVote,
    [currentAddress, isWalletVouched, hasVoted, canVote],
  );

  useEffect(() => {
    if (upVotesData && upVotesData.transactions.pageInfo.hasNextPage) {
      const txs = upVotesData.transactions.edges;
      upVotesFetchMore({
        variables: {
          after: txs.length > 0 ? txs[txs.length - 1].cursor : undefined,
        },
        updateQuery: commonUpdateQuery,
      });
    } else if (upVotesData) {
      const upVotes: IEdge[] = upVotesData.transactions.edges;
      (async () => setUpVotesCount(await countVouchedVotes(txid, fee, owner, upVotes, voteFor)))();
    } else {
      // do nothing
    }
  }, [upVotesData]);

  useEffect(() => {
    if (downVotesData && downVotesData.transactions.pageInfo.hasNextPage) {
      const txs = downVotesData.transactions.edges;
      downVotesFetchMore({
        variables: {
          after: txs.length > 0 ? txs[txs.length - 1].cursor : undefined,
        },
        updateQuery: commonUpdateQuery,
      });
    } else if (downVotesData) {
      const downVotes: IEdge[] = downVotesData.transactions.edges;
      (async () =>
        setDownVotesCount(await countVouchedVotes(txid, fee, owner, downVotes, voteFor)))();
    } else {
      // do nothing
    }
  }, [downVotesData]);

  useEffect(() => {
    if (data && data.transactions.edges.length > 0) {
      setHasVoted(true);
    } else {
      (async () => {
        setCanVote(await checkPaidFee());
      })();
    }
  }, [data]);

  const checkPaidFee = useCallback(async () => {
    let paidFee = false;
    switch (voteFor) {
      case 'model':
        paidFee = await checkCuratorPaidFee(txid, fee, owner, currentAddress);
        break;
      case 'script':
        paidFee = await checkOperatorPaidFee(txid, fee, owner, currentAddress);
        break;
      case 'operator':
        paidFee = await checkUserPaidFee(txid, fee, owner, currentAddress);
        break;
      default: // do nothing;
    }

    return paidFee;
  }, []);

  const upVote = useCallback(() => vote(txid, voteForTag, true), [vote]);
  const downVote = useCallback(() => vote(txid, voteForTag, false), [vote]);

  if (isLoading) {
    return <Loading />;
  }

  if (hasError) {
    return <ShowError />;
  }

  return (
    <Box
      display={'flex'}
      alignItems={'center'}
      justifyContent={voteFor === 'operator' ? 'flex-start' : 'flex-end'}
      paddingRight={'16px'}
    >
      <UpVote upVotesCount={upVotesCount} disabled={disabled} clickHandler={upVote} />
      <DownVote downVotesCount={downVotesCount} disabled={disabled} clickHandler={downVote} />
    </Box>
  );
};

export default Vote;
