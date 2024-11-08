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

import { FieldValues } from 'react-hook-form';
import { ITag } from './arweave';
import { findByTagsQuery } from '@fairai/evm-sdk';

export interface IMessage {
  id: string;
  msg: string | File;
  contentType?: string;
  type: 'response' | 'request';
  timestamp: number;
  cid?: number;
  from: string;
  to: string;
  tags: ITag[];
  decData?: string;
}

export interface IConfiguration extends FieldValues {
  generateAssets?: 'fair-protocol' | 'rareweave' | 'none';
  assetNames?: string;
  negativePrompt?: string;
  description?: string;
  customTags?: { name: string; value: string }[];
  nImages?: number;
  width?: number;
  height?: number;
  rareweaveConfig?: {
    royalty: number;
  };
  license?: string;
  licenseConfig?: LicenseForm;
  privateMode?: boolean;
  modelName?: string;
  contextFileUrl?: string | File; // URL or File to upload
}

export interface ConfigurationValues {
  assetNames?: string[];
  customTags?: { name: string; value: string }[];
  negativePrompt?: string;
  nImages?: number;
  title?: string;
  description?: string;
  width?: number;
  height?: number;
  requestCaller?: string;
  privateMode?: boolean;
  userPubKey?: string;
  modelName: string;
  contextFileUrl?: string;
}

export type voteForOptions = 'model' | 'script' | 'operator';

type derivationOptions =
  | ''
  | 'With-Credit'
  | 'With-Indication'
  | 'With-License-Passthrough'
  | 'With-Revenue-Share';
type licenseFeeIntervalOptions = '' | 'One-Time' | 'Monthly' | 'Yearly' | 'Weekly' | 'Daily';
export interface LicenseForm {
  derivations?: derivationOptions;
  revenueShare?: number;
  commercialUse?: '' | 'Allowed' | 'Allowed-With-Credit';
  licenseFeeInterval?: licenseFeeIntervalOptions;
  licenseFee?: number;
  currency?: 'AR' | '$U';
  expires?: number;
  paymentAddress?: string;
  paymentMode?: '' | 'Random-Distribution' | 'Global-Distribution';
}

export interface OperatorData {
  tx: findByTagsQuery['transactions']['edges'][0];
  evmWallet: `0x${string}`;
  evmPublicKey: string;
  arweaveWallet: string;
  operatorFee: number;
  solutionId: string;
}
