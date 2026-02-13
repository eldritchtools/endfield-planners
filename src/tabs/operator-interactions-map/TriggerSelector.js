import { useMemo } from "react";
import Select from "react-select";
import { useTriggers } from "../../DataProvider";
import { selectStyle } from "../../styles";
import Trigger from "./Trigger";

export default function TriggerSelector({ value, setValue }) {
    const [triggers, triggersLoading] = useTriggers();

    const optionsMapped = useMemo(() => triggersLoading ? {} :
        Object.entries(triggers).reduce((acc, [id, op]) => {
            acc[id] = {
                label: <div style={{display: "flex"}}><Trigger id={id} /></div>,
                value: id,
                name: op.name
            };
            return acc;
        }, {}),
        [triggers, triggersLoading]
    )

    const optionsFinal = useMemo(() => 
        Object.values(optionsMapped).sort((a, b) => a.value.localeCompare(b.value)), [optionsMapped]
    );

    const filterFunc = (candidate, input) => {
        if(!input || input.length === 0) return true;
        return candidate.data.name.toLowerCase().includes(input.toLowerCase());
    }

    return <Select
        options={optionsFinal}
        value={value ? optionsMapped[value] : value}
        onChange={opt => setValue(opt ? opt.value : opt)}
        filterOption={filterFunc}
        styles={selectStyle}
    />
}
