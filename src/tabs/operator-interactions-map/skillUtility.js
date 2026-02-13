import Trigger from "./Trigger";

function renderSkillDesc(desc, triggersMapping) {
    const parts = [];
    let lastIndex = 0;

    const regex = /\{([^}]+)\}/g;
    let match;

    while ((match = regex.exec(desc)) !== null) {
        const [full, token] = match;

        if (match.index > lastIndex) {
            parts.push(desc.slice(lastIndex, match.index));
        }

        if (token in triggersMapping) {
            parts.push(<Trigger id={triggersMapping[token]} />);
        } else {
            parts.push(full);
        }

        lastIndex = regex.lastIndex;
    }

    if (lastIndex < desc.length) {
        parts.push(desc.slice(lastIndex));
    }

    return <span style={{display: "inline", lineHeight: "1.3"}}>
        {parts}
    </span>;
}

export { renderSkillDesc };