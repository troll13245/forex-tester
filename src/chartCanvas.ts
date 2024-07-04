export default class ChartCanvas {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d")!;
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  resize() {
    const html = document.documentElement;
    this.canvas.width = html.clientWidth;
    this.canvas.height = html.clientHeight;
  }

  clear() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawText(
    text: string,
    x: number,
    y: number,
    align: CanvasTextAlign = "center",
    baseline: CanvasTextBaseline = "top"
  ) {
    this.context.fillStyle = "black";
    this.context.font = "10px Arial";
    this.context.textAlign = align;
    this.context.textBaseline = baseline;
    this.context.fillText(text, x, y);
  }

  drawLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string = "black",
    dash: number[] = []
  ) {
    this.context.strokeStyle = color;
    this.context.setLineDash(dash);
    this.context.beginPath();
    this.context.moveTo(x1, y1);
    this.context.lineTo(x2, y2);
    this.context.stroke();
    this.context.setLineDash([]);
  }

  drawRect(x: number, y: number, width: number, height: number, color: string) {
    this.context.fillStyle = color;
    this.context.fillRect(x, y, width, height);
  }
}
