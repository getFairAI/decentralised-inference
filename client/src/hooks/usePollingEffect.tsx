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

import { useCallback, useEffect, useRef, useState } from 'react';

type PollingFn = (
  asyncCallback: () => Promise<void> | void,
  dependencies: unknown[],
  interval?: number,
  cleanUp?: () => void,
) => [() => void, () => void];

export const usePollingEffect: PollingFn = (asyncCallback, dependencies, interval, cleanUp) => {
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let _stopped;
    if (isRunning) {
      _stopped = false;
      // Start polling
      (async function pollingCallback() {
        try {
          await asyncCallback();
        } finally {
          // Set timeout after it finished, unless stopped
          if (_stopped) {
            // ignore
          } else {
            timeoutIdRef.current = setTimeout(pollingCallback, interval);
          }
        }
      })();
    } else {
      // ignore
    }

    // Clean up if dependencies change
    return () => {
      _stopped = true; // prevent racing conditions
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
      if (cleanUp) {
        cleanUp();
      }
    };
  }, [...dependencies, interval, isRunning]);

  const start = useCallback(() => setIsRunning(true), [setIsRunning]);

  const stop = useCallback(() => setIsRunning(false), [setIsRunning]);

  return [start, stop];
};
