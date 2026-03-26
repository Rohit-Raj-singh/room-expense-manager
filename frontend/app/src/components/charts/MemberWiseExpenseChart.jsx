import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

export default function MemberWiseExpenseChart({ members = [], values = [] }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (!members.length) return;

    if (chartRef.current) chartRef.current.destroy();

    chartRef.current = new Chart(canvasRef.current, {
      type: "doughnut",
      data: {
        labels: members.map((m) => m.name),
        datasets: [
          {
            label: "Member-wise Expense",
            data: values,
            backgroundColor: [
              "rgba(34, 197, 94, 0.35)",
              "rgba(99, 102, 241, 0.35)",
              "rgba(236, 72, 153, 0.35)",
              "rgba(245, 158, 11, 0.35)",
              "rgba(56, 189, 248, 0.35)"
            ],
            borderColor: [
              "rgba(34, 197, 94, 1)",
              "rgba(99, 102, 241, 1)",
              "rgba(236, 72, 153, 1)",
              "rgba(245, 158, 11, 1)",
              "rgba(56, 189, 248, 1)"
            ],
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom" }
        }
      }
    });

    return () => {
      if (chartRef.current) chartRef.current.destroy();
      chartRef.current = null;
    };
  }, [members, values]);

  return <div className="h-64 w-full"><canvas ref={canvasRef} /></div>;
}

