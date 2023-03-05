export interface ITag {
  name: string;
  value: string;
}

export interface IData {
  size: number;
  type: string | null;
}

export interface IFee {
  ar: number;
  winston: number;
}

export interface IOwner {
  address: string;
  key: string;
}

export interface IQuantity {
  ar: number;
  winston: number;
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
}
