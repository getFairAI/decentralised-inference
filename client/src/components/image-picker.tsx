import { DEV_ARWEAVE_URL } from '@/constants';
import { IEdge } from '@/interfaces/arweave';
import { ApolloError } from '@apollo/client';
import { Box, CircularProgress, ImageList, ImageListItem } from '@mui/material';
import { useController, UseControllerProps } from 'react-hook-form';

const ImagePicker = (props: UseControllerProps & { data: IEdge[], loading: boolean, error?: ApolloError, closeHandler: () => void}) => {
  const { field } = useController(props);

  if (props.loading) {
    return (
      <Box
        sx={{
          width: 500,
          height: 450,
          display: 'flex',
          justifyContent: 'center',
          flexWrap: 'wrap',
          alignContent: 'center',
        }}
      >
        <CircularProgress size={100}/>
      </Box>
    );
  }
  if (props.error) {
    <Box
      sx={{
        width: 500,
        height: 450,
        display: 'flex',
        justifyContent: 'center',
        flexWrap: 'wrap',
        alignContent: 'center',
      }}
    >
        Something Went Wrong...
    </Box>;
  }
  const txids = props.data.map(el => el.node.id);

  const handleClickImage = (itemUrl: string) => {
    console.log(itemUrl);
    field.onChange(itemUrl);
    props.closeHandler();
  };
  return (
    <>
      <ImageList sx={{ width: 500, height: 450 }} cols={3} rowHeight={164}>
        {txids.map((item, index) => (
          <ImageListItem key={index} component='button' onClick={() => handleClickImage(`${DEV_ARWEAVE_URL}/${item}`)}>
            <img
              src={`${DEV_ARWEAVE_URL}/${item}?w=164&h=164&fit=crop&auto=format`}
              srcSet={`${DEV_ARWEAVE_URL}/${item}?w=164&h=164&fit=crop&auto=format&dpr=2 2x`}
              alt={`{${DEV_ARWEAVE_URL}/${item}}`}
              loading="lazy"
            />
          </ImageListItem>
        ))}
      </ImageList>
    </>
  );
};

export default ImagePicker;