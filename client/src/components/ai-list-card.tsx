import {
  AVATAR_ATTACHMENT,
  DEFAULT_TAGS,
  MODEL_ATTACHMENT,
  NET_ARWEAVE_URL,
  TAG_NAMES,
} from '@/constants';
import { IEdge } from '@/interfaces/arweave';
import { GET_LATEST_MODEL_ATTACHMENTS } from '@/queries/graphql';
import { findTag } from '@/utils/common';
import { ApolloError, useLazyQuery } from '@apollo/client';
import {
  Card,
  CardActionArea,
  CardHeader,
  CardMedia,
  CardContent,
  Typography,
  Box,
  useTheme,
} from '@mui/material';
import { toSvg } from 'jdenticon';
import { MouseEvent, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const AiListCard = ({
  model,
  index,
  loading,
}: {
  model: IEdge;
  index: number;
  loading: boolean;
  error?: ApolloError;
}) => {
  const navigate = useNavigate();
  const [getAvatar, { data, loading: avatarLoading }] = useLazyQuery(GET_LATEST_MODEL_ATTACHMENTS);
  const theme = useTheme();

  useEffect(() => {
    const modelId = findTag(model, 'modelTransaction');
    const attachmentAvatarTags = [
      ...DEFAULT_TAGS,
      { name: TAG_NAMES.operationName, values: [MODEL_ATTACHMENT] },
      { name: TAG_NAMES.attachmentRole, values: [AVATAR_ATTACHMENT] },
      { name: TAG_NAMES.modelTransaction, values: [modelId] },
    ];

    getAvatar({
      variables: {
        tags: attachmentAvatarTags,
        owner: model.node.owner.address,
      },
      fetchPolicy: 'no-cache',
    });
  }, []);

  const imgUrl = useMemo(() => {
    if (data) {
      const avatarTxId =
        data.transactions.edges && data.transactions.edges[0]
          ? data.transactions.edges[0].node.id
          : undefined;
      if (avatarTxId) {
        return `${NET_ARWEAVE_URL}/${avatarTxId}`;
      }
      const modelId = findTag(model, 'modelTransaction');
      const img = toSvg(modelId, 100);
      const svg = new Blob([img], { type: 'image/svg+xml' });
      return URL.createObjectURL(svg);
    } else {
      return '';
    }
  }, [data]);

  const getTimePassed = () => {
    const timestamp = findTag(model, 'unixTime') || model.node.block?.timestamp;
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

  const handleCardClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const modelId = findTag(model, 'modelTransaction');
    if (!modelId) return;
    navigate(`/model/${encodeURIComponent(modelId)}/detail`, { state: model });
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
            }}
          />
        ) : (
          <CardMedia
            src={loading || avatarLoading ? '' : imgUrl}
            sx={{
              borderRadius: '16px',
              height: '100px',
              width: '100px',
              background: `linear-gradient(180deg, rgba(71, 71, 71, 0) 0%, rgba(1, 1, 1, 0) 188.85%)
              , url(${loading || avatarLoading ? '' : imgUrl})`,
              backgroundPosition: 'center',
              backgroundSize: 'contain',
            }}
          />
        )}

        <CardContent>
          <Typography variant='h3'>{findTag(model, 'modelName') || 'Untitled'}</Typography>
        </CardContent>
        <Box flexGrow={1}></Box>
        <CardContent
          sx={{
            display: 'flex',
            gap: '30px',
          }}
        >
          <Box display={'flex'} flexDirection='column'>
            <Typography variant='h3'>Usage</Typography>
            <Typography variant='h4'>11k</Typography>
          </Box>
          <Box display={'flex'} flexDirection='column'>
            <Typography variant='h3'>Rating</Typography>
            <Typography variant='h4'>12 Stamps</Typography>
          </Box>
          <Box display={'flex'} flexDirection='column'>
            <Typography variant='h3'>Last updated</Typography>
            <Typography variant='h4'>{getTimePassed()}</Typography>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default AiListCard;
