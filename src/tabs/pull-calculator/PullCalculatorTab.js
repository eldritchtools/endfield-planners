import { useEffect, useRef, useState } from "react";
import ResultsChart from "./ResultsChart";
import MechanicsModal from "./MechanicsModal";

const BANNERS = {
    "Chartered": {
        defaultParams: {
            maxPulls: 240,
            pulled6: 0,
            target6: 6,
            pullsUntil6: 80,
            pullsUntil5: 10,
            pullsOnBanner: 0
        },
        workerUrl: new URL("./charteredWorker.js", import.meta.url),
        targetLines: "target6"
    },
    "Basic": {
        defaultParams: {
            maxPulls: 300,
            specificToggle: "Any",
            target6: 6,
            pullsUntil6: 80,
            pullsUntil5: 10,
            pullsUntil300: 300
        },
        workerUrl: new URL("./basicWorker.js", import.meta.url),
        targetLines: "target6"
    },
    "Arsenal": {
        defaultParams: {
            maxPulls: 5,
            target6Type: "Any",
            pulled6: 0,
            target6: 6,
            pullsUntil6: 4,
            pullsOnBanner: 0
        },
        workerUrl: new URL("./arsenalWorker.js", import.meta.url),
        targetLines: "target6"
    }
}

const inputStyle = { width: "5ch", textAlign: "center", marginRight: "4px" };

const handleSetNumberInput = (val, setValue, force, min, max) => {
    const parsed = parseInt(val, 10);
    const v = force ? (isNaN(parsed) ? min : Math.min(max, Math.max(min, val))) : parsed;
    setValue(v);
}

function CharteredParams({ params, setParams, isComputing }) {
    const setValue = (k, v) => setParams(p => ({ ...p, [k]: v }));

    const numInputComponent = (key, min, max) => {
        return <input type="number" min={min} max={max} value={params[key]} disabled={isComputing}
            onChange={e => handleSetNumberInput(e.target.value, v => setValue(key, v), false)}
            onBlur={e => handleSetNumberInput(e.target.value, v => setValue(key, v), true, min, max)}
            style={inputStyle}
        />
    }

    return <div style={{ display: "flex", alignItems: "center", marginBottom: "16px", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", alignItems: "start" }}>
            <div>
                {numInputComponent("maxPulls", 1, 1200)}
                <label>Max Pulls to Compute</label>
            </div>
            <div>
                {numInputComponent("pulled6", 0, 6)}
                <label>Featured 6★s Pulled</label>
            </div>
            <div>
                {numInputComponent("target6", 1, 6)}
                <label>Target Featured 6★s Pulled</label>
            </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", alignItems: "start" }}>
            <div>
                {numInputComponent("pullsUntil6", 1, 80)}
                <label>Pulls until 6★</label>
            </div>
            <div>
                {numInputComponent("pullsUntil5", 1, 9)}
                <label>Pulls until 5★</label>
            </div>
            <div>
                {numInputComponent("pullsOnBanner", 0, 1200)}
                <label>Pulls done on banner</label>
            </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem", alignItems: "start" }}>
            {params.pullsOnBanner < 30 || isNaN(params.pullsOnBanner) ?
                <div>
                    {isNaN(params.pullsOnBanner) ? 30 : 30 - params.pullsOnBanner} pulls until free 10 pull (30 banner pulls)
                </div> :
                <div>
                    Free 10 pull claimed
                </div>
            }
            {(params.pullsOnBanner < 120 || isNaN(params.pullsOnBanner)) && (params.pulled6 === 0 || isNaN(params.pulled6)) ?
                <div>
                    {isNaN(params.pullsOnBanner) ? 120 : 120 - params.pullsOnBanner} pulls until guaranteed featured 6★ (120 banner pulls)
                </div> :
                <div>
                    Featured 6★ obtained
                </div>
            }
            <div>
                {isNaN(params.pullsOnBanner) ? 240 : 240 - (params.pullsOnBanner % 240)} pulls until bonus featured 6★ (every 240 banner pulls)
            </div>
        </div>
    </div>
}

function BasicParams({ params, setParams, isComputing }) {
    const setValue = (k, v) => setParams(p => ({ ...p, [k]: v }));

    const numInputComponent = (key, min, max) => {
        return <input type="number" min={min} max={max} value={params[key]} disabled={isComputing}
            onChange={e => handleSetNumberInput(e.target.value, v => setValue(key, v), false)}
            onBlur={e => handleSetNumberInput(e.target.value, v => setValue(key, v), true, min, max)}
            style={inputStyle}
        />
    }

    return <div style={{ display: "flex", alignItems: "center", marginBottom: "16px", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", alignItems: "start" }}>
            <div>
                {numInputComponent("maxPulls", 1, 1200)}
                <label>Max Pulls to Compute</label>
            </div>
            <div>
                {numInputComponent("target6", 1, 10)}
                <label>Target 6★s Pulled</label>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                Targeted 6★s
                <select name="banner" id="banner" value={params.specificToggle} onChange={e => setParams(p => ({ ...p, specificToggle: e.target.value }))}>
                    <option value={"Any"}>Any</option>
                    <option value={"Specific"}>Specific</option>
                </select>
            </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", alignItems: "start" }}>
            <div>
                {numInputComponent("pullsUntil6", 1, 80)}
                <label>Pulls until 6★</label>
            </div>
            <div>
                {numInputComponent("pullsUntil5", 1, 9)}
                <label>Pulls until 5★</label>
            </div>
            <div>
                {numInputComponent("pullsUntil300", 0, 300)}
                <label>Pulls until 6★ of choice (300 pulls, 0 to ignore)</label>
            </div>
        </div>
    </div>
}

function ArsenalParams({ params, setParams, isComputing }) {
    const setValue = (k, v) => setParams(p => ({ ...p, [k]: v }));

    const numInputComponent = (key, min, max) => {
        return <input type="number" min={min} max={max} value={params[key]} disabled={isComputing}
            onChange={e => handleSetNumberInput(e.target.value, v => setValue(key, v), false)}
            onBlur={e => handleSetNumberInput(e.target.value, v => setValue(key, v), true, min, max)}
            style={inputStyle}
        />
    }

    let gf6 = 18 - params.pullsOnBanner, gnf6 = 10 - params.pullsOnBanner;
    while (gf6 <= 0) gf6 += 16;
    while (gnf6 <= 0) gnf6 += 16;

    return <div style={{ display: "flex", alignItems: "center", marginBottom: "16px", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", alignItems: "start" }}>
            <div>
                {numInputComponent("maxPulls", 1, 100)}
                <label>Max Pulls to Compute</label>
            </div>
            <div>
                {numInputComponent("target6", 1, 20)}
                <label>Target 6★s</label>
            </div>
            <div>
                {numInputComponent("pulled6", 1, 20)}
                <label>Pulled 6★s</label>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                Targeted 6★s
                <select name="banner" id="banner" value={params.target6Type} onChange={e => setParams(p => ({ ...p, target6Type: e.target.value }))}>
                    <option value={"Any"}>Any</option>
                    <option value={"Specific NonFeatured"}>Specific NonFeatured</option>
                    <option value={"Featured"}>Featured</option>
                </select>
            </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "start" }}>
            <div>
                {numInputComponent("pullsUntil6", 1, 80)}
                <label>Pulls until 6★</label>
            </div>
            <div>
                {numInputComponent("pullsOnBanner", 1, 20)}
                <label>Pulls done on banner</label>
            </div>
            {!isNaN(params.pullsOnBanner) ?
                (params.pullsOnBanner < 8 && params.pulled6 === 0 && params.target6Type === "Featured" ?
                    <div>{8 - params.pullsOnBanner} pulls until guaranteed featured 6★</div> :
                    <>
                        <div>
                            {gf6} pulls until next bonus featured 6★
                        </div>
                        <div>
                            {gnf6} pulls until next bonus non-featured 6★ of choice
                        </div>
                    </>
                ) : null
            }
        </div>
    </div>
}

function OperatorBannerResults({ currentResult }) {
    const arsenalTokens = currentResult.e6 * 2000 + currentResult.e5 * 200 + currentResult.e4 * 20;

    return <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
        <h3 style={{ margin: 0 }}>Pull {currentResult.pull}</h3>
        <div>At least n target 6★</div>
        <div style={{ display: "grid", gridTemplateColumns: "auto auto", gap: "0.25rem" }}>
            {currentResult.probAtLeastK.map((p, i) => i === 0 ? null : <>
                <span key={`${i}n`}>≥{i}</span>
                <span key={`${i}p`}>{p > .999999 ? (100).toFixed(4) : (p * 100).toFixed(4)}%</span>
            </>
            )}
        </div>
        <div>Average operators obtained:</div>
        <div style={{ display: "grid", gridTemplateColumns: "auto auto", gap: "0.25rem", alignItems: "center" }}>
            <span>6★</span>
            <span>{currentResult.e6.toFixed(4)}</span>
            <span>5★</span>
            <span>{currentResult.e5.toFixed(4)}</span>
            <span>4★</span>
            <span>{currentResult.e4.toFixed(4)}</span>
        </div>
        <div>Average Arsenal Tokens: {(arsenalTokens).toFixed(4)}</div>
        <div>Average Arsenal Pulls: {(arsenalTokens / 1980).toFixed(4)}</div>
    </div>
}

function ArsenalBannerResults({ currentResult }) {
    const aicQuota = currentResult.e6 * 50 + currentResult.e5 * 10;

    return <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
        <h3 style={{ margin: 0 }}>Pull {currentResult.pull}</h3>
        <div>At least n target 6★</div>
        <div style={{ display: "grid", gridTemplateColumns: "auto auto", gap: "0.25rem" }}>
            {currentResult.probAtLeastK.map((p, i) => i === 0 ? null : <>
                <span key={`${i}n`}>≥{i}</span>
                <span key={`${i}p`}>{p > .9999995 ? (100).toFixed(4) : (p * 100).toFixed(4)}%</span>
            </>
            )}
        </div>
        <div>Average weapons obtained:</div>
        <div style={{ display: "grid", gridTemplateColumns: "auto auto", gap: "0.25rem", alignItems: "center" }}>
            <span>6★</span>
            <span>{currentResult.e6.toFixed(4)}</span>
            <span>5★</span>
            <span>{currentResult.e5.toFixed(4)}</span>
            <span>4★</span>
            <span>{currentResult.e4.toFixed(4)}</span>
        </div>
        <div>Average AIC Quota: {(aicQuota).toFixed(4)}</div>
    </div>
}

export default function PullCalculatorTab() {
    const [activeBanner, setActiveBanner] = useState("Chartered");
    const [params, setParams] = useState(null);
    const workerRef = useRef(null);
    const [isComputing, setIsComputing] = useState(false);
    const [results, setResults] = useState([]);
    const [hoveredPull, setHoveredPull] = useState(null);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [chartCompression, setChartCompression] = useState(1);
    const [showChart, setShowChart] = useState(true);

    useEffect(() => {
        setParams({ ...BANNERS[activeBanner].defaultParams })
    }, [activeBanner]);

    const handleSwitchBanner = (newBanner) => {
        if (newBanner === activeBanner) return;

        if (isComputing && workerRef.current)
            workerRef.current.postMessage({ command: "cancel" });

        setActiveBanner(newBanner);
        setResults([]);
    }

    const handleStartCancel = () => {
        if (isComputing) {
            if (!workerRef.current) return;

            workerRef.current.postMessage({ command: "cancel" });
        } else {
            setResults([]);
            setIsComputing(true);

            const worker = new Worker(BANNERS[activeBanner].workerUrl);
            workerRef.current = worker;

            worker.onmessage = (e) => {
                const { type, results: chunk } = e.data;

                if (type === "results") {
                    setResults(prev => [...prev, ...chunk]);
                }

                if (type === "done") {
                    setIsComputing(false);
                    worker.terminate();
                    workerRef.current = null;
                }
            };

            worker.postMessage({
                command: "start",
                params: { ...params }
            });
        }
    };

    const currentResult = hoveredPull && results[hoveredPull - 1] ? results[hoveredPull - 1] : null;

    return <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <h2>Pull Calculator</h2>

        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            Active Banner:
            <select name="banner" id="banner" value={activeBanner} onChange={e => handleSwitchBanner(e.target.value)}>
                {Object.keys(BANNERS).map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        </div>

        <p style={{ marginBottom: "16px", textAlign: "start", lineHeight: "1.3" }}>
            Calculate probabilities and expected values for pulls. Hover over the chart to see the rates. The numbers may not be exact due to rounding errors.
            <br />
            At the end of the day, remember that <strong>random is random</strong>. If it's not 100% guaranteed, it will fail for someone eventually no matter how high the chance is.
            <br />
            This calculator only shows odds. Do not treat it as pulling advice. Please pull responsibly.
            <br />
            The chart can be a bit unstable sometimes. Using large numbers may cause your browser to crash due to memory issues. Consider increasing "pulls per point" or hiding the chart if this becomes an issue.
            <br />
            Disclaimer: These are NOT official numbers and are not guaranteed to be 100% accurate. Refer to official channels for official numbers.
        </p>

        {params ?
            (
                activeBanner === "Chartered" ?
                    <CharteredParams params={params} setParams={setParams} isComputing={isComputing} /> :
                    activeBanner === "Basic" ?
                        <BasicParams params={params} setParams={setParams} isComputing={isComputing} /> :
                        activeBanner === "Arsenal" ?
                            <ArsenalParams params={params} setParams={setParams} isComputing={isComputing} /> :
                            null
            ) :
            null
        }

        <div style={{ marginBottom: "16px" }}>
            <button onClick={() => setModalIsOpen(true)}>
                Banner Mechanics
            </button>
            <button
                onClick={handleStartCancel}
                style={{
                    padding: "4px 16px",
                    cursor: "pointer",
                    background: isComputing ? "#dc3545" : "#28a745",
                    color: "#fff",
                }}
            >
                {isComputing ? "Cancel" : "Start"}
            </button>
        </div>

        <h3>Rates for at least n copies of the target 6★</h3>
        <div style={{ display: "flex", alignItems: "center", gap: "0.2rem", marginBottom: "16px" }}>
            <input type="number" min={1} max={100} value={chartCompression} disabled={isComputing}
                onChange={e => handleSetNumberInput(e.target.value, setChartCompression, false)}
                onBlur={e => handleSetNumberInput(e.target.value, setChartCompression, true, 1, 100)}
                style={inputStyle}
            />
            <div>Pulls per point</div>
            <div style={{width: "0.5rem"}}/>
            <input type="number" min={1} max={params?.maxPulls ?? 1} value={hoveredPull} disabled={isComputing}
                onChange={e => handleSetNumberInput(e.target.value, setHoveredPull, false)}
                onBlur={e => handleSetNumberInput(e.target.value, setHoveredPull, true, 1, params?.maxPulls ?? 1)}
                style={inputStyle}
            />
            <div>Viewed pull</div>
            <div style={{width: "0.5rem"}}/>
            <button onClick={() => setShowChart(p => !p)}>{showChart ? "Hide Chart" : "Show Chart"}</button>
        </div>
        {params && showChart ?
            <ResultsChart
                data={results}
                lines={params[BANNERS[activeBanner].targetLines]}
                setHoveredPull={setHoveredPull}
                compression={isNaN(chartCompression) ? 1 : chartCompression}
            /> :
            null
        }

        {currentResult ? (
            activeBanner === "Chartered" || activeBanner === "Basic" ?
                <OperatorBannerResults currentResult={currentResult} /> :
                <ArsenalBannerResults currentResult={currentResult} />
        ) :
            null
        }

        <MechanicsModal isOpen={modalIsOpen} setIsOpen={setModalIsOpen} activeBanner={activeBanner} />
    </div>;
}
