export default class Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  tickVolume: number;

  constructor(
    time: number,
    open: number,
    high: number,
    low: number,
    close: number,
    tickVolume: number
  ) {
    this.time = time;
    this.open = open;
    this.high = high;
    this.low = low;
    this.close = close;
    this.tickVolume = tickVolume;
  }
}
