import { useMemo, useRef, useState } from "react";
import ReactSelect from "react-select";
import * as Select from "@radix-ui/react-select";
import "./Selector.css";
import { ItemImage } from "./ImageHandler";
import { selectStyle } from "../styles";

function ItemTextSelector({ value, setValue, options }) {
    const finalOptions = useMemo(() => options.map(item => ({
        label:
            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", textAlign: "start" }}>
                <ItemImage id={item.id} width={32} height={32} />
                {item.name}
            </div>,
        value: item.id
    })), [options]);
    const optionsMapped = useMemo(() => finalOptions.reduce((acc, opt) => { acc[opt.value] = opt; return acc; }, {}), [finalOptions]);

    return <ReactSelect
        options={finalOptions}
        value={optionsMapped[value]}
        onChange={opt => setValue(opt ? opt.value : null)}
        styles={selectStyle}
        isClearable={true}
    />
}

function ItemImageSelector({ value, setValue, options, styleOverride }) {
    const [filter, setFilter] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef(null);

    const filtered = useMemo(() => {
        if (!filter) return options;
        return options.filter((opt) =>
            opt.name.toLowerCase().includes(filter.toLowerCase())
        );
    }, [filter, options]);  

    const handleOpenChange = (open) => {
        setIsOpen(open);
        setFilter("");
    }

    return (
        <Select.Root value={value} onValueChange={v => setValue(v)} open={isOpen} onOpenChange={handleOpenChange}>
            <Select.Trigger className="select-trigger" ref={triggerRef} style={{ height: "80px", ...styleOverride }}>
                {value ? <ItemImage id={value} width={80} height={80} /> : null}
            </Select.Trigger>

            <Select.Portal>
                <Select.Content className="select-content" position="popper" style={{ width: null }}>
                    <div style={{ paddingBottom: "0.2rem" }}>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>

                    <Select.Viewport>
                        <div className="select-grid">
                            {filtered.map((option) =>
                                <Select.Item key={option.id} value={option.id} className="select-item">
                                    <div className="item-inner">
                                        <ItemImage id={option.id} width={80} height={80} />
                                        {option.name}
                                    </div>
                                </Select.Item>
                            )}
                            {value ? <Select.Item key={"cancel"} value={null} className="select-item">
                                <div className="item-inner" style={{ color: "#ff4848", fontSize: "2rem", fontWeight: "bold" }}>
                                    ✕
                                </div>
                            </Select.Item> : null}
                        </div>
                        {filtered.length > 10 ? <div className="select-fade-bottom" > ▼ </div> : null}
                    </Select.Viewport>
                </Select.Content>
            </Select.Portal>
        </Select.Root>
    );
}

export { ItemTextSelector, ItemImageSelector };