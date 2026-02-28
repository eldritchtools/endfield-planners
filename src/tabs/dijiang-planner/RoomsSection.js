import { useBreakpoint, useProfiles } from "@eldritchtools/shared-components";
import { useEffect, useMemo, useState } from "react";
import roomData from "./roomData";
import { optimizeOperators, priorityOptions } from "./Assignment";
import { ItemImageSelector, ItemTextSelector } from "../../components/ItemSelector";
import { alignmentOptions, computeProductivity } from "./Calculation";
import OperatorSelectorImage from "../../components/OperatorSelectorImage";

function CNComponents({ roomId }) {
    const { profileData, setProfileData } = useProfiles();

    return <div style={{ display: "flex", flexDirection: "column", alignItems: "start", gap: "0.5rem" }}>
        <label>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "start" }}>
                <div>
                    <input
                        type="checkbox"
                        checked={profileData.dijiangPlanner.roomSettings[roomId]?.firstPrio ?? true}
                        onChange={e => setProfileData(p => ({
                            ...p,
                            dijiangPlanner: {
                                ...p.dijiangPlanner,
                                roomSettings: {
                                    ...p.dijiangPlanner.roomSettings,
                                    [roomId]: { ...(p.dijiangPlanner.roomSettings[roomId] ?? {}), firstPrio: e.target.checked }
                                }
                            }
                        }))}
                    />
                    CN Prioritized First
                </div>
                <div style={{ fontSize: "0.8rem", textAlign: "start" }}>
                    Higher overall performance but may miss max performance on top 1-2 rooms.
                </div>
            </div>
        </label>
    </div>;
}

function MFGComponents({ roomId }) {
    const { profileData, setProfileData } = useProfiles();
    const options = Object.entries(roomData["MFG"].items).map(([id, item]) => ({ id: id, name: item.name }));

    return <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "0.5rem" }}>
        <ItemImageSelector
            value={profileData.dijiangPlanner.roomSettings[roomId]?.item}
            setValue={item => setProfileData(p => ({
                ...p,
                dijiangPlanner: {
                    ...p.dijiangPlanner,
                    roomSettings: {
                        ...p.dijiangPlanner.roomSettings,
                        [roomId]: { ...(p.dijiangPlanner.roomSettings[roomId] ?? {}), item: item }
                    }
                }
            }))}
            options={options}
            emptyComponent={"Select Product"}
        />
        {profileData.dijiangPlanner.roomSettings[roomId]?.item ?
            <div style={{ textAlign: "start", maxWidth: "10ch" }}>
                {roomData["MFG"].items[profileData.dijiangPlanner.roomSettings[roomId].item].name}
            </div> :
            null
        }
    </div>
}

function GCComponents({ roomId }) {
    const { profileData, setProfileData } = useProfiles();
    const options = Object.entries(roomData["GC"].items).map(([id, item]) => ({ id: id, name: item.name }));

    return <div style={{ display: "flex", flexDirection: "column" }}>
        {Array.from({ length: 3 }, (_, i) =>
            <ItemTextSelector
                key={i}
                value={profileData.dijiangPlanner.roomSettings[roomId]?.items?.[i]}
                setValue={item => setProfileData(p => ({
                    ...p,
                    dijiangPlanner: {
                        ...p.dijiangPlanner,
                        roomSettings: {
                            ...p.dijiangPlanner.roomSettings,
                            [roomId]: {
                                ...(p.dijiangPlanner.roomSettings[roomId] ?? {}),
                                items: (p.dijiangPlanner.roomSettings[roomId]?.items ?? [null, null, null]).map((it, ind) => ind === i ? item : it)
                            }
                        }
                    }
                }))}
                options={options}
            />
        )}
    </div>;
}

function RRComponents() {
    return <div style={{ display: "flex", flexDirection: "column", alignItems: "start", gap: "0.5rem" }}>
        <div style={{ fontSize: "0.8rem", textAlign: "start" }}>
            Assign a corresponding rate up operator if you want a specific clue.
        </div>
    </div>;
}

function Room({ id, assignment, options, setOperator, results }) {
    const type = id.split("-")[0];
    const { isDesktop } = useBreakpoint();

    const additionalComponents = useMemo(() => {
        if (type === "CN") return <CNComponents roomId={id} />
        if (type === "MFG") return <MFGComponents roomId={id} />
        if (type === "GC") return <GCComponents roomId={id} />
        if (type === "RR") return <RRComponents roomId={id} />;
    }, [id, type]);

    const resultsComponent = useMemo(() => {
        if (!results) return null;
        if (type === "CN")
            return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                <div>Work Time: {results["workTime"]}</div>
                <div>Global Break Time: {results["globalBreakTime"]}</div>
            </div>

        if (type === "MFG")
            return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                <div>Work Time: {results["workTime"]}</div>
                <div>Operator Uptime: {results["operatorUptime"]}</div>
                {"efficiency" in results ? <div>Avg. Efficiency: {results["efficiency"]}</div> : <div />}
                {"duration" in results ? <div>Duration per Item: {results["duration"]}</div> : <div />}
                {"xpPerSecond" in results ? <div>XP per Second: {results["xpPerSecond"]}</div> : <div />}
                {"xpPerHour" in results ? <div>XP per Hour: {results["xpPerHour"]}</div> : <div />}
            </div>

        if (type === "GC")
            return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                <div>Work Time: {results["workTime"]}</div>
                <div>Operator Uptime: {results["operatorUptime"]}</div>
                {"mineral" in results ? <div>Mineral Efficiency: {results["mineral"]}</div> : <div />}
                {results["items"]?.[0] ? <div>{results["items"][0].name} Time: {results["items"][0].duration}</div> : <div />}
                {"plant" in results ? <div>Plant Efficiency: {results["plant"]}</div> : <div />}
                {results["items"]?.[1] ? <div>{results["items"][1].name} Time: {results["items"][1].duration}</div> : <div />}
                {"fungus" in results ? <div>Fungus Efficiency: {results["fungus"]}</div> : <div />}
                {results["items"]?.[2] ? <div>{results["items"][2].name} Time: {results["items"][2].duration}</div> : <div />}
            </div>

        if (type === "RR")
            return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                <div>Work Time: {results["workTime"]}</div>
                <div>Operator Uptime: {results["operatorUptime"]}</div>
                {"efficiency" in results ? <div>Avg. Efficiency: {results["efficiency"]}</div> : <div />}
                {"duration" in results ? <div>Time per Clue: {results["duration"]}</div> : <div />}
            </div>
    }, [results, type]);

    const constructSelectorImage = (i, op) => {
        let tooltipParams = null;
        let styleOverride = null;
        if (op) {
            if (op.fixed) {
                tooltipParams = {
                    "data-tooltip-id": "dijiangPlannerTooltip",
                    "data-tooltip-content": "Fixed operator (assigned by user)"
                };
                styleOverride = { border: "2px #c4a83c solid", backgroundColor: "#3A2E0A" };
            } else if (op.filler) {
                tooltipParams = {
                    "data-tooltip-id": "dijiangPlannerTooltip",
                    "data-tooltip-content": "Filler operator (assigned due to lack of operators with skill bonuses)"
                };
                styleOverride = { border: "2px #c44a4a solid", backgroundColor: "#3A0A0A" };
            }
        }
        return <div key={i} style={{ width: "80px", height: "96px" }} {...tooltipParams}>
            <OperatorSelectorImage
                value={assignment[i]}
                setValue={v => setOperator(id, i, v)}
                options={options}
                styleOverride={styleOverride}
            />
        </div>
    }

    return <div style={{
        display: "flex", flexDirection: "column", alignItems: "start", minWidth: "310px", maxWidth: "440px", gap: "0.25rem", padding: "0.5rem",
        backgroundColor: roomData[type].background, border: `2px ${roomData[type].border} solid`, borderRadius: "0.5rem"
    }}>
        <h3 style={{ margin: "2px" }}>{roomData[type].name} ({id})</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", width: "100%" }}>
            <div style={{ display: "flex", flexDirection: isDesktop ? "row" : "column", gap: isDesktop ? "0.25rem" : "0.5rem", alignItems: "center", width: "100%" }}>
                <div style={{ display: "flex", flexDirection: "row", gap: "0.2rem" }}>
                    {Array.from({ length: 3 }, (_, i) => constructSelectorImage(i, assignment[i]))}
                </div>
                {additionalComponents}
            </div>
            {resultsComponent}
        </div>
    </div>
}

export default function RoomsSection({ operatorsData, available }) {
    const { profileData, setProfileData } = useProfiles();

    const options = useMemo(() => available.map(id => ({ id: id, name: operatorsData[id].name })), [available, operatorsData]);
    const [results, setResults] = useState(null);

    const setFixedOperator = (roomId, index, operatorId) => {
        setProfileData(p => ({
            ...p,
            dijiangPlanner: {
                ...p.dijiangPlanner,
                roomAssignments: {
                    ...p.dijiangPlanner.roomAssignments,
                    [roomId]: p.dijiangPlanner.roomAssignments[roomId].map((assignment, i) =>
                        index === i ? (operatorId ? { id: operatorId, fixed: true } : null) : assignment
                    )
                }
            }
        }))
    }

    const prioOpt = profileData.dijiangPlanner.settings.prio ?? "Equal";
    const alignOpt = profileData.dijiangPlanner.settings.align ?? "Staggered";

    const handleOptimize = () => {
        const newAssignment = optimizeOperators(operatorsData, profileData, available);
        setProfileData(p => ({
            ...p,
            dijiangPlanner: {
                ...p.dijiangPlanner,
                roomAssignments: newAssignment
            }
        }));
    }

    const handleClearAssignedOperators = (includeFixed = false) => {
        setProfileData(p => {
            const newAssignment = Object.entries(p.dijiangPlanner.roomAssignments).reduce((acc, [id, assign]) => {
                acc[id] = assign.map(operator => {
                    if (!operator || includeFixed) return null;
                    if (operator.fixed) return operator;
                    return null;
                });
                return acc;
            }, {});

            return {
                ...p,
                dijiangPlanner: {
                    ...p.dijiangPlanner,
                    roomAssignments: newAssignment
                }
            }
        });
    }

    useEffect(() => {
        setResults(computeProductivity(operatorsData, profileData));
    }, [operatorsData, profileData]);

    return <div style={{ border: "1px #aaa solid", borderRadius: "0.5rem", padding: "0.5rem" }}>
        <div style={{ display: "flex", flexDirection: "column", paddingBottom: "0.5rem" }}>
            <div style={{ padding: "0.2rem", maxWidth: "450px" }}>
                You can assign fixed operators if you want to force them to a specific room.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", alignItems: "center", justifyItems: "start", gap: "0.25rem" }}>
                <button style={{ gridColumn: "span 2", width: "100%" }} onClick={handleOptimize}>
                    Optimize Operators
                </button>
                <button style={{ width: "100%" }} onClick={() => handleClearAssignedOperators()}>
                    Clear Non-fixed Operators
                </button>
                <button style={{ width: "100%" }} onClick={() => handleClearAssignedOperators(true)}>
                    Clear All Operators
                </button>
                <div style={{ justifySelf: "end" }}>Room Prioritization:</div>
                <select
                    name="prioritization"
                    id="prioritization"
                    value={prioOpt}
                    onChange={e => setProfileData(p => ({
                        ...p,
                        dijiangPlanner: {
                            ...p.dijiangPlanner,
                            settings: { ...p.dijiangPlanner.settings, prio: e.target.value }
                        }
                    }))}
                >
                    {Object.keys(priorityOptions).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <div
                    data-tooltip-id={"dijiangPlannerTooltip"}
                    data-tooltip-content={"Determines when operators are assigned to work in the room.\nStaggered - Operators assigned one at a time to ensure the room is never unmanned. Assumes work times are equally spaced out and is perferred in most cases.\nAligned - Operators all start and stop working at the same time. Room becomes inactive during break time. Optimal if bonuses become very large."}
                    style={{ borderBottom: "1px #aaa dotted", justifySelf: "end" }}
                >
                    Operator Alignment:
                </div>
                <select
                    name="alignment"
                    id="alignment"
                    value={alignOpt}
                    onChange={e => setProfileData(p => ({
                        ...p,
                        dijiangPlanner: {
                            ...p.dijiangPlanner,
                            settings: { ...p.dijiangPlanner.settings, align: e.target.value }
                        }
                    }))}
                >
                    {alignmentOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {Object.entries(profileData.dijiangPlanner.roomAssignments).map(([id, assignment]) =>
                <Room key={id} id={id} assignment={assignment} options={options} setOperator={setFixedOperator} results={results ? results[id] : null} />
            )}
        </div>
    </div>

}