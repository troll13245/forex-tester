import Candle from "./candle";
import ChartCanvas from "./chartCanvas";
import { Chunk } from "./types";

export default class CandlestickChart {
  canvas: ChartCanvas;
  data: Candle[];
  zoom: number;
  priceZoom: number;
  offset: number;
  maxZoom: number;
  minZoom: number;
  crosshairX: number | null;
  crosshairY: number | null;
  offscreenCanvas: HTMLCanvasElement;
  offscreenContext: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement, chunks: Chunk[]) {
    this.canvas = new ChartCanvas(canvas);
    this.data = [];
    chunks.forEach((chunk) => {
      const chunkStart = chunk.ChunkStart;
      this.data.push(
        ...chunk.Bars.map(
          (bar) =>
            new Candle(
              chunkStart + bar.Time,
              bar.Open,
              bar.High,
              bar.Low,
              bar.Close,
              bar.TickVolume
            )
        )
      );
    });
    this.zoom = 1;
    this.priceZoom = 1;
    this.offset = 0;
    this.maxZoom = 5;
    this.minZoom = 0.9;
    this.crosshairX = null;
    this.crosshairY = null;

    // Initialize offscreen canvas
    this.offscreenCanvas = document.createElement("canvas");
    this.offscreenContext = this.offscreenCanvas.getContext("2d")!;
    this.resizeOffscreenCanvas();

    this.init();
  }

  init() {
    window.addEventListener("resize", () => this.resize());
    this.canvas.canvas.addEventListener("wheel", (event) =>
      this.handleScroll(event)
    );
    this.canvas.canvas.addEventListener("mousedown", (event) =>
      this.handleMouseDown(event)
    );
    this.canvas.canvas.addEventListener("mousemove", (event) =>
      this.handleMouseMove(event)
    );
    this.draw();
  }

  resize() {
    const html = document.documentElement;
    this.canvas.canvas.width = html.clientWidth;
    this.canvas.canvas.height = html.clientHeight;
    this.resizeOffscreenCanvas();
    this.draw();
  }

  resizeOffscreenCanvas() {
    this.offscreenCanvas.width = this.canvas.canvas.width;
    this.offscreenCanvas.height = this.canvas.canvas.height;
  }

  handleScroll(event: WheelEvent) {
    event.preventDefault();
    const { offsetX, deltaY } = event;
    if (deltaY < 0) {
      this.zoomIn(offsetX);
    } else {
      this.zoomOut(offsetX);
    }
    this.draw();
  }

  handleMouseDown(event: MouseEvent) {
    const startX = event.clientX;
    const startOffset = this.offset;
    const mouseMoveHandler = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      this.offset = startOffset - dx;
      this.offset = Math.max(
        0,
        Math.min(
          this.offset,
          this.data.length * 10 * this.zoom -
            this.canvas.canvas.width / this.zoom
        )
      );
      this.draw();
    };
    const mouseUpHandler = () => {
      window.removeEventListener("mousemove", mouseMoveHandler);
      window.removeEventListener("mouseup", mouseUpHandler);
    };
    window.addEventListener("mousemove", mouseMoveHandler);
    window.addEventListener("mouseup", mouseUpHandler);
  }

  handleMouseMove(event: MouseEvent) {
    const { offsetX, offsetY } = event;
    this.crosshairX = offsetX;
    this.crosshairY = offsetY;
    this.draw();
  }

  zoomIn(mouseX: number) {
    const oldZoom = this.zoom;
    this.zoom = Math.min(this.maxZoom, this.zoom * 1.2);
    this.priceZoom = this.zoom; // Synchronize price zoom with horizontal zoom
    const scale = this.zoom / oldZoom;
    this.offset = mouseX - (mouseX - this.offset) * scale;
    this.offset = Math.max(
      0,
      Math.min(
        this.offset,
        this.data.length * 10 * this.zoom - this.canvas.canvas.width / this.zoom
      )
    );
  }

  zoomOut(mouseX: number) {
    const oldZoom = this.zoom;
    this.zoom = Math.max(this.minZoom, this.zoom / 1.2);
    this.priceZoom = this.zoom; // Synchronize price zoom with horizontal zoom
    const scale = this.zoom / oldZoom;
    this.offset = mouseX - (mouseX - this.offset) * scale;
    this.offset = Math.max(
      0,
      Math.min(
        this.offset,
        this.data.length * 10 * this.zoom - this.canvas.canvas.width / this.zoom
      )
    );
  }

  draw() {
    // Clear offscreen canvas
    this.offscreenContext.clearRect(
      0,
      0,
      this.offscreenCanvas.width,
      this.offscreenCanvas.height
    );
    const width = this.offscreenCanvas.width;
    const height = this.offscreenCanvas.height;
    const candleWidth = 10 * this.zoom;
    const viewStart = this.offset / candleWidth;
    const viewEnd = viewStart + width / candleWidth;

    const minPrice = this.getMinPrice();
    const maxPrice = this.getMaxPrice();
    const priceRange = (maxPrice - minPrice) / this.priceZoom;
    const volumeHeightRatio = 0.2;
    const volumeHeight = height * volumeHeightRatio;

    for (let i = 0; i < this.data.length; i++) {
      const candle = this.data[i];
      const x = i * candleWidth - this.offset;
      if (x + candleWidth < 0 || x > width) continue;

      const openY =
        height -
        volumeHeight -
        ((candle.open - minPrice) * (height - volumeHeight)) / priceRange;
      const closeY =
        height -
        volumeHeight -
        ((candle.close - minPrice) * (height - volumeHeight)) / priceRange;
      const highY =
        height -
        volumeHeight -
        ((candle.high - minPrice) * (height - volumeHeight)) / priceRange;
      const lowY =
        height -
        volumeHeight -
        ((candle.low - minPrice) * (height - volumeHeight)) / priceRange;
      const volumeY =
        height -
        (candle.tickVolume / Math.max(...this.data.map((c) => c.tickVolume))) *
          volumeHeight;

      this.offscreenContext.fillStyle =
        candle.close > candle.open ? "green" : "red";
      this.offscreenContext.fillRect(
        x,
        Math.min(openY, closeY),
        candleWidth,
        Math.abs(closeY - openY)
      );
      this.offscreenContext.strokeStyle = "black";
      this.offscreenContext.beginPath();
      this.offscreenContext.moveTo(x + candleWidth / 2, highY);
      this.offscreenContext.lineTo(x + candleWidth / 2, lowY);
      this.offscreenContext.stroke();

      // Draw tick volume
      this.offscreenContext.fillStyle = "blue";
      this.offscreenContext.fillRect(x, volumeY, candleWidth, height - volumeY);
    }

    this.drawMarkings(this.offscreenContext);

    if (this.crosshairX !== null && this.crosshairY !== null) {
      this.drawCrosshair(this.crosshairX, this.crosshairY);
      this.drawCrosshairInfo(this.crosshairX, this.crosshairY);
    }

    // Draw offscreen canvas to main canvas
    this.canvas.context.clearRect(
      0,
      0,
      this.canvas.canvas.width,
      this.canvas.canvas.height
    );
    this.canvas.context.drawImage(this.offscreenCanvas, 0, 0);
  }

  drawCrosshair(x: number, y: number) {
    const width = this.offscreenCanvas.width;
    const height = this.offscreenCanvas.height;

    this.offscreenContext.strokeStyle = "gray";
    this.offscreenContext.setLineDash([5, 5]);

    this.offscreenContext.beginPath();
    this.offscreenContext.moveTo(x, 0);
    this.offscreenContext.lineTo(x, height);
    this.offscreenContext.stroke();

    this.offscreenContext.beginPath();
    this.offscreenContext.moveTo(0, y);
    this.offscreenContext.lineTo(width, y);
    this.offscreenContext.stroke();

    this.offscreenContext.setLineDash([]);
  }

  drawCrosshairInfo(x: number, y: number) {
    const height = this.offscreenCanvas.height;
    const minPrice = this.getMinPrice();
    const maxPrice = this.getMaxPrice();
    const priceRange = (maxPrice - minPrice) / this.priceZoom;
    const volumeHeightRatio = 0.2;
    const volumeHeight = height * volumeHeightRatio;

    // Get price and time based on crosshair position
    const price =
      minPrice +
      ((height - volumeHeight - y) * priceRange) / (height - volumeHeight);
    const index = Math.floor((this.offset + x) / (10 * this.zoom));
    const candle = this.data[index];
    const time = candle ? new Date(candle.time * 1000) : new Date();

    this.offscreenContext.fillStyle = "black";
    this.offscreenContext.font = "12px Arial";
    this.offscreenContext.textAlign = "left";
    this.offscreenContext.textBaseline = "top";

    // Draw price
    this.offscreenContext.fillText(
      `Price: ${price.toFixed(5)}`,
      x + 10,
      y - 10
    );

    // Draw time
    const timeString = `${time.getUTCHours()}:${time.getUTCMinutes()}:${time.getUTCSeconds()}`;
    this.offscreenContext.fillText(`Time: ${timeString}`, x + 10, y + 10);
  }

  drawMarkings(context: CanvasRenderingContext2D) {
    const width = context.canvas.width;
    const height = context.canvas.height;
    const candleWidth = 10 * this.zoom;
    const viewStart = this.offset / candleWidth;
    const viewEnd = viewStart + width / candleWidth;

    const minPrice = this.getMinPrice();
    const maxPrice = this.getMaxPrice();
    const priceRange = (maxPrice - minPrice) / this.priceZoom;
    const volumeHeightRatio = 0.2;
    const volumeHeight = height * volumeHeightRatio;

    // Draw time markings
    const timeMarks = 10; // Number of time marks
    for (let i = 0; i <= timeMarks; i++) {
      const index = Math.floor(
        viewStart + (i / timeMarks) * (viewEnd - viewStart)
      );
      if (index < 0 || index >= this.data.length) continue; // Skip if index is out of bounds
      const candle = this.data[index];
      const x = (index - viewStart) * candleWidth;

      const time = new Date(candle.time * 1000);
      const timeString = `${time.getUTCFullYear()}-${
        time.getUTCMonth() + 1
      }-${time.getUTCDate()} ${time.getUTCHours()}:${time.getUTCMinutes()}`;

      context.fillText(timeString, x + candleWidth / 2, height - volumeHeight);
    }

    // Draw price markings
    const priceMarks = 10; // Number of price marks
    for (let i = 0; i <= priceMarks; i++) {
      const price = minPrice + (i / priceMarks) * priceRange;
      const y =
        height -
        volumeHeight -
        ((price - minPrice) * (height - volumeHeight)) / priceRange;

      context.fillText(price.toFixed(5), width - 40, y);
    }
  }

  getMinPrice(): number {
    return Math.min(...this.data.map((c) => c.low));
  }

  getMaxPrice(): number {
    return Math.max(...this.data.map((c) => c.high));
  }
}
