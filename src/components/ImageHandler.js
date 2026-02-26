import { useProfiles } from "@eldritchtools/shared-components"
import { getImagePath } from "../DataProvider"

function EndministratorImage({ style }) {
    const { profileData } = useProfiles();
    const endminId = profileData.settings.endministrator ?? "endministrator-a";
    return <img src={getImagePath("operators", endminId)} alt={endminId} style={style} />
}

function OperatorImage({ id, width, height }) {
    const style = { width: width, height: height };

    if (id === "endministrator")
        return <EndministratorImage style={style} />
    return <img src={getImagePath("operators", id)} alt={id} style={style} />
}

function ItemImage({ id, width, height, name }) {
    const style = { width: width, height: height };
    return <img src={getImagePath("items", id)} alt={id} title={name} style={style} />
}

function BaseIconImage({ id }) {
    return <img src={getImagePath("base_icons", id)} alt={id} />
}

function IconImage({ id, width, height }) {
    const style = { width: width, height: height };
    return <img src={getImagePath("icons", id)} alt={id} style={style} />
}

function WeaponImage({ id, width, height }) {
    const style = { width: width, height: height };
    return <img src={getImagePath("weapons", id)} alt={id} style={style} />
}

function FacilityImage({ id, width, height }) {
    const style = { width: width, height: height };
    return <img src={getImagePath("facilities", id)} alt={id} style={style} />
}

export { OperatorImage, ItemImage, BaseIconImage, IconImage, WeaponImage, FacilityImage };