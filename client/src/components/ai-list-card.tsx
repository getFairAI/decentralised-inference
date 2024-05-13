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
  DEFAULT_TAGS,
  MODEL_ATTACHMENT,
  NET_ARWEAVE_URL,
  TAG_NAMES,
  secondInMS,
} from '@/constants';
import { IContractEdge } from '@/interfaces/arweave';
import { GET_LATEST_MODEL_ATTACHMENTS } from '@/queries/graphql';
import { findTag } from '@/utils/common';
import { useLazyQuery } from '@apollo/client';
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
import { MouseEvent, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Tooltip from '@mui/material/Tooltip';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const AiListCard = ({
  model,
  index,
  totalStamps,
  vouchedStamps,
}: {
  model: IContractEdge;
  index: number;
  totalStamps: number;
  vouchedStamps: number;
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
        owner,
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

  const owner = useMemo(
    () => findTag(model, 'sequencerOwner') ?? model.node.owner.address,
    [model],
  );
  const modelId = useMemo(() => findTag(model, 'modelTransaction'), [model]);
  const modelName = useMemo(() => findTag(model, 'modelName'), [model]);

  const getTimePassed = () => {
    const timestamp = findTag(model, 'unixTime') as string;
    if (!timestamp) return 'Pending';
    const currentTimestamp = Date.now();

    const dateA = parseInt(timestamp, 10) * secondInMS;
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

  const handleCardClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      if (!modelId) return;
      navigate(`/model/${encodeURIComponent(modelId)}/detail`, {
        state: {
          modelName: findTag(model, 'modelName'),
          modelCreator: owner,
          modelTransaction: modelId,
          fullState: model,
        },
      });
    },
    [modelId],
  );

  return (
    <Card
      sx={{
        background:
          'linear-gradient(177deg, rgba(118, 118, 118, 0.1) 2.17%, rgba(1, 1, 1, 0) 60%);',
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
        className={`plausible-event-name=List+Model+Click plausible-event-transaction=${modelId}+${modelName}`}
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
        {!imgUrl || avatarLoading ? (
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
            src={avatarLoading ? '' : imgUrl}
            sx={{
              borderRadius: '8px',
              height: '100px',
              width: '100px',
              background: `linear-gradient(180deg, rgba(71, 71, 71, 0) 0%, rgba(1, 1, 1, 0) 188.85%)
              , url(${avatarLoading ? '' : imgUrl})`,
              backgroundPosition: 'center',
              backgroundSize: 'cover',
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
          <Box display='flex' flexDirection='column' alignItems='center'>
            <Typography variant='h3'>Endorsments</Typography>
            <Box display='flex' alignItems='center'>
              <Typography variant='h4'>{totalStamps}</Typography>
              <Tooltip
                title={`Total: ${totalStamps}, Vouched: ${vouchedStamps}`}
                placement='top-end'
              >
                <InfoOutlinedIcon fontSize='small' style={{ marginLeft: '4px' }} />
              </Tooltip>
            </Box>
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
