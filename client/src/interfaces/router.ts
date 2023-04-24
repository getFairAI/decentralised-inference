import { IEdge } from './arweave';

export interface RouteLoaderResult {
  updatedFee?: string;
  avatarTxId?: string;
  notesTxId?: string;
}

export interface NavigationState {
  modelName: string;
  modelCreator: string;
  fee: string;
  modelTransaction: string;
  fullState: IEdge;
}
