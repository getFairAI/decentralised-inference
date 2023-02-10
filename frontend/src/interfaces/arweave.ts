export interface ITag {
  name: string;
  value: string;
}

export interface INode {
  id: string;
  tags: ITag[];
}

export interface IEdge {
  node: INode;
}