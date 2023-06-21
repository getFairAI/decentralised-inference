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

import { useEffect, useRef } from 'react';

type PollingFn = (
  asyncCallback: () => Promise<void>,
  dependencies: unknown[],
  interval?: number,
  cleanUp?: () => void,
) => void;

export const usePollingEffect: PollingFn = (asyncCallback, dependencies, interval, cleanUp) => {
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Stop previous timeout
    let _stopped = false;
    if (dependencies[0] !== '') {
      (async function pollingCallback() {
        try {
          await asyncCallback();
        } finally {
          // Set timeout after it finished, unless stopped
          timeoutIdRef.current = !_stopped && setTimeout(() => pollingCallback, interval);
        }
      })();
    } else {
      _stopped = true;
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
  }, [...dependencies, interval]);
};
