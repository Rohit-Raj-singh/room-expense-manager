import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

export default function MonthlyExpenseChart({ labels = [], values = [] }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (!labels.length) return;

    if (chartRef.current) chartRef.current.destroy();

    chartRef.current = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Monthly Expense",
            data: values,
            backgroundColor: "rgba(99, 102, 241, 0.35)",
            borderColor: "rgba(99, 102, 241, 1)",
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });

    return () => {
      if (chartRef.current) chartRef.current.destroy();
      chartRef.current = null;
    };
  }, [labels, values]);

  return <div className="h-64 w-full"><canvas ref={canvasRef} /></div>;
}

