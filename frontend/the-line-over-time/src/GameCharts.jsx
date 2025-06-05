import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

function StatChart({ data, dataKey, color, label }) {
  const values = data.map(d => d[dataKey]).filter(v => v !== null && v !== undefined && !isNaN(v));
  let min = 0, max = 1;
  if (values.length > 0) {
    min = Math.min(...values);
    max = Math.max(...values);
    const range = max - min;
    min = Math.floor(min - range * 0.1);
    max = Math.ceil(max + range * 0.1);
  }
  return (
    <div style={{ marginBottom: 32, position: "relative", width: 600, height: 220 }}>
      <h4>{label}</h4>
      {values.length === 0 ? (
        <div style={{
          width: 600,
          height: 200,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 32,
          color: "#888",
          border: "1px solid #eee",
          background: "#fafafa"
        }}>
          N/A
        </div>
      ) : (
        <LineChart width={600} height={200} data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis domain={[min, max]} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey={dataKey} stroke={color} name={label} />
        </LineChart>
      )}
    </div>
  );
}

export default function GameChart({ data }) {
  return (
    <div>
      <StatChart data={data} dataKey="moneyline" color="#8884d8" label="Moneyline" />
      <StatChart data={data} dataKey="spread" color="#82ca9d" label="Spread" />
      <StatChart data={data} dataKey="spreadOdds" color="#ff7300" label="Spread Odds" />
      <StatChart data={data} dataKey="total" color="#387908" label="Total" />
      <StatChart data={data} dataKey="totalOdds" color="#d62728" label="Total Odds" />
    </div>
  );
}