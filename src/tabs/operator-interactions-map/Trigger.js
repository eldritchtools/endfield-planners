import { IconImage } from "../../components/ImageHandler";
import { useTriggers } from "../../DataProvider";

export default function Trigger({ id }) {
    const [triggers, triggersLoading] = useTriggers();

    if (triggersLoading) return null;

    const trigger = triggers[id];
    return <span style={{ display: "inline-flex", alignItems: "center", verticalAlign: "middle", textAlign: "start" }}>
        {trigger.icon ? <IconImage id={id} width={16} height={16} /> : null}
        <span style={{ color: trigger.color }}>{trigger.name}</span>
    </span>
}