import { Handle, Position } from '@xyflow/react';
import Trigger from './Trigger';

export default function TriggerNode({ data }) {
    const style = {
        padding: 8,
        borderRadius: 20,
        border: data.selected ? '1px solid #4ade80' : (data.highlighted ? '1px solid rgba(250, 204, 21, 0.5)' : '1px solid #aaa'),
        background: data.highlighted ? "rgba(250, 204, 21, 0.1)" : null,
        fontSize: 12,
    };

    const classNames = ["node"];
    if (data.inSelect) classNames.push("node-incoming");
    if (data.outSelect) classNames.push("node-outgoing");

    return <div style={style} className={classNames.join(" ")}>
        <Trigger id={data.id} />

        <Handle type="target" position={Position.Left} />
        <Handle type="source" position={Position.Right} />
    </div>;
}
