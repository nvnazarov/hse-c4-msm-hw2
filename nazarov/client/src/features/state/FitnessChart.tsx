import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Colors,
} from "chart.js";
import { useEffect, useRef } from "react";
import { State } from "./stateSlice";
import "./FitnessChart.css";

Chart.register(
  Colors,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
);

export interface Props {
  states: State[];
}

export function FitnessChart({ states }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const existingChart = Chart.getChart(canvasRef.current);
    if (existingChart) {
      existingChart.destroy();
    }
    const chart = new Chart(canvasRef.current, {
      type: "line",
      data: {
        datasets: [],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
          x: {
            type: "linear",
            title: {
              display: true,
              text: "Step",
            },
          },
          y: {
            title: {
              display: true,
              text: "Fitness",
            },
          },
        },
        plugins: {
          colors: {
            enabled: true,
            forceOverride: true,
          },
        },
      },
    });
    chartRef.current = chart;
    return () => {
      chart.destroy();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;

    if (states.length === 0) {
      chartRef.current.data.datasets = [];
      chartRef.current.update();
      return;
    }

    const n = states[0].agents.length;
    const dataPerAgent = [...Array(n)].map((_, ai) =>
      states.map((state, si) => ({
        x: si,
        y: state.fitness[ai],
      })),
    );
    chartRef.current.data.datasets = [
      {
        label: "Best",
        data: states.map((state, i) => ({
          x: i,
          y: Math.min(...state.fitness),
        })),
        fill: false,
        tension: 0.1,
      },
      ...dataPerAgent.map((dpa, ai) => {
        return { label: "x" + ai, data: dpa, fill: false, tension: 0.1 };
      }),
    ];

    chartRef.current.update();
  }, [states, chartRef]);

  return (
    <div className="fitness-chart">
      <p>Fitness per agent</p>
      <hr />
      <div>
        <canvas ref={canvasRef}></canvas>
      </div>
    </div>
  );
}
