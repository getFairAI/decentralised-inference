import { STUDIO_LINK, GITHUB_LINK, DISCORD_LINK, TWITTER_LINK, WHITEPAPER_LINK } from '@/constants';
import { ChooseWalletContext } from '@/context/choose-wallet';
import { ChevronRight } from '@mui/icons-material';
import { MenuItem, Typography } from '@mui/material';
import { Dispatch, SetStateAction, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import GetIcon from './get-icon';

const Option = ({
  option,
  setOpen,
  setLinksOpen,
}: {
  option: string;
  setOpen: Dispatch<SetStateAction<boolean>>;
  setLinksOpen?: Dispatch<SetStateAction<boolean>>;
}) => {
  const navigate = useNavigate();
  const { setOpen: setChooseWalletOpen } = useContext(ChooseWalletContext);

  const showIcons = [
    'Twitter',
    'Github',
    'Discord',
    'Whitepaper',
    'Terms And Conditions',
    'Studio',
    'Top Up',
    'Change Wallet',
  ];

  const handleOptionClick = useCallback(() => {
    (async () => {
      switch (option) {
        case 'Studio':
          window.open(STUDIO_LINK, '_blank');
          setOpen(false);
          break;
        case 'Github':
          window.open(GITHUB_LINK, '_blank');
          setOpen(false);
          if (setLinksOpen) {
            setLinksOpen(true);
          }
          break;
        case 'Discord':
          window.open(DISCORD_LINK, '_blank');
          setOpen(false);
          if (setLinksOpen) {
            setLinksOpen(false);
          }
          break;
        case 'Twitter':
          window.open(TWITTER_LINK, '_blank');
          setOpen(false);
          if (setLinksOpen) {
            setLinksOpen(false);
          }
          break;
        case 'Whitepaper':
          window.open(WHITEPAPER_LINK, '_blank');
          setOpen(false);
          if (setLinksOpen) {
            setLinksOpen(false);
          }
          break;
        case 'Top Up':
          setOpen(false);
          navigate('/swap');
          return;
        case 'Terms And Conditions':
          setOpen(false);
          navigate('/terms');
          return;
        case 'Links':
          if (setLinksOpen) {
            setLinksOpen(true);
          }
          setOpen(false);
          return;
        case 'Change Wallet':
          setChooseWalletOpen(true);
          setOpen(false);
          return;
        default:
          setOpen(false);
          return;
      }
    })();
  }, [option]);

  if (showIcons.includes(option)) {
    return (
      <MenuItem sx={{ borderRadius: '10px', margin: '8px' }} onClick={handleOptionClick}>
        <Typography sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <GetIcon input={option}></GetIcon>
          {option}
        </Typography>
      </MenuItem>
    );
  }

  return (
    <MenuItem sx={{ borderRadius: '10px', margin: '8px' }} onClick={handleOptionClick}>
      <Typography
        sx={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {option}
        <ChevronRight fontSize='inherit' />
      </Typography>
    </MenuItem>
  );
};

export default Option;