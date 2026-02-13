import { Tooltip } from "react-tooltip";
import { tooltipStyle } from "../../styles";
import { useSkills, useTriggers } from "../../DataProvider";
import { useMemo } from "react";
import { renderSkillDesc } from "./skillUtility";

function TooltipContent({ id, triggers }) {
    const [skills, skillsLoading] = useSkills();

    if (!id || skillsLoading) return <div />

    const [opId, type] = id.split("|");
    return <div style={{ display: "flex", flexDirection: "column", maxWidth: "500px", whiteSpace: "pre-wrap" }}>
        <strong style={{ textAlign: "center", marginBottom: "5px" }}>
            {skills[opId][type].name}
        </strong>
        <span style={{ textAlign: "start" }}>
            {renderSkillDesc(skills[opId][type].description, triggers)}
        </span>
    </div>
}

export default function SkillTooltip() {
    const [triggers, triggersLoading] = useTriggers();

    const triggersMapping = useMemo(() => triggersLoading ?
        null :
        Object.entries(triggers).reduce((acc, [id, trigger]) => {
            acc[trigger.name] = id;
            if ("alts" in trigger) trigger.alts.forEach(alt => { acc[alt] = id; });
            return acc;
        }, {}),
        [triggers, triggersLoading]
    );

    if (triggersLoading) return null;

    return <Tooltip
        id={"operatorInteractionsMapSkills"}
        render={({ content }) => <TooltipContent id={content} triggers={triggersMapping} />}
        style={tooltipStyle}
    />
}