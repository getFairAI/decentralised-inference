/*
 * Fair Protocol, open source decentralised inference marketplace for artificial intelligence.
 * Copyright (C) 2023 Fair Protocol
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 */

import { RefObject, useEffect, useState } from 'react';

const useScroll = (ref: RefObject<HTMLElement>) => {
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [isTop, setIsTop] = useState(false);
  const [isNearTop, setIsNearTop] = useState(false);
  const [isTopHalf, setIsTopHalf] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollChanged, setScrollChanged] = useState(false);

  const handleScrollEvent = (e: Event) => {
    if (e?.currentTarget) {
      setScrollChanged(!scrollChanged);
      const target = e.currentTarget as HTMLElement;
      setIsScrolled(target.scrollTop > 0);
      const bottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 100;
      setIsAtBottom(bottom);
      const topHalf = target.scrollTop < target.scrollHeight / 2;
      setIsTopHalf(topHalf);
      setIsTop(target.scrollTop === 0);
      setIsNearTop(target.scrollTop < (target.scrollHeight * 0.1));
    }
  };

  useEffect(() => {
    if (ref?.current) {
      ref.current.addEventListener('scroll', handleScrollEvent, false);
    }

    return () => {
      if (ref.current) {
        ref.current?.removeEventListener('scroll', handleScrollEvent, false);
      }
    };
  }, [ ref, handleScrollEvent ]);

  return { isAtBottom, isTop,  isNearTop, isTopHalf, isScrolled, scrollChanged };
};

export default useScroll;
