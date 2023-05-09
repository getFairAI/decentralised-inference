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

export interface ITag {
  name: string;
  value: string;
}

export interface IData {
  size: number;
  type: string | null;
}

export interface IFee {
  ar: string;
  winston: string;
}

export interface IOwner {
  address: string;
  key: string;
}

export interface IQuantity {
  ar: string;
  winston: string;
}

export interface IBlock {
  height: number;
  id: string;
  previous: string;
  timestamp: number;
}

export interface INode {
  id: string;
  tags: ITag[];
  anchor?: string;
  data: IData;
  fee: IFee;
  owner: IOwner;
  quantity: IQuantity;
  recipient: string;
  signature: string;
  block: IBlock;
}

export interface IEdge {
  node: INode;
  cursor?: string;
}

export interface ITransactions {
  edges: IEdge[];
  pageInfo: {
    hasNextPage: boolean;
  };
}

export interface AlpacaHttpResponse {
  created: number;
  model: string;
  output: string;
  usage: {
    completion_tokens: number;
    prompt_tokens: number;
    total_tokens: number;
  }
}