// import { IEdge } from "@/interfaces/arweave";
import { Box, Typography, Button, Card, CardMedia } from '@mui/material';
import { IEdge } from '../interfaces/arweave';
const SlideCard = (props: { data?: IEdge }) => {
  return (
    <>
      <Box
        sx={{ maxHeight: '250px', maxWidth: '250px' }}
        display={'flex'}
        flexDirection={'column'}
        justifyContent={'space-between'}
      >
        <Typography variant='h4' gutterBottom>
          {props.data?.node.tags.find((el) => el.name === 'test')?.value}
        </Typography>
        <Typography
          variant='body1'
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: '5',
            WebkitBoxOrient: 'vertical',
          }}
          gutterBottom
        >
          Pellentesque eu felis eget purus blandit gravida. Curabitur eu metus ut sapien congue
          tempus id sit amet mauris. Cras bibendum, ex lobortis porta pellentesque, augue augue
          mollis est, ut pretium velit nisl vel purus. Quisque malesuada velit sit amet leo semper
          faucibus. Donec fringilla mi nec metus pretium, quis sagittis lorem auctor. Aliquam a nibh
          enim. Curabitur vitae urna laoreet, faucibus tellus nec, hendrerit nunc. Sed eu ipsum
          euismod, malesuada turpis a, ultricies neque. Morbi quis diam in dolor efficitur feugiat
          vitae nec nibh. Ut a libero nunc. Sed euismod tortor fringilla lacus blandit volutpat.
          Proin porttitor dolor eget sapien volutpat, cursus feugiat nibh mattis. Phasellus ac metus
          sagittis, vulputate sem ac, pretium velit.
        </Typography>
        <Button variant='contained'>Check Details</Button>
      </Box>
      <Card>
        <Box sx={{ position: 'relative' }}>
          <CardMedia
            sx={{ height: '250px', maxWidth: '500px' }}
            component={'img'}
            image='/contemplative-reptile.jpg'
            title='green iguana'
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              bgcolor: 'rgba(0, 0, 0, 0.54)',
              color: 'white',
              padding: '10px',
            }}
          >
            <Typography gutterBottom variant='h6' noWrap>
              Creator: l9dPUiV1sY1fwy40gtkPENMx4irfxinkIaF0PiwoLI
            </Typography>
            <Typography variant='body2'>
              Lizards are a widespread group of squamate reptiles, with over 6,000 species, ranging
              across all continents except Antarctica
            </Typography>
          </Box>
        </Box>
      </Card>
    </>
  );
};

export default SlideCard;
