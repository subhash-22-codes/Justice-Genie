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
              score > 66 ? '#4CAF50' : score > 33 ? '#FFC107' : '#F44336', // Green, Yellow, Red
              '#E0E0E0' // Grey for the remaining part
            ],
            borderColor: '#ffffff',
            borderWidth: 2,
            circumference: 180, // Half circle
            rotation: 270,      // Start from the bottom
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
    // ... (no changes to this helper function)
  };

  return (
    <div className="analysis-report" style={{ marginTop: '16px', borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
      <h4 style={{ fontSize: '1em', fontWeight: 'bold', marginBottom: '8px', textAlign: 'center' }}>Case Analysis Report</h4>
      
      {/* --- The New Chart --- */}
      <div style={{ position: 'relative', width: '70%', margin: '0 auto 12px auto' }}>
        <canvas ref={chartRef}></canvas>
        <div style={{
          position: 'absolute',
          top: '70%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          width: '100%'
        }}>
          <span style={{ fontSize: '1.5em', fontWeight: 'bold' }}>{data.strength_score}%</span>
          <br/>
          <span className={`badge ${getStrengthClass(data.case_strength)}`} style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '0.85em', fontWeight: '600' }}>
            {data.case_strength}
          </span>
        </div>
      </div>
      
      {/* --- The Text Report (no changes below) --- */}
      {data.key_strengths && data.key_strengths.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <strong>✅ Key Strengths:</strong>
          <ul style={{ listStyleType: 'disc', paddingLeft: '20px', margin: '4px 0' }}>
            {data.key_strengths.map((point, index) => <li key={index}>{point}</li>)}
          </ul>
        </div>
      )}

      {data.key_weaknesses && data.key_weaknesses.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <strong>❌ Key Weaknesses:</strong>
          <ul style={{ listStyleType: 'disc', paddingLeft: '20px', margin: '4px 0' }}>
            {data.key_weaknesses.map((point, index) => <li key={index}>{point}</li>)}
          </ul>
        </div>
      )}

      {data.critical_missing_info && (
        <div>
          <strong>❓ Critical Missing Info:</strong>
          <p style={{ fontStyle: 'italic', color: '#555', margin: '4px 0' }}>{data.critical_missing_info}</p>
        </div>
      )}
    </div>
  );
};

export default AnalysisReport;