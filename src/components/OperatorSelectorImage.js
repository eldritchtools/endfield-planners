import { useMemo, useRef, useState } from "react";
import * as Select from "@radix-ui/react-select";
import "./Selector.css";
import { OperatorImage } from "./ImageHandler";

export default function OperatorSelectorImage({ value, setValue, options, styleOverride }) {
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
        <Select.Root value={value ? value.id : null} onValueChange={null} open={isOpen} onOpenChange={handleOpenChange}>
            <Select.Trigger className="select-trigger" ref={triggerRef} style={{ height: "98px", ...styleOverride }}>
                {value ? <OperatorImage id={value.id} width={80} height={96} /> : null}
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
                                <Select.Item key={option.id} value={option.id} className="select-item" onPointerUp={() => setValue(option.id)}>
                                    <div className="item-inner">
                                        <OperatorImage id={option.id} width={80} height={96} />
                                        {option.name}
                                    </div>
                                </Select.Item>
                            )}
                            {value ? <Select.Item key={"cancel"} value={null} className="select-item" onPointerUp={() => setValue(null)}>
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