const powerLookup = [
    { power: 100, setting: 0 },
    { power: 1300, setting: 1 },
    { power: 1600, setting: 10 },
    { power: 2300, setting: 20 },
    { power: 2800, setting: 30 },
    { power: 3200, setting: 40 },
    { power: 3800, setting: 50 },
    { power: 4300, setting: 60 },
    { power: 4600, setting: 70 },
    { power: 5200, setting: 80 },
    { power: 5700, setting: 90 },
    { power: 6000, setting: 100 }
];

let currentConsumption = 0; // Tracks how much power the EV charger is using

/**
 * Get the current EV charger setting.
 */
function getCurrentSetting() {
    return powerLookup.find(entry => entry.power === currentConsumption)?.setting || 0;
}

/**
 * Finds the best EV charger setting for a given available power.
 * @param {number} availablePower - The power available for charging.
 */
function findBestSetting(availablePower) {
    let bestMatch = powerLookup[0]; // Default to setting 0 (off)
    for (let entry of powerLookup) {
        if (entry.power <= availablePower) {
            bestMatch = entry;
        } else {
            break;
        }
    }
    return bestMatch.setting;
}

/**
 * Calculates the EV charger setting based on surplus power.
 * @param {number} gridPower - The power balance (+ means consuming from grid, - means returning to grid).
 */
function calculateEVPower(gridPower) {

    if( gridPower > 0 && currentConsumption == 0) {
        return 0;
    }

    availablePower = 0;
    if(gridPower > 0) {
        availablePower = Math.abs(gridPower - currentConsumption);
    } else {
        availablePower = Math.abs(gridPower) + currentConsumption;
    }
    
    console.log("%s: Grid Power %d, Current EV-Charger power: %d, Available Power: %d",new Date().toISOString(), gridPower, currentConsumption, availablePower);
    const newSetting = findBestSetting(Math.abs(availablePower));
    const currentSetting = getCurrentSetting();

    //console.log("newSetting would be: ", newSetting);

    // Apply new power setting
    currentConsumption = powerLookup.find(entry => entry.setting === newSetting)?.power || 0;

    console.log("%s: Recommending EV-Charger setting is: ", new Date().toISOString(), newSetting);
    return newSetting;
}

/**
 * Resets EV charger state (for testing).
 */
function resetEVState() {
    currentConsumption = 0;
}

module.exports = { calculateEVPower, getCurrentSetting, resetEVState };
