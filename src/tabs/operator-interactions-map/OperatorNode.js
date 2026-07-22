import { useOperators, useSkills } from '../../DataProvider';
import { OperatorImage } from '../../components/ImageHandler';

export default function OperatorNode({ data }) {
    const [operators, operatorsLoading] = useOperators();
    const [skills, skillsLoading] = useSkills();

    if (operatorsLoading || skillsLoading) return <div />;
    const opName = skills[data.id].name ?? operators[data.id].name;
    const opId = skills[data.id].opId ?? data.id;

    const style = {
        padding: "0.25rem",
        borderRadius: 12,
        border: data.highlighted ? '2px solid rgba(250, 204, 21, 0.5)' : '2px solid #aaa',
        background: data.highlighted ? "rgba(250, 204, 21, 0.1)" : null,
        minWidth: 140,
        height: 230,
    };

    return <div style={style}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <OperatorImage id={opId} width={60} height={72} />
            {opName}
        </div>

        {/* <Handle type="target" position={Position.Left} />
        <Handle type="source" position={Position.Right} /> */}
    </div>
}
