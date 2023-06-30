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
  DEFAULT_TAGS_RETRO,
  MODEL_ATTACHMENT,
  NET_ARWEAVE_URL,
  OPERATOR_REGISTRATION_PAYMENT_TAGS,
  TAG_NAMES,
  secondInMS,
} from '@/constants';
import { IContractEdge, IEdge } from '@/interfaces/arweave';
import { FIND_BY_TAGS, GET_LATEST_MODEL_ATTACHMENTS } from '@/queries/graphql';
import { parseWinston } from '@/utils/arweave';
import { ApolloQueryResult, useLazyQuery, useQuery } from '@apollo/client';
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
import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReplayIcon from '@mui/icons-material/Replay';
import { commonUpdateQuery, findTag } from '@/utils/common';
import { toSvg } from 'jdenticon';
import { isValidRegistration } from '@/utils/operator';

const checkOpResponses = async (el: IEdge, filtered: IEdge[]) => {
  const opFee = findTag(el, 'operatorFee') as string;
  const scriptName = findTag(el, 'scriptName') as string;
  const scriptCurator = findTag(el, 'scriptCurator') as string;
  const registrationOwner = findTag(el, 'sequencerOwner') as string;

  if (
    !(await isValidRegistration(el.node.id, opFee, registrationOwner, scriptName, scriptCurator))
  ) {
    filtered.splice(
      filtered.findIndex((existing) => el.node.id === existing.node.id),
      1,
    );
  }
};

interface Element {
  name: string;
  txid: string;
  uploader: string;
  avgFee: string;
  totalOperators: number;
}

const ScriptError = ({
  handleRefetch,
}: {
  handleRefetch: () => Promise<ApolloQueryResult<unknown>>;
}) => {
  return (
    <Container>
      <Typography alignItems='center' display='flex' flexDirection='column'>
        Could not Fetch Registered Operators.
        <Button
          sx={{ width: 'fit-content' }}
          endIcon={<ReplayIcon />}
          onClick={handleRefetch as () => void}
        >
          Retry
        </Button>
      </Typography>
    </Container>
  );
};

const ScriptImage = ({
  imgUrl,
  loading,
  avatarLoading,
}: {
  imgUrl?: string;
  loading: boolean;
  avatarLoading: boolean;
}) => {
  const isLoading = useMemo(
    () => !imgUrl || loading || avatarLoading,
    [loading, avatarLoading, imgUrl],
  );

  if (isLoading) {
    return (
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '317px',
          height: '352px',
          background: 'linear-gradient(180deg, rgba(71, 71, 71, 0) 0%, rgba(1, 1, 1, 0) 188.85%)',
          // backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover' /* <------ */,
          backgroundPosition: 'center center',
        }}
      />
    );
  } else {
    return (
      <CardMedia
        src={imgUrl}
        sx={{
          borderRadius: '16px',
          height: '100px',
          width: '100px',
          background: `linear-gradient(180deg, rgba(71, 71, 71, 0) 0%, rgba(1, 1, 1, 0) 188.85%), url(${imgUrl})`,
          backgroundPosition: 'center',
          backgroundSize: 'contain',
        }}
      />
    );
  }
};

const parseScriptData = (
  data: IEdge[],
  scriptTx: IContractEdge,
  setCardData: Dispatch<SetStateAction<Element | undefined>>,
  owner?: string,
) => {
  const uniqueOperators: IEdge[] = [];
  const registrations: IEdge[] = data;

  // filter registratiosn for same model (only keep latest one per operator)
  registrations.forEach((op: IEdge) =>
    uniqueOperators.filter(
      (unique) => findTag(op, 'sequencerOwner') === findTag(unique, 'sequencerOwner'),
    ).length > 0
      ? undefined
      : uniqueOperators.push(op),
  );

  const opFees = uniqueOperators.map((op) => {
    const fee = findTag(op, 'operatorFee');
    if (fee) {
      return parseFloat(fee);
    } else {
      return 0;
    }
  });
  const average = (arr: number[]) => arr.reduce((p, c) => p + c, 0) / arr.length;
  let avgFee = parseWinston(average(opFees).toString());

  if (Number.isNaN(avgFee) || avgFee === 'NaN') {
    avgFee = 'Not enough Operators for Fee';
  }

  setCardData({
    avgFee,
    name: findTag(scriptTx, 'scriptName') ?? 'Name not Available',
    txid: findTag(scriptTx, 'scriptTransaction') ?? 'Transaction Not Available',
    uploader: owner ?? 'Uploader Not Available',
    totalOperators: uniqueOperators.length,
  });
};

const commonTextProps = {
  fontSize: '20px',
  lineHeight: '27px',
  display: 'flex',
  alignItems: 'center',
  textAlign: 'center',
  fontStyle: 'normal',
};
const headerTextProps = {
  fontWeight: 300,
  ...commonTextProps,
};

const ScriptCard = ({ scriptTx, index }: { scriptTx: IContractEdge; index: number }) => {
  const navigate = useNavigate();
  const [cardData, setCardData] = useState<Element>();
  const elementsPerPage = 5;
  const theme = useTheme();

  const owner = useMemo(() => findTag(scriptTx, 'sequencerOwner'), [scriptTx]);

  const tags = [
    ...DEFAULT_TAGS,
    {
      name: TAG_NAMES.scriptCurator,
      values: [owner],
    },
    {
      name: TAG_NAMES.scriptName,
      values: [findTag(scriptTx as IEdge, 'scriptName')],
    },
    {
      name: TAG_NAMES.scriptTransaction,
      values: [findTag(scriptTx as IEdge, 'scriptTransaction')],
    },
    ...OPERATOR_REGISTRATION_PAYMENT_TAGS,
  ];

  const { data, loading, error, refetch, fetchMore } = useQuery(FIND_BY_TAGS, {
    variables: { tags, first: elementsPerPage },
    skip: !scriptTx && !owner,
  });

  const [getAvatar, { data: avatarData, loading: avatarLoading }] = useLazyQuery(
    GET_LATEST_MODEL_ATTACHMENTS,
  );

  useEffect(() => {
    (async () => {
      let firstScriptVersionTx;
      try {
        firstScriptVersionTx = (
          JSON.parse(findTag(scriptTx, 'previousVersions') as string) as string[]
        )[0];
      } catch (err) {
        firstScriptVersionTx = findTag(scriptTx, 'scriptTransaction');
      }
      const attachmentAvatarTags = [
        ...DEFAULT_TAGS_RETRO, // filter from previous app versions as well
        { name: TAG_NAMES.operationName, values: [MODEL_ATTACHMENT] },
        { name: TAG_NAMES.attachmentRole, values: [AVATAR_ATTACHMENT] },
        { name: TAG_NAMES.scriptTransaction, values: [firstScriptVersionTx] },
      ];

      await getAvatar({
        variables: {
          tags: attachmentAvatarTags,
          owner,
        },
      });
    })();
  }, []);

  const imgUrl = useMemo(() => {
    const avatarTxId = avatarData?.transactions?.edges[0]?.node?.id;
    if (avatarTxId) {
      return `${NET_ARWEAVE_URL}/${avatarTxId}`;
    } else {
      const imgSize = 100;
      const scriptId = findTag(scriptTx, 'scriptTransaction');
      const img = toSvg(scriptId, imgSize);
      const svg = new Blob([img], { type: 'image/svg+xml' });
      return URL.createObjectURL(svg);
    }
  }, [avatarData]);

  useEffect(() => {
    if (data?.transactions?.pageInfo.hasNextPage) {
      (async () =>
        fetchMore({
          variables: {
            after: data.transactions.edges[data.transactions.edges.length - 1].cursor,
          },
          updateQuery: commonUpdateQuery,
        }))();
    } else if (data?.transactions) {
      (async () => {
        const filtered: IEdge[] = [];
        for (const el of data.transactions.edges) {
          filtered.push(el);
          await checkOpResponses(el, filtered);
        }
        parseScriptData(filtered, scriptTx, setCardData, owner);
      })();
    } else {
      // do nothing
    }
  }, [data]); // data changes

  const handleCardClick = useCallback(
    () =>
      navigate(`/operators/register/${encodeURIComponent(cardData?.txid ?? 'error')}`, {
        state: scriptTx,
      }),
    [scriptTx, cardData, navigate],
  );

  const getTimePassed = () => {
    const timestamp = findTag(scriptTx, 'unixTime');
    if (!timestamp) {
      return 'Pending';
    }
    const currentTimestamp = Date.now();

    const dateA = parseInt(timestamp, 10) * secondInMS;
    const dateB = currentTimestamp;

    const timeDiff = dateB - dateA;

    const secondsInMinute = 60; // same as minutes in hour
    const hoursInDay = 24;
    const daysInWeek = 7;
    const daysInMonth = 30; // round to 30 days, ignore odd months
    const daysInYear = 365; // rounded odd years
    // 1 day = 1000 * 60 * 60
    const day = secondInMS * secondsInMinute * secondsInMinute * hoursInDay;

    const nDaysDiff = Math.round(timeDiff / day);

    if (nDaysDiff <= 0) {
      return 'Today';
    } else if (nDaysDiff > 0 && nDaysDiff < daysInWeek) {
      return `${nDaysDiff} Day(s) ago`;
    } else if (nDaysDiff > daysInWeek && nDaysDiff <= daysInMonth) {
      const nWeeks = Math.round(nDaysDiff / daysInWeek);
      return `${nWeeks} Week(s) Ago`;
    } else if (nDaysDiff > daysInMonth && nDaysDiff <= daysInYear) {
      const nMonths = Math.round(nDaysDiff / daysInMonth);
      return `${nMonths} Month(s) Ago`;
    } else {
      const nYears = Math.round(nDaysDiff / daysInYear);
      return `${nYears} Year(s) ago`;
    }
  };

  const handleRefetch = useCallback(async () => refetch({ tags }), [tags, refetch]);

  if (error) {
    return <ScriptError handleRefetch={handleRefetch} />;
  }

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
            fontWeight: 600,
            ...commonTextProps,
          }}
        />
        <ScriptImage imgUrl={imgUrl} loading={loading} avatarLoading={avatarLoading} />
        <CardContent>
          <Typography
            sx={{
              fontWeight: 700,
              ...commonTextProps,
            }}
          >
            {findTag(scriptTx, 'scriptName') ?? 'Untitled'}
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
            <Typography sx={headerTextProps}>{cardData?.totalOperators}</Typography>
          </Box>
          <Box display={'flex'} flexDirection='column'>
            <Typography sx={headerTextProps}>{cardData?.avgFee}</Typography>
          </Box>
          <Box display={'flex'} flexDirection='column'>
            <Typography sx={headerTextProps}>11k</Typography>
          </Box>
          <Box display={'flex'} flexDirection='column'>
            <Typography sx={headerTextProps}>12 Stamps</Typography>
          </Box>
          <Box display={'flex'} flexDirection='column'>
            <Typography sx={headerTextProps}>{getTimePassed()}</Typography>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default ScriptCard;
