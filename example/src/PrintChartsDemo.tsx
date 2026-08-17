import { useEffect, useRef } from 'react';
import { PrintButton } from 'react-print-section';

const DATA = [
  { label: 'Jan', value: 42 },
  { label: 'Feb', value: 68 },
  { label: 'Mar', value: 51 },
  { label: 'Apr', value: 89 },
  { label: 'May', value: 74 },
];

/**
 * A hand-drawn <canvas> bar chart, standing in for canvas-based chart
 * libraries (Chart.js, react-chartjs-2, ApexCharts' canvas renderer, ...).
 * Before the fix, `printElement` cloned this element with `cloneNode()`,
 * which never copies a canvas's drawn pixels — so this chart printed as an
 * empty box. It now gets snapshotted to an <img> automatically.
 */
function CanvasBarChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const max = Math.max(...DATA.map((d) => d.value));
    const barWidth = width / DATA.length;

    ctx.clearRect(0, 0, width, height);
    DATA.forEach((d, i) => {
      const barHeight = (d.value / max) * (height - 30);
      ctx.fillStyle = '#4f46e5';
      ctx.fillRect(i * barWidth + 12, height - barHeight - 20, barWidth - 24, barHeight);
      ctx.fillStyle = '#111';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(d.label, i * barWidth + barWidth / 2, height - 5);
    });
  }, []);

  return <canvas ref={canvasRef} width={320} height={180} style={{ width: 320, height: 180 }} />;
}

/** An SVG bar chart, standing in for SVG-based libraries (Recharts, Victory, ...).
 *  SVG is real DOM, so `cloneNode()` already copied this correctly even before the fix. */
function SvgBarChart() {
  const max = Math.max(...DATA.map((d) => d.value));
  const barWidth = 320 / DATA.length;

  return (
    <svg width={320} height={180} viewBox="0 0 320 180">
      {DATA.map((d, i) => {
        const barHeight = (d.value / max) * 150;
        return (
          <g key={d.label}>
            <rect
              x={i * barWidth + 12}
              y={160 - barHeight}
              width={barWidth - 24}
              height={barHeight}
              fill="#059669"
            />
            <text x={i * barWidth + barWidth / 2} y={175} fontSize={12} textAnchor="middle">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function PrintChartsDemo() {
  const reportRef = useRef<HTMLDivElement>(null);

  return (
    <section style={{ border: '1px solid #ddd', borderRadius: 8, padding: 24, marginBottom: 32 }}>
      <h2>Printing charts</h2>
      <p style={{ color: '#666' }}>
        Canvas-based charts are now snapshotted to an image before printing, so they show up in
        the output instead of printing blank. SVG-based charts worked already since SVG is real
        DOM.
      </p>

      <div ref={reportRef} className="report" style={{ border: '1px dashed #aaa', padding: 16, marginBottom: 12 }}>
        <h4 style={{ margin: '0 0 12px' }}>Monthly report</h4>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: 13, color: '#666' }}>Canvas chart</p>
            <CanvasBarChart />
          </div>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: 13, color: '#666' }}>SVG chart</p>
            <SvgBarChart />
          </div>
        </div>
      </div>

      <PrintButton
        targetRef={reportRef}
        documentTitle="Monthly report"
        pageSize="A4"
        margin="12mm"
        printClassName="report-print"
        pageStyle=".report { border: none !important; }"
      >
        Print report (with charts)
      </PrintButton>
    </section>
  );
}
