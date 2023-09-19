import { InfoOutlined } from '@mui/icons-material';
import { Alert, Box, Typography } from '@mui/material';

const Terms = () => {
  return <Box m={'10%'}>
    <Alert
      variant='outlined'
      severity='info'
      sx={{
        marginBottom: '16px',
        borderRadius: '10px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        backdropFilter: 'blur(4px)',
        '& .MuiAlert-icon': {
          justifyContent: 'center',
        },
        '& .MuiAlert-message': {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
        },
      }}
      icon={<Box display={'flex'} alignItems={'center'} gap={'8px'}>
        <InfoOutlined fontSize='large' /* color='primary' */ />
        <Typography sx={{
          fontWeight: 700,
          fontSize: '23px',
          lineHeight: '31px',
          /* color: theme.palette.primary.main, */
        }}>Terms And Conditions</Typography>
      </Box>}
    >
      <Typography
        sx={{
          fontWeight: 400,
          fontSize: '30px',
          lineHeight: '41px',
          display: 'block',
          textAlign: 'justify',
        }}
      >
        All the communication between participants in this network is done through Arweave.
        When anything is written on Arweave, it&apos;s publicly stored forever due to the
        particularities of that blockchain. As such, kindly exercise caution when inserting
        any information on this website.
      </Typography>
      <Typography
        sx={{
          fontWeight: 400,
          fontSize: '30px',
          lineHeight: '41px',
          display: 'block',
          textAlign: 'justify',
        }}
      >
        By using this app, you acknowledge and accept these terms and conditions.
      </Typography>
    </Alert>
  </Box>;
};

export default Terms;