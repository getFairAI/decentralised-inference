import { useEffect, useRef } from 'react';

// type usePreviousType = <T>(value: T):  T | undefined;

const usePrevious = <T extends Partial<T>>(value: T): T | undefined => {
  const ref = useRef<T | undefined>();
  
  useEffect(() => { 
    ref.current = value;
  });
  
  return ref.current;
};

export default usePrevious;