import CandlestickChart from "./candlestickChart";
import { DataFetcher } from "./dataFetcher";
import { Chunk } from "./types";
import "./styles.css";

async function initChart() {
  const data: Chunk[] = await DataFetcher.fetchData(process.env.DATA_URL1!);
  new CandlestickChart(
    document.getElementById("candlestick-chart1") as HTMLCanvasElement,
    data
  );
}

document.addEventListener("DOMContentLoaded", initChart);
