import { ChartType, Plugin } from "chart.js";

declare module "chart.js" {
  interface PluginOptionsByType<TType extends ChartType> {
    mesh?: {
      grid?: number[][];
      xMin?: number;
      xMax?: number;
      yMin?: number;
      yMax?: number;
      xSteps?: number;
      ySteps?: number;
    };
    agents?: {
      agents?: number[][];
      d1?: number;
      d2?: number;
    };
  }
}
