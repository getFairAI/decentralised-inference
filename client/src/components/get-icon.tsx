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
import AssignmentIcon from '@mui/icons-material/Assignment';
import DashboardIcon from '@mui/icons-material/Dashboard';
import GavelIcon from '@mui/icons-material/Gavel';
import PaymentIcon from '@mui/icons-material/Payment';

type Props = {
  input: string;
};

import DiscordIcon from '../assets/discord-mark-blue.svg?react';

const GetIcon = ({ input }: Props): JSX.Element => {
  const theme = useTheme();

  switch (input) {
    case 'Studio':
      return <DashboardIcon fontSize={'inherit'}></DashboardIcon>;
    case 'Bundlr Settings':
      return <Settings fontSize={'inherit'}></Settings>;
    case 'Top Up':
      return <PaymentIcon fontSize={'inherit'}></PaymentIcon>;
    case 'Whitepaper':
      return <Article fontSize={'inherit'}></Article>;
    case 'Github':
      return <GitHub fontSize={'inherit'}></GitHub>;
    case 'Twitter':
      return <Twitter fontSize={'inherit'}></Twitter>;
    case 'Discord':
      return (
        <SvgIcon
          component={DiscordIcon}
          inheritViewBox
          fontSize={'inherit'}
          sx={{
            '.cls-1': {
              fill: theme.palette.text.primary,
            },
          }}
        />
      );
    case 'Operator Registrations':
      return <AssignmentIcon fontSize={'inherit'}></AssignmentIcon>;
    case 'Terms And Conditions':
      return <GavelIcon fontSize={'inherit'}></GavelIcon>;
    case 'Change Wallet':
      return <SyncAltIcon fontSize={'inherit'}></SyncAltIcon>;
    default:
      return <Logout fontSize={'inherit'}></Logout>;
  }
};

export default GetIcon;
