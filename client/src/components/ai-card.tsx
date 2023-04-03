import { Box, Icon, Tooltip, Typography } from '@mui/material';
import { FiCard, FiCardActionArea, FiCardContent, FicardMedia } from './full-image-card';
import { IEdge } from '@/interfaces/arweave';
import { toSvg } from 'jdenticon';
import { useNavigate } from 'react-router-dom';
import { MouseEvent, useContext, useEffect, useMemo } from 'react';
import { findTag } from '@/utils/common';
import { useLazyQuery } from '@apollo/client';
import { WalletContext } from '@/context/wallet';
import { GET_LATEST_MODEL_ATTACHMENTS } from '@/queries/graphql';
import {
  AVATAR_ATTACHMENT,
  DEFAULT_TAGS,
  MODEL_ATTACHMENT,
  TAG_NAMES,
  NET_ARWEAVE_URL,
} from '@/constants';

const AiCard = ({ model, loading }: { model: IEdge; loading: boolean }) => {
  const navigate = useNavigate();
  const { currentAddress } = useContext(WalletContext);

  const [getAvatar, { data, loading: avatarLoading }] = useLazyQuery(GET_LATEST_MODEL_ATTACHMENTS);

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
        owner: currentAddress,
      },
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
    <FiCard
      sx={{
        flexGrow: 0,
      }}
    >
      <FiCardActionArea onClick={handleCardClick}>
        {!imgUrl || loading || avatarLoading ? (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '317px',
              height: '352px',
              background: 'linear-gradient(to top, #000000 0%, rgba(71, 71, 71, 0) 100%)',
              // backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'cover' /* <------ */,
              backgroundPosition: 'center center',
            }}
          />
        ) : (
          <FicardMedia
            src={imgUrl && !loading && !avatarLoading ? imgUrl : ''}
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '317px',
              height: '352px',
              background: `linear-gradient(to top, #000000 0%, rgba(71, 71, 71, 0) 100%), url(${
                imgUrl && !loading && !avatarLoading ? imgUrl : ''
              })`,
              // backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'cover' /* <------ */,
              backgroundPosition: 'center center',
            }}
          />
        )}

        <FiCardContent>
          <Tooltip title={findTag(model, 'modelName') || 'Untitled'} placement={'top-start'}>
            <Typography
              sx={{
                fontStyle: 'normal',
                fontWeight: '700',
                fontSize: '24px',
                lineHeight: '32px',
                color: '#FFFFFF',
                maxWidth: '200px',
              }}
              noWrap
            >
              {findTag(model, 'modelName') || 'Untitled'}
            </Typography>
          </Tooltip>
          <Tooltip title={model.node.owner.address} placement={'bottom-start'}>
            <Typography
              sx={{
                color: '#B5B5B5',
                fontStyle: 'normal',
                fontWeight: '400',
                fontSize: '12px',
                lineHeight: '16px',
              }}
            >
              {model.node.owner.address.slice(0, 5)}...{model.node.owner.address.slice(-8)}
            </Typography>
          </Tooltip>

          <Typography
            sx={{
              color: '#696969',
              fontStyle: 'normal',
              fontWeight: '400',
              fontSize: '12px',
              lineHeight: '16px',
            }}
          >
            {getTimePassed()}
          </Typography>
          <Icon
            sx={{
              position: 'relative',
              bottom: '48px',
              left: '265px',
            }}
          >
            <img src='/thumbs-up.svg' />
          </Icon>
        </FiCardContent>
      </FiCardActionArea>
    </FiCard>
  );
};

export default AiCard;
