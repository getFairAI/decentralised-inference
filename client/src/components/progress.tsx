import * as React from 'react';
import LinearProgress, { LinearProgressProps } from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

const CustomProgress = (props: LinearProgressProps & { value: number }) => {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    setProgress(props.value);
  }, [props.value]);

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{ width: '100%', mr: 1 }}>
          <LinearProgress variant="determinate" /* {...props} */ value={progress}/>
        </Box>
        <Box sx={{ minWidth: 35 }}>
          <Typography variant="body2" color="text.secondary">{`${Math.round(
            progress,
          )}%`}</Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default CustomProgress;