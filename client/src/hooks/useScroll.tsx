import { RefObject, useEffect, useState } from 'react';

const useScroll = (ref: RefObject<HTMLElement>) => {
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [isTopHalf, setIsTopHalf] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const handleScrollEvent = (e: Event) => {
    if (e && e.currentTarget) {
      const target = e.currentTarget as HTMLElement;
      setIsScrolled(target.scrollTop > 0);
      const bottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 100;
      setIsAtBottom(bottom);
      const topHalf = target.scrollTop < target.scrollHeight / 2;
      setIsTopHalf(topHalf);
    }
  };

  useEffect(() => {
    if (ref && ref.current) {
      ref.current.addEventListener('scroll', handleScrollEvent, false);
      return () => ref.current?.removeEventListener('scroll', handleScrollEvent, false);
    }
  }, [ref]);

  return { isAtBottom, isTopHalf, isScrolled };
};

export default useScroll;
