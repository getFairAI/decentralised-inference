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

import { MODEL_ATTACHMENT, AVATAR_ATTACHMENT } from '@/constants';
import { OperatorData } from '@/interfaces/common';
import { findTag } from '@/utils/common';
import { useQuery } from '@apollo/client';
import { findByTagsQuery, findByTagsAndOwnersDocument } from '@fairai/evm-sdk';
import {
  Card,
  CardActionArea,
  Box,
  CardHeader,
  Typography,
  CardContent,
  Tooltip,
  useTheme,
  CircularProgress,
} from '@mui/material';
import { useState, useEffect, useCallback, useRef, useContext, WheelEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ComputerIcon from '@mui/icons-material/Computer';
import { EVMWalletContext } from '@/context/evm-wallet';
import useScroll from '@/hooks/useScroll';
import useWindowDimensions from '@/hooks/useWindowDimensions';

const Solution = ({
  tx,
  operatorsData,
  loading
}: {
  tx: findByTagsQuery['transactions']['edges'][0];
  loading: boolean;
  operatorsData: OperatorData[];
  onSignIn?: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
}) => {
  const [hasOperators, setHasOperators] = useState(false);
  const [avgFee, setAvgFee] = useState(0);
  const [numOperators, setNumOperators] = useState(0);
  const [imgUrl, setImgUrl] = useState('');
  const [isHovering, setIsHovering] = useState(false);
  const mainCardRef = useRef<HTMLDivElement>(null);
  const [topOffset, setTopOffset] = useState(0);
  const { currentAddress, usdcBalance } = useContext(EVMWalletContext);
  const scrollableRef = useRef(document.getElementById('main'));
  const { scrollTop } = useScroll(scrollableRef);
  const { width } = useWindowDimensions();
  const [ isMobile, setIsMobile ] = useState(false);

  const navigate = useNavigate();
  const theme = useTheme();

  const { data: imageData } = useQuery(findByTagsAndOwnersDocument, {
    variables: {
      tags: [
        { name: 'Operation-Name', values: [MODEL_ATTACHMENT] },
        { name: 'Attachment-Role', values: [AVATAR_ATTACHMENT] },
        { name: 'Solution-Transaction', values: [tx.node.id] },
      ],
      owners: [tx.node.owner.address],
      first: 1,
    },
    skip: !tx.node.id || !tx.node.owner.address,
  });

  useEffect(() => {
    const sm = theme.breakpoints.values.sm;
    setIsMobile(width < sm);
  }, [ width, theme, setIsMobile ]);

  useEffect(() => {
    if (mainCardRef.current) {
      setTopOffset(mainCardRef.current.offsetTop - scrollTop);
    }
  }, [currentAddress, usdcBalance, scrollTop ]);

  useEffect(() => {
    if (imageData) {
      const avatarTxId = imageData.transactions.edges[0]?.node.id;
      if (avatarTxId) {
        setImgUrl(`https://arweave.net/${avatarTxId}`);
      }
    }
  }, [imageData]);

  useEffect(() => {
    setHasOperators(operatorsData.length > 0);
    setNumOperators(operatorsData.length);
    if (operatorsData.length > 0) {
      setAvgFee(operatorsData.reduce((acc, el) => acc + el.operatorFee, 0) / operatorsData.length);
    } else {
      // ignore
    }
  }, [operatorsData]);

  const handleSolutionClick = useCallback(() => {
    if (isMobile) {
      // if mobile click is used to turn card
      setIsHovering((hovering) => !hovering);
    } else if (!currentAddress) {
      navigate('/sign-in', {
        state: {
          defaultOperator: operatorsData[0] ?? undefined,
          availableOperators: operatorsData ?? [],
          solution: tx,
        },
      });
    } else {
      navigate('/chat', {
        state: {
          defaultOperator: operatorsData[0] ?? undefined,
          availableOperators: operatorsData ?? [],
          solution: tx,
        },
      });
    }
  }, [tx, operatorsData, currentAddress, isMobile ]);

  const getTimePassed = () => {
    const timestamp = findTag(tx, 'unixTime');
    if (!timestamp) return 'Pending';
    const currentTimestamp = Date.now();

    const secondInMS = 1000;
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

  const handleHoverStart = useCallback(() => setIsHovering(true), [setIsHovering]);
  const handleHoverEnd = useCallback(() => setIsHovering(false), [setIsHovering]);
  const handleWheel = useCallback((event: WheelEvent<HTMLDivElement>) => {
    event.stopPropagation();

    if (scrollableRef.current) {
      scrollableRef.current.scrollBy({
        top: event.deltaY,
        behavior: 'instant'
      });
    }
  }, [ scrollableRef ]);

  return (
    <motion.div initial={false} onHoverStart={handleHoverStart} onHoverEnd={handleHoverEnd} onWheel={handleWheel}>
      <motion.div
        ref={mainCardRef}
        animate={{ rotateY: isHovering ? -180 : 0 }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 40,
        }}
        style={{
          width: '317px',
          height: '352px',
          backfaceVisibility: 'hidden',
        }}
      >
        <Card
          sx={{
            width: '100%',
            height: '100%',
          }}
          raised={true}
        >
          <CardActionArea
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              alignItems: 'flex-start',
              padding: '8px',
              background: `linear-gradient(180deg, rgba(71, 71, 71, 0) 40%, ${theme.palette.background.default} 100%), url(${imgUrl})`,
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'cover' /* <------ */,
              backgroundPosition: 'center center',
            }}
            onClick={handleSolutionClick}
          >
            <Box display={'flex'} flexGrow={1} flexDirection={'column'}></Box>
            <CardHeader
              sx={{
                pb: 0,
              }}
              title={
                <Typography variant='h2'>
                  {tx.node.tags.find((el) => el.name === 'Solution-Name')?.value ??
                    'Name Not Available'}
                </Typography>
              }
              subheader={`${tx.node.owner.address.slice(0, 6)}...${tx.node.owner.address.slice(
                -4,
              )} - ${getTimePassed()}`}
            />
          </CardActionArea>
        </Card>
      </motion.div>
      <motion.div
        initial={{ rotateY: 180 }}
        animate={{ rotateY: isHovering ? 0 : 180 }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 40,
        }}
        style={{
          width: '317px',
          height: '352px',
          backfaceVisibility: 'hidden',
          position: 'absolute',
          top: `${topOffset}px`,
        }}
      >
        <Card
          sx={{
            width: '100%',
            height: '100%',
          }}
          raised={true}
        >
          <CardActionArea
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              alignItems: 'flex-start',
              padding: '8px',
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'cover' /* <------ */,
              backgroundPosition: 'center center',
            }}
            onClick={handleSolutionClick}
          >
            <Box display={'flex'} flexGrow={1} flexDirection={'column'}></Box>
            <CardContent>
              <Typography>{tx.node.tags.find((el) => el.name === 'Description')?.value}</Typography>
            </CardContent>

            {!loading && <CardContent
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                width: '100%',
                gap: '16px',
                pt: 0,
              }}
            >
              {hasOperators && (
                <Tooltip title='Average Fee'>
                  <Box display={'flex'} gap={'4px'} alignItems={'center'}>
                    <Typography>{avgFee}</Typography>
                    <Box display={'flex'} alignItems={'center'} gap={'8px'}>
                      <img width='20px' height='20px' src='./usdc-logo.svg' />
                    </Box>
                  </Box>
                </Tooltip>
              )}
              <Tooltip title='Available Providers'>
                <Box display={'flex'} gap={'4px'} alignItems={'center'}>
                  <Typography>{numOperators}</Typography>
                  <ComputerIcon />
                </Box>
              </Tooltip>
            </CardContent>}
            {loading && <CardContent sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
              <Tooltip title='Loading Available Operators'>
                <CircularProgress />
              </Tooltip>
            </CardContent>}
          </CardActionArea>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default Solution;
