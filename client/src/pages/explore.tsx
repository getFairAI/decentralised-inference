import { IEdge, ITransactions } from '@/interfaces/arweave';
import { useQuery } from '@apollo/client';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardHeader,
  Chip,
  Container,
  InputAdornment,
  Skeleton,
  TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid'; // Grid version 2
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import SearchIcon from '@mui/icons-material/Search';
import { MouseEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LIST_MODELS_QUERY } from '@/queries/graphql';
import { MARKETPLACE_FEE } from '@/constants';
import { genLoadingArray } from '@/utils/common';
import { Stack } from '@mui/system';
import ReplayIcon from '@mui/icons-material/Replay';

const Explore = () => {
  const navigate = useNavigate();
  const [txs, setTxs] = useState<IEdge[]>([]);

  const mockArray = genLoadingArray(10);

  // filter only models who paid the correct Marketplace fee
  const handleCompleted = (data: { transactions: ITransactions }) =>
    setTxs(data.transactions.edges.filter((el) => el.node.quantity.ar !== MARKETPLACE_FEE));

  const { loading, error, refetch } = useQuery(LIST_MODELS_QUERY, {
    onCompleted: handleCompleted,
  });

  const handleCardClick = (e: MouseEvent<HTMLButtonElement>, txid?: string, index?: number) => {
    e.preventDefault();
    if (!txid || index === undefined) return;
    navigate(`/model/${encodeURIComponent(txid)}/detail`, { state: txs[index] });
  };

  return (
    <Box sx={{ flexGrow: 1 }} margin={2}>
      <Grid container spacing={{ xs: 2, md: 3, lg: 5 }} columns={{ xs: 4, sm: 8, md: 12 }}>
        <Grid xs={12} justifyContent={'flex-end'} display={'flex'} item>
          <TextField
            placeholder='Search...'
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          ></TextField>
        </Grid>
        {error ? (
          <Container>
            <Typography alignItems='center' display='flex' flexDirection='column'>
              Could not Fetch Available Models.
              <Button
                sx={{ width: 'fit-content' }}
                endIcon={<ReplayIcon />}
                onClick={() => refetch()}
              >
                Retry
              </Button>
            </Typography>
          </Container>
        ) : loading ? (
          mockArray.map((val) => {
            return (
              <Grid xs={2} sm={4} key={val} item>
                <Card sx={{ display: 'flex' }}>
                  <CardHeader
                    sx={{ marginRight: 0 }}
                    avatar={
                      <Skeleton
                        animation={'wave'}
                        variant='circular'
                        sx={{ width: 80, height: 80 }}
                      />
                    }
                    disableTypography={true}
                  />
                  <CardContent sx={{ width: '100%' }}>
                    <Box sx={{ textOverflow: 'ellipsis', flexWrap: 'wrap' }}>
                      <Stack spacing={1}>
                        <Typography noWrap variant='body1'>
                          <Skeleton animation={'wave'} variant='rounded' />
                        </Typography>
                        <Typography variant='body1' width={'80%'}>
                          <Skeleton animation='wave' variant='rounded' />
                        </Typography>
                        <Box display={'flex'} justifyContent={'space-between'}>
                          <Typography variant='body1' width={'45%'}>
                            <Skeleton animation='wave' variant='rounded' />
                          </Typography>
                          <Typography variant='body1' width={'30%'}>
                            <Skeleton animation='wave' variant='rounded' />
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })
        ) : (
          txs.map((edge: IEdge, index) => (
            <Grid xs={2} sm={4} md={4} key={index} item>
              <Card>
                <CardActionArea
                  style={{ display: 'flex' }}
                  onClick={(e) =>
                    handleCardClick(
                      e,
                      edge.node.tags.find((el) => el.name === 'Model-Transaction')?.value,
                      index,
                    )
                  }
                >
                  <CardHeader
                    sx={{ marginRight: 0 }}
                    avatar={<Avatar alt='' src='' sx={{ width: 80, height: 80 }} />}
                    disableTypography={true}
                  />
                  <CardContent sx={{ maxWidth: '300px' }}>
                    <Box sx={{ textOverflow: 'ellipsis', flexWrap: 'wrap' }}>
                      {/* <Typography noWrap variant='h6'>
                        {edge.node.tags.find((el) => el.name === 'test')?.value}
                      </Typography> */}
                      <Typography noWrap variant='body1'>
                        {edge.node.tags.find((el) => el.name === 'Model-Transaction')?.value}
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignContent: 'center',
                        }}
                      >
                        <Chip
                          label={edge.node.tags.find((el) => el.name === 'Category')?.value}
                          color='primary'
                        />
                        <Box sx={{ display: 'flex', alignContent: 'center' }}>
                          <Typography variant='body1'>11</Typography>
                          <ThumbUpIcon />
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Box>
  );
};

export default Explore;
