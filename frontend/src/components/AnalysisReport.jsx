import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const AnalysisReport = ({ data }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartRef.current && data?.strength_score !== undefined) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
      const score = data.strength_score;
      const ctx = chartRef.current.getContext('2d');
      chartInstance.current = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Strength', 'Remaining'],
          datasets: [{
            data: [score, 100 - score],
            backgroundColor: [
              score > 66 ? '#4CAF50' : score > 33 ? '#FFC107' : '#F44336',
              '#E0E0E0'
            ],
            borderColor: '#ffffff',
            borderWidth: 2,
            circumference: 180,
            rotation: 270,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          aspectRatio: 2,
          plugins: {
            legend: { display: false },
            tooltip: { enabled: false },
          },
          cutout: '70%',
        }
      });
    }
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data]);

  if (!data) return null;

  const getStrengthClass = (strength) => {
    switch (strength?.toLowerCase()) {
      case 'strong': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'weak': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    // We've replaced all remaining 'style' attributes with responsive Tailwind classes
    <div className="analysis-report mt-4 border-t border-gray-200 pt-3">
      <h4 className="text-base md:text-lg font-bold mb-2 text-center text-gray-800">
        Case Analysis Report
      </h4>
      
      <div className="relative w-full max-w-[180px] sm:max-w-[220px] mx-auto mb-3">
        <canvas ref={chartRef}></canvas>
        <div className="absolute top-[70%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-full">
          <span className="text-2xl md:text-3xl font-bold text-gray-700">{data.strength_score}%</span>
          <br/>
          <span className={`badge ${getStrengthClass(data.case_strength)} py-1 px-2 rounded-full text-xs font-semibold`}>
            {data.case_strength}
          </span>
        </div>
      </div>
      
      {/* The text report sections now use responsive text sizes and spacing */}
      <div className="space-y-3 text-sm md:text-base">
        {data.key_strengths && data.key_strengths.length > 0 && (
          <div>
            <strong className="text-gray-800">✅ Key Strengths:</strong>
            <ul className="list-disc list-inside text-gray-700 mt-1 space-y-1 pl-1">
              {data.key_strengths.map((point, index) => <li key={index}>{point}</li>)}
            </ul>
          </div>
        )}

        {data.key_weaknesses && data.key_weaknesses.length > 0 && (
          <div>
            <strong className="text-gray-800">❌ Key Weaknesses:</strong>
            <ul className="list-disc list-inside text-gray-700 mt-1 space-y-1 pl-1">
              {data.key_weaknesses.map((point, index) => <li key={index}>{point}</li>)}
            </ul>
          </div>
        )}

        {data.critical_missing_info && (
          <div>
            <strong className="text-gray-800">❓ Critical Missing Info:</strong>
            <p className="italic text-gray-600 mt-1">{data.critical_missing_info}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisReport;