export interface Bar {
  Time: number;
  Open: number;
  High: number;
  Low: number;
  Close: number;
  TickVolume: number;
}

export interface Chunk {
  ChunkStart: number;
  Bars: Bar[];
}
