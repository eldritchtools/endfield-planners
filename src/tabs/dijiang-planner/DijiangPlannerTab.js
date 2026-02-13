import { useBreakpoint, useProfiles } from "@eldritchtools/shared-components"
import { useMemo, useState } from "react";
import { Tooltip } from 'react-tooltip';
import { tooltipStyle } from "../../styles";
import OperatorsTable from "./OperatorsTable";
import RoomsSection from "./RoomsSection";
import { useBaseSkills, useOperators } from "../../DataProvider";

export default function DijiangPlannerTab() {
    const { isDesktop } = useBreakpoint();
    const [operators, operatorsLoading] = useOperators();
    const [baseSkills, baseSkillsLoading] = useBaseSkills();
    const { profileData } = useProfiles();
    const [loading, setLoading] = useState(true);

    const operatorsData = useMemo(() => {
        if(operatorsLoading || baseSkillsLoading) return {};
        return Object.entries(baseSkills).reduce((acc, [id, skills]) => {
            acc[id] = {...skills, ...operators[id]};
            return acc;
        }, {});
    }, [operators, baseSkills, operatorsLoading, baseSkillsLoading]);

    const [available, fixed, disabled] = useMemo(() => {
        if (Object.keys(operatorsData).length === 0) return [[], [], []];

        const fixedSet = Object.entries(profileData.dijiangPlanner.roomAssignments).reduce((acc, [_, list]) => {
            list.forEach(op => {
                if (!op || !op.fixed) return;
                acc.add(op.id);
            })
            return acc;
        }, new Set());

        const disabledSet = Object.keys(operatorsData).reduce((acc, id) => {
            if (profileData.operators[id]?.disabled) acc.add(id);
            return acc;
        }, new Set());

        const available = Object.keys(operatorsData).filter(x => !fixedSet.has(x) && !disabledSet.has(x));
        const fixed = Array.from(fixedSet).sort();
        const disabled = Array.from(disabledSet).sort();
        setLoading(false);
        return [available, fixed, disabled];
    }, [operatorsData, profileData.dijiangPlanner.roomAssignments, profileData.operators])

    if (loading)
        return <div>
            Loading...
        </div>

    return <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <h2 style={{ marginBottom: 0 }}>Dijiang Planner</h2>
        <p style={{ textAlign: "start", maxWidth: "1000px", lineHeight: "1.3" }}>
            Find the best assignment of operators to Dijiang Rooms based on your specific needs and circumstances.
            <br /> <br />
            A few relevant notes:
            <br />
            - The optimize feature is a heuristic based solution. It is likely to be optimal or close to optimal within the set parameters for most cases, but is not guaranteed to be perfect.
            <br />
            - The computed numbers here will never match those displayed in-game because the game only shows numbers based on the operators currently working in the room, while the numbers here attempt to compute the average over time.
            <br />
            - Consider the numbers displayed as slightly optimistic, though I tried to make them as accurate as possible to the best of my abilities. They are unlikely to be exact due to factors that are difficult to control (e.g. break times of Control Nexus operators are ignored because it's practically impossible to know how they align with the break times of operators in the other rooms.).
            <br />
            - All numbers used in computations were obtained by experimenting in the game myself. Any errors can be reported in my Discord.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", padding: isDesktop ? "1rem" : 0, justifyContent: "center" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
                <h3 style={{ margin: "2px" }}>Available Operators</h3>
                <OperatorsTable operatorsData={operatorsData} available={available} fixed={fixed} disabled={disabled} />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
                <h3 style={{ margin: "2px" }}>Dijiang Rooms</h3>
                <RoomsSection operatorsData={operatorsData} available={available} />
            </div>

        </div>
        <Tooltip id={"dijiangPlannerTooltip"} render={({ content }) => <div style={{ whiteSpace: "pre-wrap" }}>{content}</div>} style={tooltipStyle} />
    </div>
}