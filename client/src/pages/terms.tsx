import { InfoOutlined } from '@mui/icons-material';
import { Alert, Box, Button, Typography, useTheme } from '@mui/material';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const Terms = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const handleBack = useCallback(() => navigate('/'), [navigate]);

  return (
    <Box m={'10%'} display={'flex'} flexDirection={'column'} alignItems={'center'} gap={'32px'}>
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
            color: theme.palette.text.primary,
          },
        }}
        icon={
          <Box display={'flex'} alignItems={'center'} gap={'8px'}>
            <InfoOutlined fontSize='large' />
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: '23px',
                lineHeight: '31px',
              }}
            >
              Terms And Conditions
            </Typography>
          </Box>
        }
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
          All the communication between participants in this network is done through Arweave. When
          anything is written on Arweave, it&apos;s publicly stored forever due to the
          particularities of that blockchain. As such, kindly exercise caution when inserting any
          information on this website.
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
      <Button sx={{ width: 'fit-content' }} variant='outlined' onClick={handleBack}>
        <Typography>Back To Marketplace</Typography>
      </Button>
    </Box>
  );
};

export default Terms;
