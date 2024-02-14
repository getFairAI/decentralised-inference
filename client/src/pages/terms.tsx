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

import { styled, useTheme } from '@mui/material';
import { useCallback, useState } from 'react';

const CustomIframe = styled('iframe')(() => ({
  height: '100%',
  width: '100%',
  border: 'none',
}));


const Terms = () => {
  const theme = useTheme();
  const [ isReady, setIsReady ] = useState(false);

  const backgroundColor = theme.palette.background.default;
  const styles = `.c41 {
    background-color: ${backgroundColor} !important;
  }
  html {
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: ${backgroundColor} !important;
  }`;

  const onIframeLoaded = useCallback(() => {
    const iframe = document.querySelector('iframe');
    if (iframe) {
      const iframeDoc = iframe.contentDocument;
      if (iframeDoc) {
        const style = iframeDoc.createElement('style');
        style.type = 'text/css';
        style.innerHTML = styles;
        iframeDoc.head.appendChild(style);
        setIsReady(true);
      }
    }
  }, [ setIsReady]);

  return <CustomIframe
    src='./Terms.html'
    hidden={!isReady}
    onLoad={onIframeLoaded}
  />;
};

export default Terms;
