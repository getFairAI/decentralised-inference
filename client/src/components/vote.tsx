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
} from '@/constants';
import { WalletContext } from '@/context/wallet';
import { IEdge } from '@/interfaces/arweave';
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
import { useContext, useEffect, useState } from 'react';
import { isVouched } from 'vouchdao';
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt';
import ThumbDownOffAltIcon from '@mui/icons-material/ThumbDownOffAlt';
import { client } from '@/utils/apollo';
import { commonUpdateQuery } from '@/utils/common';

type voteForOptions = 'model' | 'script' | 'operator';

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
  const [upVotesCount, setUpVotesCount] = useState(0);
  const [downVotesCount, setDownVotesCount] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [canVote, setCanVote] = useState(false);
  const { currentAddress, isWalletVouched } = useContext(WalletContext);
  const voteForTag =
    voteFor === 'model'
      ? VOTE_FOR_MODEL
      : voteFor === 'script'
      ? VOTE_FOR_SCRIPT
      : VOTE_FOR_OPERATOR;

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

  useEffect(() => {
    if (data && data.transactions.edges.length > 0) {
      setHasVoted(true);
    } else {
      const asyncWrapper = async () => {
        if (voteFor === 'model') {
          setCanVote(await checkCuratorPaidFee());
        } else if (voteFor === 'script') {
          setCanVote(await checkOperatorPaidFee());
        } else if (voteFor === 'operator') {
          setCanVote(await checkUserPaidFee());
        } else {
          setCanVote(false);
        }
      };
      asyncWrapper();
    }
  }, [data]);

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
      countVouchedVotes(true);
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
      countVouchedVotes(false);
    }
  }, [downVotesData]);

  const checkCuratorPaidFee = async (addr?: string) => {
    const tags = [
      ...DEFAULT_TAGS,
      {
        name: TAG_NAMES.modelTransaction,
        values: [txid],
      },
    ];
    const queryResult = await client.query({
      query: QUERY_REGISTERED_SCRIPTS,
      variables: { tags, first: 1, addresses: [addr ? addr : currentAddress], recipients: [owner] },
    });
    if (queryResult.data.transactions.edges.length > 0) {
      const paymentTx = queryResult.data.transactions.edges[0];
      const correctFee = fee === parseInt(paymentTx.node.quantity.ar);
      const correctTarget = paymentTx.node.recipient === owner;

      return correctFee && correctTarget;
    }
    return false;
  };

  const checkUserPaidFee = async (addr?: string) => {
    const tags = [
      ...DEFAULT_TAGS,
      { name: TAG_NAMES.scriptTransaction, values: txid },
      { name: TAG_NAMES.operationName, values: SCRIPT_FEE_PAYMENT },
    ];
    const queryResult = await client.query({
      query: QUERY_FEE_PAYMENT,
      variables: { tags, first: 1, addresses: [addr ? addr : currentAddress], recipients: [owner] },
    });
    if (queryResult.data.transactions.edges.length > 0) {
      const paymentTx = queryResult.data.transactions.edges[0];
      const correctFee = fee === parseInt(paymentTx.node.quantity.ar);
      const correctTarget = paymentTx.node.recipient === owner;

      return correctFee && correctTarget;
    }
    return false;
  };

  const checkOperatorPaidFee = async (addr?: string) => {
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
      variables: { tags, first: 1, addresses: [addr ? addr : currentAddress], recipients: [owner] },
    });
    if (queryResult.data.transactions.edges.length > 0) {
      const paymentTx = queryResult.data.transactions.edges[0];
      const correctFee = fee === parseInt(paymentTx.node.quantity.ar);
      const correctTarget = paymentTx.node.recipient === owner;

      return correctFee && correctTarget;
    }
    return false;
  };

  const countVouchedVotes = async (up?: boolean) => {
    const filtered: IEdge[] = [];
    const votes = up ? upVotesData.transactions.edges : downVotesData.transactions.edges;
    await Promise.all(
      votes.map(async (el: IEdge) => {
        const vouched = await isVouched(el.node.owner.address);
        if (voteFor === 'model') {
          const paidFee = await checkCuratorPaidFee(el.node.owner.address);
          if (vouched && paidFee) {
            filtered.push(el);
          }
        } else if (voteFor === 'script') {
          const paidFee = await checkOperatorPaidFee(el.node.owner.address);
          if (vouched && paidFee) {
            filtered.push(el);
          }
        } else if (voteFor === 'operator') {
          const paidFee = await checkUserPaidFee(el.node.owner.address);
          if (vouched && paidFee) {
            filtered.push(el);
          }
        }
      }),
    );
    up ? setUpVotesCount(filtered.length) : setDownVotesCount(filtered.length);
  };

  const vote = async (up: boolean) => {
    try {
      const tx = await arweave.createTransaction({ data: up ? UP_VOTE : DOWN_VOTE });
      tx.addTag(TAG_NAMES.appName, APP_NAME);
      tx.addTag(TAG_NAMES.appVersion, APP_VERSION);
      tx.addTag(TAG_NAMES.operationName, up ? UP_VOTE : DOWN_VOTE);
      tx.addTag(TAG_NAMES.voteFor, voteForTag);
      tx.addTag(TAG_NAMES.votedTransaction, txid);
      tx.addTag(TAG_NAMES.unixTime, (Date.now() / 1000).toString());
      const result = await window.arweaveWallet.dispatch(tx);
      enqueueSnackbar(
        <>
          Updated Model Fee
          <br></br>
          <a
            href={`https://viewblock.io/arweave/tx/${result.id}`}
            target={'_blank'}
            rel='noreferrer'
          >
            <u>View Transaction in Explorer</u>
          </a>
        </>,
        {
          variant: 'success',
        },
      );
    } catch (error) {
      enqueueSnackbar('Could not Start Conversation', { variant: 'error' });
    }
  };

  if (loading || upVotesLoading || downVotesLoading)
    return (
      <Box display={'flex'} alignItems={'center'} justifyContent={'flex-end'} paddingRight={'16px'}>
        <CircularProgress />
      </Box>
    );

  if (error || upVotesError || downVotesError)
    return (
      <Box display={'flex'} alignItems={'center'} justifyContent={'flex-end'} paddingRight={'16px'}>
        <Typography>Could Not Fetch Voting Data</Typography>
      </Box>
    );

  return (
    <Box display={'flex'} alignItems={'center'} justifyContent={voteFor === 'operator' ? 'flex-start' : 'flex-end'} paddingRight={'16px'}>
      <Typography>{upVotesCount}</Typography>
      <IconButton
        disabled={!isWalletVouched || hasVoted || !canVote}
        color='primary'
        onClick={() => vote(true)}
      >
        <ThumbUpOffAltIcon />
      </IconButton>
      <Typography>{downVotesCount}</Typography>
      <IconButton
        disabled={!isWalletVouched || hasVoted || !canVote}
        color='primary'
        onClick={() => vote(false)}
      >
        <ThumbDownOffAltIcon />
      </IconButton>
    </Box>
  );
};

export default Vote;
