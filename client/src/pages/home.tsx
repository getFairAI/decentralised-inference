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
  Box,
  Button,
  Container,
  MenuItem,
  Select,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { useRef, useState } from 'react';
import Featured from '@/components/featured';
import '@/styles/ui.css';
import AiListCard from '@/components/ai-list-card';
import { Outlet } from 'react-router-dom';
import useModels from '@/hooks/useModels';

export default function Home() {
  const [hightlightTop, setHighLightTop] = useState(false);
  const target = useRef<HTMLDivElement>(null);
  const theme = useTheme();

  const { txs, featuredTxs } = useModels(target);
  const handleHighlight = (value: boolean) => setHighLightTop(value);

  return (
    <>
      <Container
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-around',
          alignContent: 'space-around',
          '@media all': {
            maxWidth: '100%',
          },
        }}
      >
        <Featured data={featuredTxs} />
        <Box className={'filter-box'} sx={{ display: 'flex' }}>
          <Box display={'flex'} flexDirection={'column'}>
            <Box display='flex' gap={'50px'} width={'100%'}>
              <Typography
                sx={{
                  fontStyle: 'normal',
                  fontWeight: 500,
                  fontSize: '30px',
                  fontHeight: '41px',
                  opacity: !hightlightTop ? 1 : 0.5,
                }}
                onClick={() => handleHighlight(false)}
              >
                Trending
              </Typography>
              <Typography
                sx={{
                  fontStyle: 'normal',
                  fontWeight: 500,
                  fontSize: '30px',
                  fontHeight: '41px',
                  opacity: hightlightTop ? 1 : 0.5,
                }}
                onClick={() => handleHighlight(true)}
              >
                Top
              </Typography>
              <Box flexGrow={1} />
            </Box>
            <Box display={'flex'} position='relative'>
              <Box
                height={'6px'}
                position='absolute'
                sx={{
                  width: hightlightTop ? '55px' : '119px',
                  left: hightlightTop ? '166px' : 0,
                  background: theme.palette.primary.main,
                  borderRadius: '8px',
                }}
              />
            </Box>
          </Box>
          <Box flexGrow={1} />
          <Box display='flex' gap={'50px'}>
            <Select
              sx={{
                border: '2px solid transparent',
                textTransform: 'none',
                background: `linear-gradient(${theme.palette.background.default}, ${theme.palette.background.default}) padding-box,linear-gradient(170.66deg, ${theme.palette.primary.main} -38.15%, ${theme.palette.primary.main} 30.33%, rgba(84, 81, 228, 0) 93.33%) border-box`,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderWidth: '0 !important', // force borderWidth 0 on focus
                },
                '& .MuiSelect-select': {
                  padding: '0px 15px',
                },
                '& .MuiSelect-icon': {
                  color: theme.palette.primary.main,
                },
              }}
              value={'24h'}
            >
              <MenuItem value={'24h'}>
                <Typography
                  sx={{
                    fontStyle: 'normal',
                    fontWeight: 600,
                    fontSize: '20px',
                    lineHeight: '27px',
                    textAlign: 'center',
                    color: theme.palette.primary.main,
                  }}
                >
                  24H
                </Typography>
              </MenuItem>
              <MenuItem value={'week'}>
                <Typography>1 Week</Typography>
              </MenuItem>
            </Select>
            <Button
              sx={{
                border: '2px solid transparent',
                padding: '5px 15px',
                textTransform: 'none',
                background: `linear-gradient(${theme.palette.background.default}, ${theme.palette.background.default}) padding-box,linear-gradient(170.66deg, ${theme.palette.primary.main} -38.15%, ${theme.palette.primary.main} 30.33%, rgba(84, 81, 228, 0) 93.33%) border-box`,
              }}
            >
              <Typography
                sx={{
                  fontStyle: 'normal',
                  fontWeight: 600,
                  fontSize: '20px',
                  lineHeight: '27px',
                  textAlign: 'center',
                }}
              >
                View All
              </Typography>
            </Button>
          </Box>
        </Box>
        <Stack spacing={4}>
          {txs.map((el, idx) => (
            <AiListCard model={el} key={el.node.id} index={idx} />
          ))}
          <Box ref={target} sx={{ paddingBottom: '16px' }}></Box>
        </Stack>
      </Container>
      <Outlet />
    </>
  );
}
