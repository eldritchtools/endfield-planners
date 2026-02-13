import Modal from "../../components/Modal";

function CharteredModal() {
    return <div style={{ display: "flex", flexDirection: "column", textAlign: "start", lineHeight: "1.3" }}>
        The following is the list of mechanics used by this calculator for the Chartered Banner. They are split between mechanics that are either explicitly stated in the game or confirmed by experience and mechanics that are assumed due to the lack of information.
        <br /> <br />
        Mechanics that are explicitly stated in the game or confirmed from experience:
        <ul>
            <li>Base rates are 0.8% for 6★, 8% for 5★, and 91.2% for 4★. Any 6★ pulled has a 50% chance to be featured.</li>
            <li>After 65 consecutive non-6★ pulls, every succeeding pull has an additional 5% chance to be 6★. The 80th pull is guaranteed to be a 6★. This counter is carried over from previous banners.</li>
            <li>After 9 consecutive 4★ pulls, the next pull is guaranteed to be at least a 5★. This counter is carried over from previous banners.</li>
            <li>At 30 pulls, a free 10 pull with base rates is given. The 10 pull is guaranteed to have at least one 5★. The 10 pull is independent of the banner's counters, so it's not affected by pity, but it also does not reset pity counters when hitting a 6★. This counter is reset at the start of each banner.</li>
            <li>At 120 pulls, if the featured 6★ has not been obtained, the 120th pull is guaranteed to be the featured 6★. This counter is reset at the start of each banner.</li>
            <li>Every 240 pulls, a free copy of the 6★ is given. This copy is independent of the actual pulls and the pity counters on the banner. This counter is reset at the start of each banner.</li>
        </ul>
        Mechanics that are assumed due to the lack of information:
        <ul>
            <li>During soft pity, the rate for 5★ remains at 8%. The final rates at the nth soft pity pull is (5n+0.8)% for 6★, 8% for 5★, and (91.2-5n)% for 4★.</li>
            <li>The free 10 pull at 30 pulls is computed as 9 pulls with base rates and 1 pull with 0.8% 6★ rate and 99.2% 5★ rate.</li>
        </ul>
    </div>
}

function BasicModal() {
    return <div style={{ display: "flex", flexDirection: "column", textAlign: "start", lineHeight: "1.3" }}>
        The following is the list of mechanics used by this calculator for the Basic Banner. They are split between mechanics that are either explicitly stated in the game or confirmed by experience and mechanics that are assumed due to the lack of information.
        <br /> <br />
        Mechanics that are explicitly stated in the game or confirmed from experience:
        <ul>
            <li>Base rates are 0.8% for 6★, 8% for 5★, and 91.2% for 4★. Any 6★ pulled has a 50% chance to be featured.</li>
            <li>After 65 consecutive non-6★ pulls, every succeeding pull has an additional 5% chance to be 6★. The 80th pull is guaranteed to be a 6★. This counter is carried over from previous banners.</li>
            <li>After 9 consecutive 4★ pulls, the next pull is guaranteed to be at least a 5★. This counter is carried over from previous banners.</li>
            <li>At 300 pulls, a free 6★ of choice is given. This copy is independent of the actual pulls and the pity counters on the banner. </li>
        </ul>
        Mechanics that are assumed due to the lack of information:
        <ul>
            <li>During soft pity, the rate for 5★ remains at 8%. The final rates at the nth soft pity pull is (5n+0.8)% for 6★, 8% for 5★, and (91.2-5n)% for 4★.</li>
        </ul>
    </div>
}

function ArsenalModal() {
    return <div style={{ display: "flex", flexDirection: "column", textAlign: "start", lineHeight: "1.3" }}>
        The following is the list of mechanics used by this calculator for the Arsenal Banner. They are split between mechanics that are either explicitly stated in the game or confirmed by experience and mechanics that are assumed due to the lack of information.
        <br /> <br />
        Mechanics that are explicitly stated in the game or confirmed from experience:
        <ul>
            <li>Base rates are 4% for 6★, 15% for 5★, and 81% for 4★. Any 6★ pulled has a 25% chance to be featured. There are 6 non-featured 6★ each of which has a 12.5% chance.</li>
            <li>Each pull rewards 10 weapons with at least one weapon being at least a 5★.</li>
            <li>After 3 pulls without a 6★, the next pull is guaranteed to have a 6★.</li>
            <li>Starting the 10th pull and every 8th pull after that, a bonus 6★ is rewarded. This is independent of the actual pull and pity counters on the banner. The rewarded 6★ alternates between a 6★ of choice from the nonfeatured options on the 10th, 26th, and so on and the featured 6★ on the 18th, 34th, and so on.</li>
        </ul>
        Mechanics that are assumed due to the lack of information:
        <ul>
            <li>At the 8th pull, if the featured 6★ has not yet been obtained, it is guaranteed to drop in that pull. This may not accurately represent what's written in-game since it could also be interpreted as a pity on 8 consecutive pulls without the featured 6★.</li>
            <li>The 10 pulls are independently rolled from each other. If this is a guaranteed pity pull, the 10 weapons are checked whether it contains a 6★ (or the featured one at the 8th). If one does not exist, a 4★ is upgraded. If this is a non-pity pull, the 10 weapons are checked whether it contains a 5★ or 6★. If one does not exist, a 4★ is upgraded to a 5★.</li>
        </ul>
    </div>
}

export default function MechanicsModal({ isOpen, setIsOpen, activeBanner }) {
    return <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        {activeBanner === "Chartered" ?
            <CharteredModal /> :
            activeBanner === "Basic" ?
                <BasicModal /> :
                activeBanner === "Arsenal" ?
                    <ArsenalModal /> :
                    null
        }
    </Modal>
}