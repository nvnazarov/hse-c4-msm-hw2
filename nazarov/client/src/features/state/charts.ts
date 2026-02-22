import { Chart, Plugin } from "chart.js";

export const meshPlugin: Plugin = {
  id: "mesh",
  beforeDraw(chart: Chart, args: any, options: any) {
    const { grid, xMin, xMax, xSteps, yMin, yMax, ySteps } = options;
    if (!grid || !xMin || !xMax || !xSteps || !yMin || !yMax || !ySteps) {
      return;
    }

    let minFitness = Number.MAX_VALUE;
    let maxFitness = Number.MIN_VALUE;
    for (let row of grid as number[][]) {
      for (let elem of row) {
        minFitness = Math.min(minFitness, elem);
        maxFitness = Math.max(maxFitness, elem);
      }
    }

    const { ctx, scales } = chart;
    const xScale = scales.x!;
    const yScale = scales.y!;
    const xStep = (xMax - xMin) / xSteps;
    const yStep = (yMax - yMin) / ySteps;
    const w = xScale.getPixelForValue(xMin + xStep) - xScale.getPixelForValue(xMin);
    const h = yScale.getPixelForValue(yMin + yStep) - yScale.getPixelForValue(yMin);
    for (let x = 0; x < xSteps; ++x) {
      for (let y = 0; y <= ySteps - 1; ++y) {
        const fitness = (grid[x][y] - minFitness) / (maxFitness - minFitness);
        const hue = (1 - (fitness + 1) / 2) * 240;

        const px = xScale.getPixelForValue(xMin + xStep * x);
        const py = yScale.getPixelForValue(yMin + yStep * y);

        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
        ctx.fillRect(px, py, w, h);
      }
    }
  },
};