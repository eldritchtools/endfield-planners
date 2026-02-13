import { Handle, Position } from '@xyflow/react';
import { useSkills } from '../../DataProvider';
import "./GraphView.css";

export default function SkillNode({ data }) {
    const [skills, skillsLoading] = useSkills();

    if (skillsLoading) return <div />

    const style = {
        padding: "0.1rem 0.25rem",
        borderRadius: 12,
        border: data.selected ? '2px solid #4ade80' : '2px solid #aaa',
        fontSize: "0.8rem",
        width: "140px",
        height: "30px",
        boxShadow: ""
    };

    const classNames = ["node"];
    if(data.inSelect) classNames.push("node-incoming");
    if(data.outSelect) classNames.push("node-outgoing");

    return <div
        data-tooltip-id="operatorInteractionsMapSkills"
        data-tooltip-content={data.id}
        style={style}
        className={classNames.join(" ")}
    >
        <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {skills[data.opId][data.type].name}
            </span>
            <span style={{ color: "#999", fontStyle: "italic" }}>
                ({data.type.charAt(0).toUpperCase() + data.type.slice(1)})
            </span>
        </div>

        <Handle type="target" position={Position.Left} />
        <Handle type="source" position={Position.Right} />
    </div>;
}
