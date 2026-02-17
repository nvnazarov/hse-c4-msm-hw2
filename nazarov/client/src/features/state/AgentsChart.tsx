import { Chart, ScatterController } from "chart.js";
import "./AgentsChart.css";
import { State } from "./stateSlice";
import { useEffect, useRef, useState } from "react";
import { Run } from "../run/runSlice";

Chart.register(ScatterController);

export interface Props {
  step: number;
  states: State[];
  run: Run;
}

export function AgentsChart({ step, states, run }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);
  const [selectedDims, setSelectedDims] = useState<boolean[]>(
    [...Array(run.n_dims)].map((_) => false),
  );
  const [slidersValues, setSlidersValues] = useState<number[]>(
    [...Array(run.n_dims)].map((_) => run.low[0]),
  );

  useEffect(() => {
    setSelectedDims([...Array(run.n_dims)].map((_) => false));
    setSlidersValues([...Array(run.n_dims)].map((_) => run.low[0]));
  }, [run]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const existingChart = Chart.getChart(canvasRef.current);
    if (existingChart) {
      existingChart.destroy();
    }
    const chart = new Chart(canvasRef.current, {
      type: "scatter",
      data: {
        datasets: [],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
          x: {
            title: {
              display: true,
              text: "a1",
            },
          },
          y: {
            title: {
              display: true,
              text: "a2",
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
  }, [canvasRef]);

  useEffect(() => {
    if (!chartRef.current) return;

    const d1 = selectedDims.indexOf(true);
    const d2 = selectedDims.lastIndexOf(true);
    if (d1 === -1 || d2 === -1 || d1 === d2) {
      return;
    }

    const state = states.find((state) => state.step === step);
    if (!state) {
      return;
    }
    const prevState = states.find((state) => state.step === step - 1);
    chartRef.current.data.datasets = [
      {
        label: "Current",
        data: state.agents.map((pos, ai) => {
          return { x: pos[d1], y: pos[d2], r: state.fitness[ai] };
        }),
      },
    ];
    if (prevState) {
      chartRef.current.data.datasets = [
        ...chartRef.current.data.datasets,
        {
          label: "Old",
          data: prevState.agents.map((pos, ai) => {
            return { x: pos[d1], y: pos[d2], r: state.fitness[ai] };
          }),
        },
      ];
    }
    chartRef.current.update();
  }, [step, states, selectedDims, chartRef]);

  function handleDimCheckToggle(idx: number) {
    setSelectedDims(selectedDims.map((v, i) => (i === idx ? !v : v)));
  }

  const canSelectDims = selectedDims.filter((v) => v).length < 2;

  return (
    <div className="agents-chart">
      <div className="agents-chart__canvas">
        <canvas ref={canvasRef}></canvas>
      </div>
      <div className="agents-chart__sliders">
        <p>Select 2 dimentions for plot to be shown, use checkboxes.</p>
        <hr />
        {[...Array(run.n_dims)].map((_, di) => (
          <div className="agents-chart__sliders-entry" key={di}>
            <input
              type="checkbox"
              checked={selectedDims[di]}
              disabled={!canSelectDims && !selectedDims[di]}
              onChange={() => handleDimCheckToggle(di)}
            />
            <input
              type="number"
              value={selectedDims[di] ? undefined : slidersValues[di]}
              disabled={!canSelectDims}
            />
            {run.low[di]} to {run.up[di]}
          </div>
        ))}
      </div>
    </div>
  );
}
