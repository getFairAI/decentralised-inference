import { RefObject, useEffect, useState } from 'react';

const useScrollLock = (ref: RefObject<HTMLElement>) => {
  const [isLocked, setIsLocked] = useState(false);

  const handleScrollEvent = () => {
    if (isLocked && ref && ref.current) {
      ref.current.scrollTop = ref.current?.scrollHeight;
      return;
    }
  };

  useEffect(() => {
    if (ref && ref.current) {
      ref.current.addEventListener('scroll', handleScrollEvent, false);
      return () => ref.current?.removeEventListener('scroll', handleScrollEvent, false);
    }
  }, [ref]);

  return setIsLocked;
};

export default useScrollLock;
