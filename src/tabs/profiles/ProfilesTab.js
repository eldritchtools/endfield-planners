import { useMemo, useState, useRef } from "react";

import { useProfiles } from "@eldritchtools/shared-components";
import { OperatorImage } from "../../components/ImageHandler";
import Modal from "../../components/Modal";
import { useOperators } from "../../DataProvider";

function ProfilesPanel() {
    const { profiles, currentProfile, addProfile, switchProfile, copyProfile, deleteProfile, exportProfile, importProfile } = useProfiles();
    const [selected, setSelected] = useState(null);
    const [addProfileIsOpen, setAddProfileIsOpen] = useState(false);
    const [copyProfileIsOpen, setCopyProfileIsOpen] = useState(false);
    const [deleteProfileIsOpen, setDeleteProfileIsOpen] = useState(false);
    const [exportProfileIsOpen, setExportProfileIsOpen] = useState(false);
    const [importProfileIsOpen, setImportProfileIsOpen] = useState(false);
    const [name, setName] = useState("");
    const [dataString, setDataString] = useState("");
    const textAreaRef = useRef(null);
    const [copySuccess, setCopySuccess] = useState('');

    const handleSwitchProfileButton = () => {
        if (!selected) return;
        switchProfile(selected).catch(err => {
            console.error(err.message);
        });
    }

    const handleCopyProfileButton = () => {
        if (!selected) return;
        setCopyProfileIsOpen(true);
    }

    const handleDeleteProfileButton = () => {
        if (!selected) return;
        setDeleteProfileIsOpen(true);
    }

    const handleExportProfileButton = () => {
        if (!selected) return;
        exportProfile(selected).then(data => setDataString(data));
        setExportProfileIsOpen(true);
    }

    const handleImportProfileButton = () => {
        setImportProfileIsOpen(true);
    }


    const closeAddProfile = () => {
        setAddProfileIsOpen(false);
        setName("");
    }

    const closeCopyProfile = () => {
        setCopyProfileIsOpen(false);
        setName("");
    }

    const closeExportProfile = () => {
        setExportProfileIsOpen(false);
        setDataString("");
    }

    const closeImportProfile = () => {
        setImportProfileIsOpen(false);
        setName("");
        setDataString("");
    }

    const handleAddProfile = () => {
        addProfile(name).catch(err => {
            console.error(err.message);
        });
        setName("");
        setAddProfileIsOpen(false);
    }

    const handleCopyProfile = () => {
        copyProfile(selected, name).catch(err => {
            console.error(err.message);
        });
        setName("");
        setCopyProfileIsOpen(false);
    }

    const handleDeleteProfile = () => {
        deleteProfile(selected).catch(err => {
            console.error(err.message);
        });
        setDeleteProfileIsOpen(false);
    }

    const handleImportProfile = () => {
        importProfile(name, dataString);
        setImportProfileIsOpen(false);
        setName("");
        setDataString("");
    }

    const handleCopy = async () => {
        if (textAreaRef.current) {
            try {
                await navigator.clipboard.writeText(textAreaRef.current.value);
                setCopySuccess('Copied!');
                setTimeout(() => setCopySuccess(''), 2000);
            } catch (err) {
                setCopySuccess('Failed to copy!');
                console.error('Failed to copy text: ', err);
            }
        }
    };

    return <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
        <div style={{ display: "flex", width: "50%", height: "5rem", justifyContent: "center", overflowY: "scroll", border: "1px #aaa solid" }}>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "start", width: "100%", height: "100%" }}>
                {profiles.map(profile => {
                    return <div style={selected === profile ? { background: "rgba(255, 255, 255, 0.25)" } : {}} onClick={() => setSelected(profile)}>
                        {profile}
                    </div>
                })}
            </div>
        </div>
        <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: "0.25rem" }}>
            <button onClick={() => setAddProfileIsOpen(true)}>Create New Profile</button>
            <button onClick={handleSwitchProfileButton}>Switch to Selected Profile</button>
            <button onClick={handleCopyProfileButton}>Copy Selected Profile</button>
            <button onClick={handleDeleteProfileButton}>Delete Selected Profile</button>
            <button onClick={handleExportProfileButton}>Export Selected Profile</button>
            <button onClick={handleImportProfileButton}>Import Selected Profile</button>
        </div>
        <span style={{ fontSize: "1.2rem", fontWeight: "bold" }}>Current Profile: {currentProfile}</span>

        <Modal isOpen={addProfileIsOpen} onClose={closeAddProfile} noClose={true}>
            <h3>Input Name:</h3>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            <div style={{ display: "flex", justifyContent: "end", gap: "2" }}>
                <button onClick={closeAddProfile}>Cancel</button>
                <button onClick={handleAddProfile}>Create</button>
            </div>
        </Modal>

        <Modal isOpen={copyProfileIsOpen} onClose={closeCopyProfile} noClose={true}>
            <h3>Input Name:</h3>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            <div style={{ display: "flex", justifyContent: "end", gap: "2" }}>
                <button onClick={closeCopyProfile}>Cancel</button>
                <button onClick={handleCopyProfile}>Copy</button>
            </div>
        </Modal>

        <Modal isOpen={deleteProfileIsOpen} onClose={() => setDeleteProfileIsOpen(false)} noClose={true}>
            <h3>Are you sure you want to delete '{selected}'?</h3>
            <div style={{ display: "flex", justifyContent: "end", gap: "2" }}>
                <button onClick={() => setDeleteProfileIsOpen(false)}>Cancel</button>
                <button onClick={handleDeleteProfile}>Delete</button>
            </div>
        </Modal>

        <Modal isOpen={exportProfileIsOpen} onClose={closeExportProfile} noClose={true}>
            <h3>Copy the following string to import '{selected}' to another device</h3>
            <textarea style={{ height: "5rem", width: "90%" }} ref={textAreaRef} readOnly={true} value={dataString} onClick={handleCopy} />
            <div>{copySuccess ?? null}</div>
            <div style={{ display: "flex", justifyContent: "end", gap: "2" }}>
                <button onClick={closeExportProfile}>Close</button>
            </div>
        </Modal>

        <Modal isOpen={importProfileIsOpen} onClose={closeImportProfile} noClose={true}>
            <h3>Input name of new profile:</h3>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            <h3>Input exported data string:</h3>
            <textarea style={{ height: "5rem", width: "90%" }} value={dataString} onChange={e => setDataString(e.target.value)} />
            <div style={{ display: "flex", justifyContent: "end", gap: "2" }}>
                <button onClick={closeImportProfile}>Cancel</button>
                <button onClick={handleImportProfile}>Import</button>
            </div>
        </Modal>
    </div>
}

function OperatorsPanel() {
    const { profileData, setProfileData } = useProfiles();
    const [operators, operatorsLoading] = useOperators();
    const [searchString, setSearchString] = useState("");
    const [availableSelected, setAvailableSelected] = useState([]);
    const [disabledSelected, setDisabledSelected] = useState([]);

    const operatorStyle = { display: "flex", flexDirection: "column", alignItems: "center", padding: "0.1rem", boxSizing: "border-box", border: "2px solid transparent" };
    const selectedOperatorStyle = { ...operatorStyle, border: "2px #c4a83c solid", backgroundColor: "#3A2E0A" };

    const components = [];
    components.push(<div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
        Search operator:
        <input value={searchString} onChange={e => setSearchString(e.target.value)} />
        Endministrator Portrait:
        <select
            value={profileData.settings.endministrator ?? "endministrator-a"}
            onChange={e => setProfileData(p => ({ ...p, settings: { ...p.settings, endministrator: e.target.value } }))}
        >
            <option value={"endministrator-a"}>Endministrator A</option>
            <option value={"endministrator-b"}>Endministrator B</option>
        </select>
    </div>)

    const handleToggleAvailableSelected = (opId) => {
        if (availableSelected.includes(opId)) {
            setAvailableSelected(p => p.filter(id => id !== opId));
        } else {
            setAvailableSelected(p => [...p, opId]);
        }
    }

    const filteredAvailable = useMemo(() => operatorsLoading ? [] : Object.entries(operators).filter(([opId, operator]) => {
        if (profileData.operators[opId]?.disabled) return false;
        if (searchString.trim().length === 0) return true;
        return operator.name.toLowerCase().includes(searchString.toLowerCase());
    }).sort((a, b) => a[0].localeCompare(b[0])).map(([opId, _]) => opId), [profileData.operators, searchString, operators, operatorsLoading]);

    components.push(<div
        style={{
            display: "flex", flexDirection: "column", width: "100%", height: "400px",
            padding: "0.5rem", borderRadius: "1rem", border: "2px #aaa solid"
        }}
    >
        <h3 style={{ margin: 0 }}>Available Operators</h3>
        <div style={{ flex: 1, overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0.1rem", margin: "0.2rem" }}>
                {filteredAvailable.map(id =>
                    <div
                        key={id}
                        style={availableSelected.includes(id) ? selectedOperatorStyle : operatorStyle}
                        onClick={() => handleToggleAvailableSelected(id)}
                    >
                        <OperatorImage id={id} width={80} height={96} />
                        {operators[id].name}
                    </div>)}
            </div>
        </div>
    </div>)

    const addOperators = () => {
        setProfileData(p => {
            const newOps = disabledSelected.reduce((acc, id) => {
                const { disabled, ...rest } = p.operators[id];
                if (Object.keys(rest).length === 0) delete acc[id];
                else acc[id] = rest;
                return acc;
            }, { ...p.operators })
            return { ...p, operators: newOps };
        });
        setDisabledSelected([]);
    }

    const removeOperators = () => {
        setProfileData(p => {
            const newOps = availableSelected.reduce((acc, id) => {
                acc[id] = { ...(acc[id] ?? {}), disabled: true };
                return acc;
            }, { ...p.operators });
            return { ...p, operators: newOps };
        });
        setAvailableSelected([]);
    }

    components.push(<div style={{ display: "flex", flexDirection: "row", gap: "1rem", flex: "0 0 auto" }}>
        <button style={{ fontSize: "1rem" }} onClick={addOperators}>&uarr;</button>
        <button style={{ fontSize: "1rem" }} onClick={removeOperators}>&darr;</button>
    </div>)


    const handleToggleDisabledSelected = (opId) => {
        if (disabledSelected.includes(opId)) {
            setDisabledSelected(p => p.filter(id => id !== opId))
        } else {
            setDisabledSelected(p => [...p, opId]);
        }
    }

    const filteredDisabled = useMemo(() => operatorsLoading ? [] : Object.entries(operators).filter(([opId, operator]) => {
        if (!(opId in profileData.operators) || !profileData.operators[opId].disabled) return false;
        if (searchString.trim().length === 0) return true;
        return operator.name.toLowerCase().includes(searchString.toLowerCase());
    }).sort((a, b) => a[0].localeCompare(b[0])).map(([opId, _]) => opId), [profileData.operators, searchString, operators, operatorsLoading]);

    components.push(<div
        style={{
            display: "flex", flexDirection: "column", width: "100%", height: "400px",
            padding: "0.5rem", borderRadius: "1rem", border: "2px #aaa solid"
        }}
    >
        <h3 style={{ margin: 0 }}>Disabled Operators</h3>
        <div style={{ flex: 1, overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0.1rem", margin: "0.2rem" }}>
                {filteredDisabled.map(id =>
                    <div
                        key={id}
                        style={disabledSelected.includes(id) ? selectedOperatorStyle : operatorStyle}
                        onClick={() => handleToggleDisabledSelected(id)}
                    >
                        <OperatorImage id={id} width={80} height={96} />
                        {operators[id].name}
                    </div>)}
            </div>
        </div>
    </div>)

    return <div style={{ display: "flex", flexDirection: "column", width: "100%", alignItems: "center", gap: "0.2rem" }}>
        {components}
    </div>
}


function ProfilesTab() {
    return <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: "min(1000px, 90vw)", alignItems: "center", gap: "1rem" }}>
            <h2 style={{ marginBottom: "0.5rem" }}>Profiles</h2>
            <p>
                All personal data is stored locally on your device.
                <br />
                You can use profiles to switch between multiple sets of data or export them to other devices.
            </p>
            <ProfilesPanel />
            <OperatorsPanel />
        </div>
    </div>;
}

export default ProfilesTab;