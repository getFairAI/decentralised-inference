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

import { ReactNode, createContext, useCallback, useEffect, useState } from 'react';
import Snowflakes from 'magic-snowflakes';

export interface SnowContext {
  toggleSnow: (value: boolean) => void;
}

export const SnowContext = createContext<SnowContext>({
  toggleSnow: () => {},
});

export const SnowProvider = ({ children }: { children: ReactNode }) => {
  const [ snowInstance, setSnowInstance ] = useState<Snowflakes | undefined>(undefined);

  useEffect(() => {
    const snowApi = new Snowflakes({
      color: '#EDEDED', // Default: "#5ECDEF"
      count: 50, // 100 snowflakes. Default: 50
      speed: 0.5,
    });
    setSnowInstance(snowApi);

    return () => {
      snowApi?.destroy();
    };
  }, [ ]);

  const toggleSnow = useCallback((value: boolean) => {
    if (value) {
      snowInstance?.start();
      snowInstance?.show();
    } else {
      snowInstance?.hide();
      snowInstance?.stop();
    }
  }, [ snowInstance ]);

  return (
    <SnowContext.Provider value={{ toggleSnow }}>
      {children}
    </SnowContext.Provider>
  );
};
