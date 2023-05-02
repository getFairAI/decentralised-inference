export interface IMessage {
  id: string;
  msg: string;
  type: 'response' | 'request';
  timestamp: number;
  height: number;
  cid?: number;
  from: string;
  to: string;
}