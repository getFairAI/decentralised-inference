import { IEdge } from '@/interfaces/arweave';
import { gql, useQuery } from '@apollo/client';
import { Avatar, Box, Card, CardActionArea, CardContent, CardHeader, Chip, InputAdornment, TextField, Typography } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2'; // Grid version 2
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import SearchIcon from '@mui/icons-material/Search';
import { MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';

const Explore = () => {
  const navigate = useNavigate();
  const QUERY = gql`
    query txs {
      transactions(
        first:100,
        tags: [
          {
            name: "test",
            values: ["test-upload"]
          },
        ]
      )
      {
        edges {
          node {
            id
            tags {
              name
              value
            }
          }
        }
      }
    }
  `;

  const { data, loading, error } = useQuery(QUERY);
  if (loading) {
    return <h2>Loading...</h2>;
  }

  if (error) {
    console.error(error);
    return null;
  }

  const txs = data.transactions.edges as IEdge[];

  const handleCardClick = (e: MouseEvent<HTMLButtonElement>, txid: string) => {
    e.preventDefault();
    navigate(`/model/${encodeURIComponent(txid)}`);
  }

  return (
    <Box sx={{ flexGrow: 1 }} margin={2}>
      <Grid container spacing={{ xs: 2, md: 3, lg: 5 }} columns={{ xs: 4, sm: 8, md: 12 }}>
        <Grid xs={12} justifyContent={'flex-end'} display={'flex'}>
          <TextField
            placeholder='Search...'
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
            }}
          ></TextField>
        </Grid>
        {txs.map((edge: IEdge, index) => (
          <Grid xs={2} sm={4} md={4} key={index}>
            <Card>
              <CardActionArea style={{ display: 'flex' }} onClick={(e) => handleCardClick(e, edge.node.id)}>
                <CardHeader
                  sx={{ marginRight: 0}}
                  avatar={
                    <Avatar
                      alt=''
                      src=''
                      sx={{ width: 80, height: 80 }}
                    />
                  }
                  disableTypography={true}
                />
                <CardContent sx={{ maxWidth: '300px' }}>
                  <Box sx={{ textOverflow: 'ellipsis', flexWrap: 'wrap' }}>
                    <Typography noWrap variant='h6'>{edge.node.tags.find(el => el.name === 'test')?.value}</Typography>
                    <Typography noWrap variant='body1'>{edge.node.id}</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignContent: 'center' }}>
                      <Chip label="primary" color="primary"/>
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
}

export default Explore;
