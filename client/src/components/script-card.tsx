import {
  AVATAR_ATTACHMENT,
  DEFAULT_TAGS,
  MODEL_ATTACHMENT,
  NET_ARWEAVE_URL,
  REGISTER_OPERATION,
  TAG_NAMES,
} from '@/constants';
import { IEdge } from '@/interfaces/arweave';
import { GET_LATEST_MODEL_ATTACHMENTS, QUERY_REGISTERED_OPERATORS } from '@/queries/graphql';
import { parseWinston } from '@/utils/arweave';
import { useLazyQuery, useQuery } from '@apollo/client';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardHeader,
  CardMedia,
  Container,
  Typography,
  useTheme,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReplayIcon from '@mui/icons-material/Replay';
import { findTag } from '@/utils/common';
import { toSvg } from 'jdenticon';

interface Element {
  name: string;
  txid: string;
  uploader: string;
  avgFee: string;
  scriptFee: string;
  totalOperators: number;
}

const ScriptCard = ({ scriptTx, index }: { scriptTx: IEdge; index: number }) => {
  const navigate = useNavigate();
  const [cardData, setCardData] = useState<Element>();
  const elementsPerPage = 5;
  const theme = useTheme();

  const tags = [
    ...DEFAULT_TAGS,
    { name: TAG_NAMES.operationName, values: [REGISTER_OPERATION] },
    {
      name: TAG_NAMES.scriptName,
      values: [findTag(scriptTx, 'scriptName')],
    },
    { name: TAG_NAMES.scriptCreator, values: [scriptTx.node.owner.address] },
  ];
  // get all operatorsRegistration for the model
  const { data, loading, error, refetch, fetchMore } = useQuery(QUERY_REGISTERED_OPERATORS, {
    variables: { tags, first: elementsPerPage },
    skip: !scriptTx,
  });

  const [getAvatar, { data: avatarData, loading: avatarLoading }] = useLazyQuery(
    GET_LATEST_MODEL_ATTACHMENTS,
  );

  useEffect(() => {
    const scriptId = findTag(scriptTx, 'scriptTransaction');
    const attachmentAvatarTags = [
      ...DEFAULT_TAGS,
      { name: TAG_NAMES.operationName, values: [MODEL_ATTACHMENT] },
      { name: TAG_NAMES.attachmentRole, values: [AVATAR_ATTACHMENT] },
      { name: TAG_NAMES.scriptTransaction, values: [scriptId] },
    ];

    getAvatar({
      variables: {
        tags: attachmentAvatarTags,
        owner: scriptTx.node.owner.address,
      },
    });
  }, []);

  const imgUrl = useMemo(() => {
    if (avatarData) {
      const avatarTxId =
        avatarData.transactions.edges && avatarData.transactions.edges[0]
          ? avatarData.transactions.edges[0].node.id
          : undefined;
      if (avatarTxId) {
        return `${NET_ARWEAVE_URL}/${avatarTxId}`;
      }
      const scriptId = findTag(scriptTx, 'scriptTransaction');
      const img = toSvg(scriptId, 100);
      const svg = new Blob([img], { type: 'image/svg+xml' });
      return URL.createObjectURL(svg);
    } else {
      return '';
    }
  }, [avatarData]);

  useEffect(() => {
    if (data && data.transactions && data.transactions.pageInfo.hasNextPage) {
      fetchMore({
        variables: {
          after: data.transactions.edges[data.transactions.edges.length - 1].cursor,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev;
          return Object.assign({}, prev, {
            transactions: {
              edges: [...prev.transactions.edges, ...fetchMoreResult.transactions.edges],
              pageInfo: fetchMoreResult.transactions.pageInfo,
            },
          });
        },
      });
    } else if (data && data.transactions) {
      const uniqueOperators: IEdge[] = [];
      const registrations: IEdge[] = data.transactions.edges;

      // filter registratiosn for same model (only keep latest one per operator)
      registrations.map((op: IEdge) =>
        uniqueOperators.filter((unique) => op.node.owner.address === unique.node.owner.address)
          .length > 0
          ? undefined
          : uniqueOperators.push(op),
      );

      const opFees = uniqueOperators.map((op) => {
        const fee = findTag(op, 'operatorFee');
        if (fee) return parseFloat(fee);
        else return 0;
      });
      const average = (arr: number[]) => arr.reduce((p, c) => p + c, 0) / arr.length;
      const avgFee = parseWinston(average(opFees).toString());
      const scriptFee = findTag(scriptTx, 'scriptFee');

      setCardData({
        name: findTag(scriptTx, 'scriptName') || 'Name not Available',
        txid: findTag(scriptTx, 'scriptTransaction') || 'Transaction Not Available',
        uploader: scriptTx.node.owner.address,
        scriptFee: parseWinston(scriptFee) || 'Script Fee Not Available',
        avgFee,
        totalOperators: uniqueOperators.length,
      });
    }
  }, [data]); // data changes

  const handleCardClick = () => {
    navigate(`/operators/register/${encodeURIComponent(cardData?.txid || 'error')}`, {
      state: scriptTx,
    });
  };

  const getTimePassed = () => {
    const timestamp = findTag(scriptTx, 'unixTime') || scriptTx.node.block?.timestamp;
    if (!timestamp) return 'Pending';
    const currentTimestamp = Date.now();

    const dateA = Number.isInteger(timestamp)
      ? (timestamp as number) * 1000
      : parseInt(timestamp as string) * 1000;
    const dateB = currentTimestamp;

    const timeDiff = dateB - dateA;

    // 1 day = 1000 * 60 * 60
    const day = 1000 * 60 * 60 * 24;
    const nDaysDiff = Math.round(timeDiff / day);

    if (nDaysDiff <= 0) {
      return 'Today';
    } else if (nDaysDiff > 7 && nDaysDiff <= 28) {
      const nWeeks = Math.round(nDaysDiff / 7);
      return `${nWeeks} Week(s) Ago`;
    } else if (nDaysDiff > 14 && nDaysDiff <= 28) {
      const nMonths = Math.round(nDaysDiff / 30);
      return `${nMonths} Month(s) Ago`;
    } else {
      return `${nDaysDiff} Day(s) ago`;
    }
  };

  return (
    <Card
      sx={{
        background:
          'linear-gradient(177deg, rgba(118, 118, 118, 0.1) 2.17%, rgba(1, 1, 1, 0) 60%);',
        borderRadius: '10px',
        boxShadow: 'none',
        '&:hover': {
          boxShadow: `0px 2px 24px -1px ${theme.palette.primary.main}, 0px 2px 1px 0px ${theme.palette.primary.main}, 0px 2px 7px 0px ${theme.palette.primary.main}`,
          opacity: 1,
        },
      }}
    >
      {error ? (
        <Container>
          <Typography alignItems='center' display='flex' flexDirection='column'>
            Could not Fetch Registered Operators.
            <Button
              sx={{ width: 'fit-content' }}
              endIcon={<ReplayIcon />}
              onClick={() => refetch({ tags })}
            >
              Retry
            </Button>
          </Typography>
        </Container>
      ) : (
        <CardActionArea
          sx={{
            width: '100%',
            height: '140px',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '30px',
          }}
          onClick={handleCardClick}
        >
          <CardHeader
            title={index + 1}
            sx={{
              fontFamily: 'Open Sans',
              fontStyle: 'normal',
              fontWeight: 600,
              fontSize: '20px',
              lineHeight: '27px',
              display: 'flex',
              alignItems: 'center',
              textAlign: 'center',
            }}
          />
          {/* <Typography>Name: {cardData?.name}</Typography>
          <Typography>Transaction id: {cardData?.txid}</Typography>
          <Typography>Creator: {cardData?.uploader}</Typography>
          {loading ? (
            <>
              <Typography>
                <Skeleton animation={'wave'} />
              </Typography>
              <Typography>
                <Skeleton animation={'wave'} />
              </Typography>
              <Typography>
                <Skeleton animation={'wave'} />
              </Typography>
            </>
          ) : (
            <>
              <Typography>
                Model Fee:{' '}
                {Number.isNaN(cardData?.scriptFee) || cardData?.scriptFee === 'NaN'
                  ? 'Invalid Fee'
                  : `${cardData?.scriptFee} AR`}
              </Typography>
              <Typography>
                Average Fee:{' '}
                {Number.isNaN(cardData?.avgFee) || cardData?.avgFee === 'NaN'
                  ? 'Not enough Operators for Fee'
                  : `${cardData?.avgFee} AR`}
              </Typography>
              <Typography>Total Operators: {cardData?.totalOperators}</Typography>
            </>
          )} */}
          {!imgUrl || loading || avatarLoading ? (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '317px',
                height: '352px',
                background:
                  'linear-gradient(180deg, rgba(71, 71, 71, 0) 0%, rgba(1, 1, 1, 0) 188.85%)',
                // backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'cover' /* <------ */,
                backgroundPosition: 'center center',
              }}
            />
          ) : (
            <CardMedia
              src={loading || avatarLoading ? '' : imgUrl}
              sx={{
                borderRadius: '16px',
                height: '100px',
                width: '100px',
                background: `linear-gradient(180deg, rgba(71, 71, 71, 0) 0%, rgba(1, 1, 1, 0) 188.85%), url(${
                  loading || avatarLoading ? '' : imgUrl
                })`,
                backgroundPosition: 'center',
                backgroundSize: 'contain',
              }}
            />
          )}
          <CardContent>
            <Typography
              sx={{
                fontStyle: 'normal',
                fontWeight: 700,
                fontSize: '20px',
                lineHeight: '27px',
                display: 'flex',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              {findTag(scriptTx, 'scriptName') || 'Untitled'}
            </Typography>
          </CardContent>
          <Box flexGrow={1}></Box>
          <CardContent
            sx={{
              display: 'flex',
              gap: '30px',
            }}
          >
            <Box display={'flex'} flexDirection='column'>
              <Typography
                sx={{
                  fontStyle: 'normal',
                  fontWeight: 300,
                  fontSize: '20px',
                  lineHeight: '27px',
                  display: 'flex',
                  alignItems: 'center',
                  textAlign: 'center',
                }}
              >
                {cardData?.totalOperators}
              </Typography>
            </Box>
            <Box display={'flex'} flexDirection='column'>
              <Typography
                sx={{
                  fontStyle: 'normal',
                  fontWeight: 300,
                  fontSize: '20px',
                  lineHeight: '27px',
                  display: 'flex',
                  alignItems: 'center',
                  textAlign: 'center',
                }}
              >
                {Number.isNaN(cardData?.scriptFee) || cardData?.scriptFee === 'NaN'
                  ? 'Invalid Fee'
                  : `${cardData?.scriptFee} AR`}
              </Typography>
            </Box>
            <Box display={'flex'} flexDirection='column'>
              <Typography
                sx={{
                  fontStyle: 'normal',
                  fontWeight: 300,
                  fontSize: '20px',
                  lineHeight: '27px',
                  display: 'flex',
                  alignItems: 'center',
                  textAlign: 'center',
                }}
              >
                {Number.isNaN(cardData?.avgFee) || cardData?.avgFee === 'NaN'
                  ? 'Not enough Operators for Fee'
                  : `${cardData?.avgFee} AR`}
              </Typography>
            </Box>
            <Box display={'flex'} flexDirection='column'>
              <Typography
                sx={{
                  fontStyle: 'normal',
                  fontWeight: 300,
                  fontSize: '20px',
                  lineHeight: '27px',
                  display: 'flex',
                  alignItems: 'center',
                  textAlign: 'center',
                }}
              >
                11k
              </Typography>
            </Box>
            <Box display={'flex'} flexDirection='column'>
              <Typography
                sx={{
                  fontStyle: 'normal',
                  fontWeight: 300,
                  fontSize: '20px',
                  lineHeight: '27px',
                  display: 'flex',
                  alignItems: 'center',
                  textAlign: 'center',
                }}
              >
                12 Stamps
              </Typography>
            </Box>
            <Box display={'flex'} flexDirection='column'>
              <Typography
                sx={{
                  fontStyle: 'normal',
                  fontWeight: 300,
                  fontSize: '20px',
                  lineHeight: '27px',
                  display: 'flex',
                  alignItems: 'center',
                  textAlign: 'center',
                }}
              >
                {getTimePassed()}
              </Typography>
            </Box>
          </CardContent>
        </CardActionArea>
      )}
    </Card>
  );
};

export default ScriptCard;
