import { Link } from "react-router-dom";


const linkStyle = { color: "#ddd", fontWeight: "bold", textDecoration: "none" }

function LinkComponent({ href, children }) {
    return <Link to={href} style={linkStyle}>{children}</Link>;
}

export default function HomeTab() {
    return <div style={{ marginTop: "2rem", textAlign: "start" }}>
        Select a tool below or from the sidebar to get started.
        <br /> <br />
        <LinkComponent href={"/dijiang-planner"}>Dijiang Planner</LinkComponent> - Plan out and optimize operator assignments in Dijiang rooms.
        <br /> <br />
        <LinkComponent href={"/pull-calculator"}>Pull Calculator</LinkComponent> - Compute rates for banner pulls
        <br /> <br />
        <LinkComponent href={"/operator-interactions-map"}>Operator Interactions Map</LinkComponent> - View combos or interactions between operators.
    </div>
}