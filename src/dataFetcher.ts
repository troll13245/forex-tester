import { Chunk } from "./types";

export class DataFetcher {
  static async fetchData(url: string): Promise<Chunk[]> {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  }
}
