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

import { GitHub, Article, Settings, Twitter, Logout } from '@mui/icons-material';
import { SvgIcon, useTheme } from '@mui/material';
import SyncAltIcon from '@mui/icons-material/SyncAlt';

type Props = {
  input: string;
};

import { ReactComponent as DiscordIcon } from '../assets/discord-mark-blue.svg';

const GetIcon = ({ input }: Props): JSX.Element => {
  const theme = useTheme();

  switch (input) {
    case 'Bundlr Settings':
      return <Settings></Settings>;
    case 'Whitepaper':
      return <Article></Article>;
    case 'Github':
      return <GitHub></GitHub>;
    case 'Twitter':
      return <Twitter></Twitter>;
    case 'Discord':
      return (
        <SvgIcon
          component={DiscordIcon}
          inheritViewBox
          sx={{
            '.cls-1': {
              fill: theme.palette.text.primary,
            },
          }}
        />
      );
    case 'Change Wallet':
      return <SyncAltIcon></SyncAltIcon>;
    default:
      return <Logout></Logout>;
  }
};

export default GetIcon;
