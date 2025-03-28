const { pauseCharging , setChargingMode, getAccessToken } = require("./smappee");

let allowToBeOverruled = true;
let appliedPercentage = null;
let chargingMode = 'Unknown';
let smartChargingEnabled = true;

let chargingModes = new Set(["OVERRULED", "PAUSED", "CHARGING"]);

async function setEVPower(percentage) {
    //let allowToBeOverruled = true;

    if(!smartChargingEnabled) {
        console.log("%s: Process is overruled", new Date().toISOString());
        if(allowToBeOverruled) {
            setChargingModeState("OVERRULED");
            console.log("%s: Process is overruled, go back to default, charging mode", new Date().toISOString());
            await setChargingMode(30);  
            appliedPercentage = 30;
            allowToBeOverruled = false;
        }
        return;
    } else {
        allowToBeOverruled = true;
    }

    if(percentage != appliedPercentage) {
        console.log("%s: Percentage can be changed to : %s", new Date().toISOString(), percentage);
        appliedPercentage = percentage;
    } else {
        //console.debug("%s No change in percentage, no need to do anything", new Date().toISOString());
        return;
    }

    if( await getAccessToken() ) {
        if(appliedPercentage == 0) {
            setChargingModeState("PAUSED");
            await pauseCharging()
        } else {
            setChargingModeState("CHARGING");
            await setChargingMode(percentage); 
        }
    } else {
        console.error("%s: No access_token available, bail out", new Date().toISOString());
    }
}

/**
   * Sets the charging mode.
   * @param {string} mode - The new charging mode. Valid values: "overruled", "paused", "charging".
   * @throws {Error} If an invalid mode is provided.
   */
function setChargingModeState(mode) {
    console.log("%s: Charging mode is set to: %s", new Date().toISOString(), mode);
    if(chargingModes.has(mode)) {
        chargingMode = mode;
    } else {
        throw new Error("Invalid charging mode. Valid modes: overruled, paused, charging");
    }
}

/**
   * Gets the current charging mode.
   * @returns {string} The current charging mode.
   */
function getChargingMode() {
    return chargingMode;
}

/**
 * Sets the smartcharging mode. 
 * When enabled this will read the P1 power an then steer the Smappee EV-Charger
 * @param {boolean} enabled 
 */
async function setSmartCharging(enabled) {
    smartChargingEnabled = enabled;
    console.log("%s: SmartCharging has been set to: %s", new Date().toISOString(), enabled);
    await setEVPower(0);
}

/**
 * Get the smart charging mode status
 * @returns {boolean} Smart charging mode enabled
 */
function getSmartCharging() {
    return smartChargingEnabled;
}

/**
 * Get the current applied percentage
 * @returns {number} Smart charging mode enabled
 */
function getPercentage() {
    return appliedPercentage;
}

module.exports = { setEVPower , getChargingMode, setSmartCharging, getSmartCharging, getPercentage };
