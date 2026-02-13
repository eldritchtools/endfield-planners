import { useProfiles } from "@eldritchtools/shared-components";
import { BaseIconImage, OperatorImage } from "../../components/ImageHandler";
import { useState } from "react";

function LevelIndicator({ value, setValue }) {
    const boxStyle = {
        width: "1.25rem",
        height: "1.25rem",
        borderRadius: "4px",
        border: "1px #aaa solid",
        transition: "background 0.25s ease"
    }

    const buttonStyle = {
        fontSize: "0.8rem",
        padding: "4px 6px"
    }

    return <div style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
        <button onClick={() => setValue(Math.max(0, value - 1))} style={buttonStyle} disabled={value === 0}>◀</button>
        <div style={{ ...boxStyle, background: value >= 1 ? "#facc15" : null }} />
        <div style={{ ...boxStyle, background: value >= 2 ? "#facc15" : null }} />
        <button onClick={() => setValue(Math.min(2, value + 1))} style={buttonStyle} disabled={value === 2}>▶</button>
    </div>
}

export default function OperatorsTable({ operatorsData, available, fixed, disabled, maxHeight }) {
    const { profileData, setProfileData } = useProfiles();
    const [searchString, setSearchString] = useState("");

    const stickyHeaderStyle = { position: "sticky", top: 0, background: "#333", padding: "0.25rem", zIndex: 1 };
    const baseIconTypeMapping = {
        "mood drain": "mood drain",
        "mood regen": "mood regen",
        "clue efficiency": "efficiency",
        "clue rate up": "clue up",
        "operator xp": "efficiency",
        "weapon xp": "efficiency",
        "mineral": "mineral",
        "fungus": "fungus",
        "plant": "plant"
    };

    const constructRow = (id, background = null, isFixed = false) => {
        const data = operatorsData[id];
        return <tr key={id} style={{ borderTop: "1px #777 solid", background: background }}>
            <td>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0.1rem" }}>
                    <OperatorImage id={id} width={80} height={96} />
                    {data.name}
                </div>
            </td>
            <td>
                <div
                    data-tooltip-id={"dijiangPlannerTooltip"}
                    data-tooltip-content={`${data.baseSkills[0].texts[0]}\n${data.baseSkills[0].texts[1]}`}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0.1rem" }}
                >
                    <div style={{ display: "flex" }}>
                        <BaseIconImage id={data.baseSkills[0].room} />
                        <BaseIconImage id={`${data.baseSkills[0].room}-${baseIconTypeMapping[data.baseSkills[0].type]}`} />
                    </div>
                    {data.baseSkills[0].room}-{data.baseSkills[0].type}
                    <LevelIndicator
                        value={id in profileData.dijiangPlanner.operatorSkills ?
                            profileData.dijiangPlanner.operatorSkills[id][0] : 2
                        }
                        setValue={level => setProfileData(p => ({
                            ...p,
                            dijiangPlanner: {
                                ...p.dijiangPlanner,
                                operatorSkills: {
                                    ...p.dijiangPlanner.operatorSkills,
                                    [id]: (p.dijiangPlanner.operatorSkills[id] ?? [2, 2]).map((v, i) => i === 0 ? level : v)
                                }
                            }
                        }))}
                    />
                </div>
            </td>
            <td>
                <div
                    data-tooltip-id={"dijiangPlannerTooltip"}
                    data-tooltip-content={`${data.baseSkills[1].texts[0]}\n${data.baseSkills[1].texts[1]}`}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0.1rem" }}
                >
                    <div style={{ display: "flex" }}>
                        <BaseIconImage id={data.baseSkills[1].room} />
                        <BaseIconImage id={`${data.baseSkills[1].room}-${baseIconTypeMapping[data.baseSkills[1].type]}`} />
                    </div>
                    {data.baseSkills[1].room}-{data.baseSkills[1].type}
                    <LevelIndicator
                        value={id in profileData.dijiangPlanner.operatorSkills ?
                            profileData.dijiangPlanner.operatorSkills[id][1] : 2
                        }
                        setValue={level => setProfileData(p => ({
                            ...p,
                            dijiangPlanner: {
                                ...p.dijiangPlanner,
                                operatorSkills: {
                                    ...p.dijiangPlanner.operatorSkills,
                                    [id]: (p.dijiangPlanner.operatorSkills[id] ?? [2, 2]).map((v, i) => i === 1 ? level : v)
                                }
                            }
                        }))}
                    />
                </div>
            </td>
            <td>
                {isFixed ? null : (
                    profileData.operators[id]?.disabled ?
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <button
                                data-tooltip-id={"dijiangPlannerTooltip"}
                                data-tooltip-content={`Enable to allow ${data.name} to be assigned to a room.`}
                                onClick={() => setProfileData(p => {
                                    const { disabled, ...rest } = p.operators[id];
                                    return { ...p, operators: { ...p.operators, [id]: rest } }
                                })}
                                style={{ color: "#48ff48", fontSize: "1.25rem", fontWeight: "bold" }}
                            >
                                +
                            </button>
                        </div> :
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <button
                                data-tooltip-id={"dijiangPlannerTooltip"}
                                data-tooltip-content={`Disable to prevent ${data.name} from being assigned to a room.`}
                                onClick={() => setProfileData(p => ({
                                    ...p,
                                    operators: {
                                        ...p.operators,
                                        [id]: { ...(p.operators[id] ?? {}), disabled: true }
                                    }
                                }))}
                                style={{ color: "#ff4848", fontSize: "1.25rem", fontWeight: "bold" }}
                            >
                                x
                            </button>
                        </div>
                )}
            </td>
        </tr>
    }

    const filterFunc = id => {
        if (searchString.trim().length === 0) return true;
        return operatorsData[id].name.toLowerCase().includes(searchString.toLowerCase());
    }

    return <div style={{ height: "1250px", overflowY: "auto", border: "1px #aaa solid", borderRadius: "0.5rem" }}>
        <div style={{padding: "0.2rem", maxWidth: "420px"}}>
        You can disable operators from being assigned or lower their skill levels. 
        </div>
        <div style={{display: "flex", gap: "0.2rem", alignItems: "center", paddingLeft: "0.5rem"}}>
            Search:
            <input value={searchString} onChange={e => setSearchString(e.target.value)} />
        </div>
        <table style={{ borderCollapse: "collapse" }}>
            <thead>
                <tr>
                    <th style={stickyHeaderStyle}>Operator</th>
                    <th style={stickyHeaderStyle}>Skill 1</th>
                    <th style={stickyHeaderStyle}>Skill 2</th>
                    <th style={stickyHeaderStyle}>Disable?</th>
                </tr>
            </thead>
            <tbody>
                {available.filter(filterFunc).map(id => constructRow(id))}
                {fixed.filter(filterFunc).map(id => constructRow(id, "#3A2E0A", true))}
                {disabled.filter(filterFunc).map(id => constructRow(id, "#3A0D0D"))}
            </tbody>
        </table>
    </div>
}