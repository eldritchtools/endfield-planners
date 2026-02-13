const LATEST_VERSION = "1.0";

function defaultDijiangPlanner() {
    return {
        "roomAssignments": {
            "CN": [null, null, null],
            "MFG-I": [null, null, null],
            "MFG-II": [null, null, null],
            "GC": [null, null, null],
            "RR": [null, null, null],
        },
        "roomSettings": {
        },
        "operatorSkills": {},
        "settings": {}
    };
}

function defaultPullCalculator() {
    return {};
}

function defaultFactoryCalculator() {
    return {};
}

function defaultOperators() {
    return {};
}

function defaultSettings() {
    return {};
}

function migrateProfile(profile = {}) {
    if (!("latestVersion" in profile)) {
        return {
            latestVersion: LATEST_VERSION,
            dijiangPlanner: defaultDijiangPlanner(),
            pullCalculator: defaultPullCalculator(),
            factoryCalculator: defaultFactoryCalculator(),
            operators: defaultOperators(),
            settings: defaultSettings()
        }
    }

    // let migratedProfile = { ...profile };
    // return migratedProfile;
    return profile;
}

export default migrateProfile;