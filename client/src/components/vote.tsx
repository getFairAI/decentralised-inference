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
  VAULT_ADDRESS,
  REGISTER_OPERATION,
  SCRIPT_CREATION_PAYMENT,
  SCRIPT_FEE_PAYMENT,
  TAG_NAMES,
  UP_VOTE,
  VOTE_FOR_MODEL,
  VOTE_FOR_OPERATOR,
  VOTE_FOR_SCRIPT,
  secondInMS,
  U_CONTRACT_ID,
  SCRIPT_CREATION_PAYMENT_TAGS,
  INFERENCE_PAYMENT,
  OPERATOR_REGISTRATION_PAYMENT_TAGS,
  SCRIPT_INFERENCE_REQUEST,
} from '@/constants';
import { WalletContext } from '@/context/wallet';
import {
  FIND_BY_TAGS,
  QUERY_FEE_PAYMENT,
  QUERY_OPERATOR_REGISTRATION_PAYMENT,
  QUERY_REGISTERED_SCRIPTS,
  QUERY_TX_WITH,
  QUERY_USER_HAS_VOTED,
  QUERY_VOTES,
} from '@/queries/graphql';
import arweave from '@/utils/arweave';
import { ApolloQueryResult, useQuery } from '@apollo/client';
import { Box, CircularProgress, Tooltip, Typography } from '@mui/material';
import { enqueueSnackbar } from 'notistack';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt';
import ThumbDownOffAltIcon from '@mui/icons-material/ThumbDownOffAlt';
import { commonUpdateQuery, findTag } from '@/utils/common';
import { voteForOptions } from '@/interfaces/common';
import { IEdge, ITransactions } from '@/interfaces/arweave';
import { isVouched } from '@/utils/vouch';
import { client } from '@/utils/apollo';
import DebounceIconButton from './debounce-icon-button';
import Transaction from 'arweave/web/lib/transaction';
import { DispatchResult as ArConnectDispatchResult } from 'arconnect';
import { DispatchResult } from 'arweave-wallet-connector/lib/Arweave';

type RefetchFn = (
  variables?:
    | Partial<{
        first: number;
        tags: {
          name: string;
          values: string[];
        }[];
      }>
    | undefined,
) => Promise<ApolloQueryResult<{ transactions: ITransactions }>>;

const countVouchedVotes = async (tx: IEdge, voteTxs: IEdge[], voteFor: voteForOptions) => {
  const filtered: IEdge[] = [];
  await Promise.all(
    voteTxs.map(async (el: IEdge) => {
      const vouched = await isVouched(el.node.owner.address);
      let paidFee = false;
      switch (voteFor) {
        case 'model': {
          const txid = findTag(tx, 'modelTransaction') as string;
          paidFee = await checkCuratorPaidFee(txid, el.node.owner.address);
          break;
        }
        case 'script': {
          const txid = findTag(tx, 'scriptTransaction') as string;
          paidFee = await checkOperatorPaidFee(txid, el.node.owner.address);
          break;
        }
        case 'operator': {
          const scriptTxId = findTag(tx, 'scriptTransaction') as string;
          paidFee = await checkUserHasRequests(scriptTxId, el.node.owner.address);
          break;
        }
        default: // do nothing
      }
      if (vouched && paidFee) {
        filtered.push(el);
      }
    }),
  );

  return filtered.length;
};

const checkCuratorPaidFee = async (txid: string, addr: string) => {
  const tags = [
    /* ...DEFAULT_TAGS, */
    {
      name: TAG_NAMES.modelTransaction,
      values: [txid],
    },
    {
      name: TAG_NAMES.sequencerOwner,
      values: [addr],
    },
    ...SCRIPT_CREATION_PAYMENT_TAGS,
  ];
  const queryResult = await client.query({
    query: FIND_BY_TAGS,
    variables: { tags, first: 1 },
  });

  return queryResult.data.transactions.edges.length > 0;
};

const checkUserHasRequests = async (txid: string, addr: string) => {
  const tags = [
    /*  ...DEFAULT_TAGS, */
    { name: TAG_NAMES.scriptTransaction, values: txid },
    { name: TAG_NAMES.operationName, values: [SCRIPT_INFERENCE_REQUEST] },
  ];
  const queryResult = await client.query({
    query: QUERY_TX_WITH,
    variables: { tags, first: 1, owner: addr },
  });

  return queryResult.data.transactions.edges.length > 0;
};

const checkOperatorPaidFee = async (txid: string, addr: string) => {
  const tags = [
    /* ...DEFAULT_TAGS, */
    {
      name: TAG_NAMES.scriptTransaction,
      values: [txid],
    },
    {
      name: TAG_NAMES.sequencerOwner,
      values: [addr],
    },
    ...OPERATOR_REGISTRATION_PAYMENT_TAGS,
  ];

  const queryResult = await client.query({
    query: FIND_BY_TAGS,
    variables: { tags, first: 1 },
  });

  return queryResult.data.transactions.edges.length > 0;
};

const vote = async (
  txid: string,
  voteForTag: string,
  refetchFn: RefetchFn,
  up: boolean,
  dispatchTx: (tx: Transaction) => Promise<DispatchResult | ArConnectDispatchResult>,
) => {
  try {
    const tx = await arweave.createTransaction({ data: up ? UP_VOTE : DOWN_VOTE });
    tx.addTag(TAG_NAMES.appName, APP_NAME);
    tx.addTag(TAG_NAMES.appVersion, APP_VERSION);
    tx.addTag(TAG_NAMES.operationName, up ? UP_VOTE : DOWN_VOTE);
    tx.addTag(TAG_NAMES.voteFor, voteForTag);
    tx.addTag(TAG_NAMES.votedTransaction, txid);
    tx.addTag(TAG_NAMES.unixTime, (Date.now() / secondInMS).toString());
    const result = await dispatchTx(tx);
    enqueueSnackbar(
      <>
        Vote Transaction Sent
        <br></br>
        <a href={`https://viewblock.io/arweave/tx/${result.id}`} target={'_blank'} rel='noreferrer'>
          <u>View Transaction in Explorer</u>
        </a>
      </>,
      {
        variant: 'success',
      },
    );
    // refetch with same arguments as last tiem to get new vote count
    await refetchFn();
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
      <DebounceIconButton disabled={disabled} color='primary' onClick={clickHandler}>
        <ThumbUpOffAltIcon />
      </DebounceIconButton>
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
      <DebounceIconButton disabled={disabled} color='primary' onClick={clickHandler}>
        <ThumbDownOffAltIcon />
      </DebounceIconButton>
    </>
  );
};

const Loading = () => (
  <Box display={'flex'} alignItems={'center'} justifyContent={'center'} paddingRight={'16px'}>
    <CircularProgress />
  </Box>
);

const ShowError = () => (
  <Box display={'flex'} alignItems={'center'} justifyContent={'center'} paddingRight={'16px'}>
    <Typography>Could Not Fetch Voting Data</Typography>
  </Box>
);

const Vote = ({ tx, voteFor }: { tx: IEdge; voteFor: voteForOptions }) => {
  const [hasVoted, setHasVoted] = useState(false);
  const [canVote, setCanVote] = useState(false);
  const { currentAddress, isWalletVouched, dispatchTx } = useContext(WalletContext);
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

  const txid = useMemo(() => {
    if (voteFor === 'model') {
      return findTag(tx, 'modelTransaction') as string;
    } else {
      return findTag(tx, 'scriptTransaction') as string;
    }
  }, [tx]);

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
    refetch: upVotesRefetch,
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
    refetch: downVotesRefetch,
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

  const tooltipMessage = useMemo(() => {
    if (hasVoted) {
      return 'Wallet already voted';
    } else if (canVote) {
      return 'Vote for this transaction';
    } else {
      return 'Only vouched wallets who paid correct fees can vote';
    }
  }, [hasVoted, canVote]);

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
      (async () => setUpVotesCount(await countVouchedVotes(tx, upVotes, voteFor)))();
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
      (async () => setDownVotesCount(await countVouchedVotes(tx, downVotes, voteFor)))();
    } else {
      // do nothing
    }
  }, [downVotesData]);

  useEffect(() => {
    if (!currentAddress || !isWalletVouched || !data) {
      return;
    } else {
      if (data.transactions.edges.length > 0) {
        setHasVoted(true);
      } else {
        (async () => {
          setCanVote(await checkPaidFee());
        })();
      }
    }
  }, [data, isWalletVouched, currentAddress]);

  const checkPaidFee = async () => {
    let paidFee = false;
    switch (voteFor) {
      case 'model':
        paidFee = await checkCuratorPaidFee(txid, currentAddress);
        break;
      case 'script':
        paidFee = await checkOperatorPaidFee(txid, currentAddress);
        break;
      case 'operator': {
        paidFee = await checkUserHasRequests(txid, currentAddress);
        break;
      }
      default: // do nothing;
    }

    return paidFee;
  };

  const upVote = useCallback(async () => {
    await vote(txid, voteForTag, upVotesRefetch, true, dispatchTx);
    setHasVoted(true);
  }, [vote, txid, voteForTag, upVotesRefetch, setHasVoted]);
  const downVote = useCallback(async () => {
    await vote(txid, voteForTag, downVotesRefetch, false, dispatchTx);
    setHasVoted(true);
  }, [vote, txid, voteForTag, downVotesRefetch, setHasVoted]);

  if (isLoading) {
    return <Loading />;
  }

  if (hasError) {
    return <ShowError />;
  }

  return (
    <Box display={'flex'}>
      <Tooltip title={tooltipMessage}>
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: voteFor === 'operator' ? 'flex-start' : 'flex-end',
            paddingRight: '16px',
          }}
        >
          <UpVote upVotesCount={upVotesCount} disabled={disabled} clickHandler={upVote} />
          <DownVote downVotesCount={downVotesCount} disabled={disabled} clickHandler={downVote} />
        </span>
      </Tooltip>
    </Box>
  );
};

export default Vote;
