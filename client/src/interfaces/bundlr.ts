export interface ChunkInfo {
  id: number;
  offset: number;
  size: number;
  totalUploaded: number;
};

export interface ChunkError {
  id: number;
  offset: number;
  size: number;
  res: unknown;
}