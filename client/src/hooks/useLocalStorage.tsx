import { useCallback, useEffect, useState } from 'react';

export const useLocalStorage = (key: string) => {
  const [storageValue, setStorageValue] = useState('');

  const updateValue = useCallback(
    (value: string) => {
      if (value === storageValue) {
        return;
      } else {
        localStorage.setItem(key, value);
        const oldValue = storageValue;
        setStorageValue(value);
        window.dispatchEvent(new StorageEvent('storage', { key, oldValue, newValue: value }));
      }
    },
    [storageValue, key],
  );

  const handleEvent = useCallback(
    (event: StorageEvent) => {
      if (event.key === key && event.newValue !== storageValue) {
        setStorageValue(event.newValue ?? '');
      }
    },
    [storageValue, key],
  );

  useEffect(() => {
    setStorageValue(localStorage.getItem(key) ?? '');
    window.addEventListener('storage', handleEvent);

    return () => window.removeEventListener('storage', handleEvent);
  }, [key]);

  return { localStorageValue: storageValue, updateStorageValue: updateValue };
};
