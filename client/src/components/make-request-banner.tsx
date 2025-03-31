import { StyledMuiButton } from '@/styles/components';
import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import InfoRounded from '@mui/icons-material/InfoRounded';
import LibraryAddRoundedIcon from '@mui/icons-material/LibraryAddRounded';

const MakeRequestBanner = ({ smallScreen }: { smallScreen: boolean }) => {
  const navigate = useNavigate();
  const openRequestsRoute = useCallback(() => navigate('/request'), [navigate]);

  return (
    <div className='flex justify-center w-full animate-slide-down'>
      <div
        style={{
          opacity: 1,
          height: 'fit-content',
          minHeight: '40px',
          width: 'fit-content',
          maxWidth: '100%',
          marginTop: !smallScreen ? '30px' : '20px',
          padding: !smallScreen ? '20px' : '10px',
          borderRadius: '20px',
          background: 'linear-gradient(200deg, #bfe3e0, #a9c9d4)',
          color: '#003030',
          marginLeft: '20px',
          marginRight: '20px',
        }}
        className='w-full flex flex-wrap justify-center xl:justify-between items-center gap-3 shadow-sm font-medium overflow-hidden text-xs md:text-base'
      >
        <span className='px-2 flex flex-nowrap gap-3 items-center'>
          <InfoRounded className='mr-2' />
          Are you looking for custom made, tailored solutions for your own projects?
          <br />
          Create your request listing, define your budget and quickly get amazing solutions tailored
          for you by the trusted FairAI community members.
        </span>

        <StyledMuiButton
          style={{
            display: 'flex',
            gap: '5px',
            alignItems: 'center',
          }}
          className='plausible-event-name=HomeScreen-Info-Message-Access-Requests primary'
          onClick={openRequestsRoute}
        >
          <LibraryAddRoundedIcon style={{ width: '20px', marginRight: '4px' }} />
          Create a request
        </StyledMuiButton>
      </div>
    </div>
  );
};

export default MakeRequestBanner;