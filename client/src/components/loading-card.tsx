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

import { Skeleton } from '@mui/material';
import { FiCard, FiCardActionArea } from './full-image-card';

const LoadingCard = () => {

  return <FiCard
      sx={{
        flexGrow: 0,
      }}
      raised={true}
    >
      <FiCardActionArea>
        <Skeleton
          sx={{
            transform: 'none',
            width: '317px',
            height: '352px',
          }}
          animation='wave'
        />
      </FiCardActionArea>
  </FiCard>;
};

export default LoadingCard;