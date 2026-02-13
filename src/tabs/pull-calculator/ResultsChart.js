import { useMemo, useRef} from "react";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    CartesianGrid,
} from "recharts";

const COLORS = [
    "#60a5fa", // blue
    "#fbbf24", // amber
    "#34d399", // green
    "#f87171", // red
    "#c084fc", // purple
    "#38bdf8", // cyan
    "#fb7185", // rose
    "#a3e635", // lime
    "#f472b6", // pink
    "#eab308", // yellow
];

export default function ResultsChart({ data, lines, setHoveredPull, compression }) {
    const hoverRef = useRef(null);

    const chartData = useMemo(() => data.map((item) => {
        const obj = { pull: item.pull };
        item.probAtLeastK.forEach((p, i) => {
            if (i > 0) obj[`≥${i}`] = Math.min(100, Math.max(0, p * 100));
        });
        return obj;
    }), [data]);

    const displayedData = useMemo(() => {
        if (!chartData) return [];
        if (compression === 1) return chartData;

        return chartData.filter((_, index) => (index + 1) % compression === 0);
    }, [chartData, compression]);

    const handleHover = (state) => {
        if (!state.isTooltipActive) return;

        const pull = state.activeLabel;

        if (hoverRef.current) cancelAnimationFrame(hoverRef.current);

        hoverRef.current = requestAnimationFrame(() => {
            if (pull) setHoveredPull(pull);
            hoverRef.current = null;
        });
    }

    const lineComponents = useMemo(() =>
        Array.from({ length: lines }, (_, i) => (
            <Line
                key={i + 1}
                type="monotone"
                dataKey={`≥${i + 1}`}
                stroke={COLORS[i]}
                dot={false}
                strokeWidth={i === 0 ? 2.5 : 1.5}
            />
        )), [lines]);

    return <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: "100%", height: "300px", maxWidth: "1600px", marginBottom: "16px", padding: "0.5rem",
        border: "1px #ccc solid", borderRadius: "1rem"
    }}
    >
        <ResponsiveContainer width="100%" height={300}>
            <LineChart
                data={displayedData}
                onMouseMove={handleHover}
                onTouchMove={handleHover}
            >
                <XAxis dataKey="pull" stroke="#e5e7eb" tick={{ fill: "#e5e7eb" }} />
                <YAxis domain={[0, 100]} stroke="#e5e7eb" tick={{ fill: "#e5e7eb" }} tickFormatter={(v) => `${Math.round(v)}%`} />
                <Tooltip
                    formatter={(value) => value > 99.9999 ? `${(100).toFixed(5)}%` : `${value.toFixed(5)}%`}
                    contentStyle={{
                        backgroundColor: "#1f2933",
                        border: "1px solid #374151",
                        borderRadius: 4,
                    }}
                    labelStyle={{ color: "#e5e7eb" }}
                    itemStyle={{ color: "#e5e7eb" }}
                    cursor={{ stroke: "#9ca3af", strokeWidth: 1 }}
                />
                <Legend
                    wrapperStyle={{
                        color: "#e5e7eb",
                    }}
                />
                <CartesianGrid
                    stroke="#374151"
                    strokeDasharray="3 3"
                />
                {lineComponents}
            </LineChart>
        </ResponsiveContainer>
    </div>;
}
