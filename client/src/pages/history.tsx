import { IEdge } from '@/interfaces/arweave';
import { useQuery } from '@apollo/client';
import {
  Avatar,
  Box,
  Card,
  CardActionArea,
  CardContent,
  CardHeader,
  Chip,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid'; // Grid version 2
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import SearchIcon from '@mui/icons-material/Search';
import { MouseEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MARKETPLACE_FEE } from '@/constants';
import { LIST_OWN_MODELS_QUERY } from '@/queries/graphql';

const History = () => {
  const navigate = useNavigate();
  const [ txs, setTxs ] = useState<IEdge[]>([]);
  const [ owner, setOwner ] = useState<string>('');

  // filter only models who paid the correct Marketplace fee
  const handleCompleted = (data: IEdge[]) =>
    setTxs(data.filter((el) => el.node.quantity.ar.toString() !== MARKETPLACE_FEE));

  const { loading, error } = useQuery(LIST_OWN_MODELS_QUERY, {
    onCompleted: handleCompleted,
    skip: !owner,
    variables: {
      owner
    }
  });

  useEffect(() => {
    const getAddress = async () => {
      setOwner(await window.arweaveWallet.getActiveAddress());
    };

    if (window && window.arweaveWallet) getAddress();
  }, [window.arweaveWallet]);

  if (loading) {
    return <h2>Loading...</h2>;
  } else if (error) {
    console.error(error);
    return null;
  }

  const handleCardClick = (e: MouseEvent<HTMLButtonElement>, txid?: string, index?: number) => {
    e.preventDefault();
    if (!txid || index === undefined) return;
    navigate(`/model/${encodeURIComponent(txid)}/detail`, { state: txs[index] });
  };

  return (
    <Box sx={{ flexGrow: 1, top: '64px', position: 'relative' }} margin={2}>
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
        {txs.map((edge: IEdge, index) => (
          <Grid xs={2} sm={4} md={4} key={index} item>
            <Card>
              <CardActionArea
                style={{ display: 'flex' }}
                onClick={(e) => handleCardClick(e, edge.node.tags.find(el => el.name === 'Model-Transaction')?.value, index)}
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
                      {edge.node.tags.find(el => el.name === 'Model-Transaction')?.value}
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignContent: 'center',
                      }}
                    >
                      <Chip label={edge.node.tags.find(el => el.name === 'Category')?.value} color='primary' />
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
        ))}
      </Grid>
    </Box>
  );
};

export default History;
