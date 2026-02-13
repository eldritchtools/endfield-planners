import { useMemo } from "react";
import { OperatorImage } from "./ImageHandler";
import Select from "react-select";
import { selectStyle } from "../styles";
import { useOperators } from "../DataProvider";

export default function OperatorSelectorText({ value, setValue, options }) {
    const [operators, operatorsLoading] = useOperators();

    const optionsMapped = useMemo(() => 
        operatorsLoading ?
        {} :
        options.reduce((acc, id) => {
            acc[id] = {
                label: <div style={{display: "flex", alignItems: "center", gap: "0.2rem"}}>
                        <OperatorImage id={id} width={20} height={24} />
                        {operators[id].name}
                    </div>,
                value: id,
                name: operators[id].name
            };
            return acc;
        }, {}),
        [options, operators, operatorsLoading]
    );

    const optionsFinal = useMemo(() => 
        Object.values(optionsMapped).sort((a, b) => a.value.localeCompare(b.value)), [optionsMapped]
    );

    const filterFunc = (candidate, input) => {
        if(!input || input.length === 0) return true;
        return candidate.data.name.toLowerCase().includes(input.toLowerCase());
    }

    return <Select
        isClearable={true}
        options={optionsFinal}
        value={value ? optionsMapped[value] : value}
        onChange={opt => setValue(opt ? opt.value : opt)}
        filterOption={filterFunc}
        styles={selectStyle}
    />
}
