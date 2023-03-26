import { Icon, Tooltip, Typography } from '@mui/material';
import { FiCard, FiCardActionArea, FiCardContent, FicardMedia } from './full-image-card';
import { IEdge } from '@/interfaces/arweave';
import { toSvg } from 'jdenticon';
import { useNavigate } from 'react-router-dom';
import { MouseEvent, useMemo } from 'react';

const AiCard = ({ model, loading }: { model: IEdge, loading: boolean }) => {
  const navigate = useNavigate();

  const imgUrl = useMemo(() => {
    const img = toSvg(model.node.id, 100);
    const svg = new Blob([img], { type: 'image/svg+xml' });
    return URL.createObjectURL(svg);
  }, [ model ]);


  const getTimePassed = () => {
    const timestamp = model.node.tags.find(el => el.name === 'Unix-Time')?.value
      || model.node.block.timestamp;
    if (!timestamp) return 'Pending';
    const currentTimestamp = Date.now();

    const dateA = Number.isInteger(timestamp) ? (timestamp as number) * 1000 :  parseInt(timestamp as string) * 1000;
    const dateB = currentTimestamp;

    const timeDiff = dateB - dateA;

    // 1 day = 1000 * 60 * 60
    const day = 1000 * 60 * 60 * 24;
    const nDaysDiff = Math.round(timeDiff / day);

    if (nDaysDiff <= 0) {
      return 'Today';
    } else if (nDaysDiff > 7 && nDaysDiff <= 28) {
      const nWeeks = Math.round(nDaysDiff / 7);
      return `${nWeeks} Week(s) Ago`;
    } else if (nDaysDiff > 14 && nDaysDiff <= 28) {
      const nMonths = Math.round(nDaysDiff / 30);
      return `${nMonths} Month(s) Ago`;
    } else {
      return `${nDaysDiff} Day(s) ago`;
    }
  };

  const handleCardClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    navigate(`/model/${encodeURIComponent(model.node.id)}/detail`, { state: model });
  };

  return <FiCard sx={{
    flexGrow: 0
  }}>
    <FiCardActionArea onClick={handleCardClick}>
      <FicardMedia
        src={!loading ? imgUrl : ''}
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '317px',
          height: '352px',
          background: `linear-gradient(to top, #000000 0%, rgba(71, 71, 71, 0) 100%), url(${!loading ? imgUrl : ''})`,
          // backgroundPosition: 'center',        
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover', /* <------ */
          backgroundPosition: 'center center',
        }}
      />
      <FiCardContent>
        <Tooltip title={model.node.tags.find(el => el.name === 'Model-Name')?.value || 'Untitled'} placement={'top-start'}>
          <Typography sx={{
            fontStyle: 'normal',
            fontWeight: '700',
            fontSize: '24px',
            lineHeight: '32px',
            color: '#FFFFFF',
            maxWidth: '200px',
          }} noWrap>
            {model.node.tags.find(el => el.name === 'Model-Name')?.value || 'Untitled'}
          </Typography>
        </Tooltip>
        <Tooltip title={model.node.owner.address} placement={'bottom-start'}>
          <Typography sx={{
            color: '#B5B5B5',
            fontStyle: 'normal',
            fontWeight: '400',
            fontSize: '12px',
            lineHeight: '16px'
          }}>
            {model.node.owner.address.slice(0, 5)}...{model.node.owner.address.slice(-8)}
          </Typography>
        </Tooltip>
        
        <Typography sx={{
          color: '#696969',
          fontStyle: 'normal',
          fontWeight: '400',
          fontSize: '12px',
          lineHeight: '16px'
        }}>
          {getTimePassed()}
        </Typography>
        <Icon sx={{
          position: 'relative',
          bottom: '48px',
          left: '265px'
        }}>
          <img src='/public/thumbs-up.svg'/>
        </Icon>
      </FiCardContent>
    </FiCardActionArea>
  </FiCard>;
};

export default AiCard;
