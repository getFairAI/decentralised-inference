import AiCard from '@/components/ai-card';
import Featured from '@/components/featured';
import Logo from '@/components/logo';
import { DEFAULT_TAGS_RETRO, MODEL_CREATION_PAYMENT_TAGS } from '@/constants';
import { ChooseWalletContext } from '@/context/choose-wallet';
import { IEdge } from '@/interfaces/arweave';
import { FIND_BY_TAGS } from '@/queries/graphql';
import { commonUpdateQuery, findTag, isFakeDeleted } from '@/utils/common';
import { useQuery } from '@apollo/client';
import { Box, Button, Container, Icon, Typography } from '@mui/material';
import { useCallback, useContext, useEffect, useState } from 'react';

const SignIn = () => {
  const elementsPerPage = 4;
  const [hasNextPage, setHasNextPage] = useState(false);
  const [featuredTxs, setFeaturedTxs] = useState<IEdge[]>([]);
  const { open: chooseWalletOpen, setOpen: setChooseWalletOpen } = useContext(ChooseWalletContext);
  const [ isFirstTime, setIsFirstTime ] = useState(true);

  useEffect(() => {
    setIsFirstTime(localStorage.getItem('isFirstTime') === 'true');
  }, []);

  const setFirstTime = useCallback(() => {
    localStorage.setItem('isFirstTime', 'false');
    setIsFirstTime(false);
  }, [ setIsFirstTime]);

  const handleClick = useCallback(() => setChooseWalletOpen(true), [ setChooseWalletOpen ]);

  const { data, loading, fetchMore } = useQuery(FIND_BY_TAGS, {
    variables: {
      tags: [...DEFAULT_TAGS_RETRO, ...MODEL_CREATION_PAYMENT_TAGS],
      first: elementsPerPage,
    },
  });

  useEffect(() => {
    if (data && data.transactions.pageInfo.hasNextPage) {
      (async () => {
        await fetchMore({
          variables: {
            after: data.transactions.edges.length > 0 ? data.transactions.edges[data.transactions.edges.length - 1].cursor : undefined,
          },
          updateQuery: commonUpdateQuery,
        });
      })();
    } else if (data) {
      (async () => {
        const filtered: IEdge[] = [];
        for (const el of data.transactions.edges) {
          const modelId = findTag(el, 'modelTransaction') as string;
          const modelOwner = findTag(el, 'sequencerOwner') as string;
          if (!(await isFakeDeleted(modelId, modelOwner, 'model'))) {
            filtered.push(el);
          } else {
            // ignore
          }
        }
        if (featuredTxs.length === 0) {
          setFeaturedTxs(filtered.slice(0, elementsPerPage));
        }
      })();
    }
  }, [data]);
  
  return <>
    <Container sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '21px' }}>
      <Box display={'flex'}  minWidth={'300px'}>
        <Logo />
      </Box>
      <Box>
        <Typography sx={{ color: '#1F1F26' }} fontWeight={300} fontSize={'30px'} lineHeight={'40.5px'} align='center'>First, Lets get connected!</Typography>
      </Box>
      {/* <Button sx={{ borderRadius: '8px', gap: '10px', background: '#FFF'}} onClick={handleClick}>
        <Typography sx={{ color: '#1F1F26' }} fontWeight={700} fontSize={'18px'} lineHeight={'24.3px'}>Connect Wallet</Typography>
      </Button> */}
      <Box className={'feature-cards-row'} justifyContent={'flex-end'}>
        {featuredTxs.map((el) => (<Box key={el.node.id} display={'flex'} flexDirection={'column'} gap={'30px'}>
          <AiCard model={el} key={el.node.id} loading={loading} />
          <Typography>{findTag(el, 'description')}</Typography>
        </Box>))}
      </Box>
      <Button sx={{ bottom: '20px', position: 'fixed', borderRadius: '8px', gap: '10px', background: '#FFF' }}>
        <Typography>Skip</Typography>
      </Button>
    </Container>
  </>;
};

export default SignIn;