import { Chart, ScatterController } from "chart.js";
import "./AgentsChart.css";
import { State } from "./stateSlice";
import { ChangeEvent, useEffect, useRef, useState } from "react";
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
              text: "-",
            },
          },
          y: {
            title: {
              display: true,
              text: "-",
            },
          },
        },
        plugins: {
          colors: {
            enabled: true,
            forceOverride: true,
          },
          legend: {
            labels: {
              filter: function (legendItem, chartData) {
                if (legendItem.datasetIndex === undefined) {
                  return false;
                }
                const dataset = chartData.datasets[legendItem.datasetIndex] as any;
                return dataset.hideFromLegend !== true;
              },
            },
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
    const chart = chartRef.current;

    const d1 = selectedDims.indexOf(true);
    const d2 = selectedDims.lastIndexOf(true);
    if (d1 === -1 || d2 === -1 || d1 === d2) {
      return;
    }

    chart.options.scales = {
      x: {
        title: {
          display: true,
          text: "d" + (d1 + 1),
        },
        min: run.low[d1],
        max: run.up[d1],
      },
      y: {
        title: {
          display: true,
          text: "d" + (d2 + 1),
        },
        min: run.low[d2],
        max: run.up[d2],
      },
    };

    const state = states.find((state) => state.step === step);
    if (!state) {
      return;
    }
    const prevState = states.find((state) => state.step === step - 1);
    chart.data.datasets = [
      {
        label: "Current Positions",
        data: state.agents.map((pos, ai) => {
          return { x: pos[d1], y: pos[d2], r: state.fitness[ai] };
        }),
      },
    ];
    if (prevState) {
      chart.data.datasets = [
        ...chart.data.datasets,
        {
          label: "Old Positions",
          data: prevState.agents.map((pos, ai) => {
            return { x: pos[d1], y: pos[d2], r: state.fitness[ai] };
          }),
        },
        ...prevState.agents.map((prevPos, ai) => {
          const currPos = state.agents[ai];
          return {
            data: [
              { x: prevPos[d1], y: prevPos[d2] },
              { x: currPos[d1], y: currPos[d2] },
            ],
            showLine: true,
            borderColor: "blue",
            borderWidth: 2,
            pointRadius: 0,
            hideFromLegend: true,
          };
        }),
      ];
    }
    chart.update();
  }, [run, step, states, selectedDims, chartRef]);

  function handleDimCheckToggle(e: ChangeEvent<HTMLInputElement>, idx: number) {
    e.preventDefault();
    setSelectedDims(
      selectedDims.map((v, i) => (i === idx ? e.target.checked : v)),
    );
  }

  function handleSliderMove(e: ChangeEvent<HTMLInputElement>, idx: number) {
    e.preventDefault();
    setSlidersValues(
      slidersValues.map((v, i) => (i === idx ? +e.target.value : v)),
    );
  }

  function handleSliderValueChange(
    e: ChangeEvent<HTMLInputElement>,
    idx: number,
  ) {
    e.preventDefault();
    let t = +e.target.value;
    if (t < run.low[idx]) {
      t = run.low[idx];
    }
    if (t > run.up[idx]) {
      t = run.up[idx];
    }
    setSlidersValues(slidersValues.map((v, i) => (i === idx ? t : v)));
  }

  const canSelectDims = selectedDims.filter((v) => v).length < 2;

  return (
    <div className="agents-chart">
      <p>Agents movement</p>
      <hr />
      <div className="agents-chart__body">
        <div className="agents-chart__canvas">
          <canvas ref={canvasRef}></canvas>
        </div>
        <div className="agents-chart__sliders">
          <p>Select 2 dimentions for plot to be shown. Use checkboxes.</p>
          <hr />
          {selectedDims.map((_, di) => (
            <div className="agents-chart__sliders-entry" key={di}>
              <input
                type="checkbox"
                checked={selectedDims[di]}
                disabled={!canSelectDims && !selectedDims[di]}
                onChange={(e) => handleDimCheckToggle(e, di)}
              />
              <p>d{di + 1}</p>
              <input
                type="number"
                value={selectedDims[di] ? undefined : slidersValues[di]}
                onChange={(e) => handleSliderValueChange(e, di)}
                disabled={selectedDims[di]}
              />
              <p>{run.low[di]}</p>
              <input
                type="range"
                min={run.low[di]}
                max={run.up[di]}
                value={slidersValues[di]}
                onChange={(e) => handleSliderMove(e, di)}
                disabled={selectedDims[di]}
              />
              <p>{run.up[di]}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
