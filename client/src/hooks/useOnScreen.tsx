import { RefObject, useEffect, useRef, useState } from 'react';

/**
 * @description Hook to calculate wether an element is currently on screen
 * @param ref Element Ref
 * @returns {boolean} Returns a boolean indicating wether the current element ref is on screen or not
 */
const useOnScreen = (ref: RefObject<HTMLElement>) => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [isOnScreen, setIsOnScreen] = useState(false);

  /**
   * @description Effect that runs only once; It is responsible to create the intersectionObserver;
   * Any time the intersection observer is triggered it will check if the subscribed element is onScreen
   * and change the `isOnScreen` state accordingly
   */
  useEffect(() => {
    observerRef.current = new IntersectionObserver(([entry]) =>
      setIsOnScreen(entry.isIntersecting),
    );
  }, []);

  /**
   * @description Effect that runs everytime the `ref` changes; It is responsible to subscribe the observer
   * to the current provided `ref`
   */
  useEffect(() => {
    observerRef.current?.observe(ref.current as HTMLElement);

    // provide a cleanup funciton to unsubscribe observer when component unmounts
    return () => observerRef.current?.disconnect();
  }, [ref]);

  return isOnScreen;
};

export default useOnScreen;
