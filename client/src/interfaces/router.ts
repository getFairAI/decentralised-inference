import { IEdge } from './arweave';

export interface RouteLoaderResult {
  updatedFee?: string;
  avatarTxId?: string;
  notesTxId?: string;
}

export interface ScriptNavigationState {
  scriptName: string;
  scriptCurator: string;
  fee: string;
  scriptTransaction: string;
  fullState: IEdge;
}

export interface ModelNavigationState {
  modelName: string;
  modelCreator: string;
  fee: string;
  modelTransaction: string;
  fullState: IEdge;
}
