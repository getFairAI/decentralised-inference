import { useEffect, useState } from 'react';

/**
 * @description Hook to update time every 'intervalLength' period
 * @param intervalLength Number of seconds for interval (in milliseconds)
 * @returns {number} Returns the new Date in milliseconds
 */
const useTimeInterval = (intervalLength: number) => {
  const [time, setTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setTime(Date.now()), intervalLength);
    return () => {
      clearInterval(interval);
    };
  }, [ intervalLength ]);

  return time;
};

export default useTimeInterval;
