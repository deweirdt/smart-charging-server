const { pauseCharging , setChargingMode, getAccessToken } = require("./smappee");

let allowToBeOverruled = true;
let appliedPercentage = null;
let chargingMode = 'Unknown';
let smartChargingEnabled = true;

let chargingModes = new Set(["OVERRULED", "PAUSED", "CHARGING"]);

async function setEVPower(percentage) {
    //let allowToBeOverruled = true;

    if(!smartChargingEnabled) {
        console.log("Process is overruled");
        if(allowToBeOverruled) {
            setChargingModeState("OVERRULED");
            console.log("Process is overruled, go back to default, charging mode");
            await setChargingMode(30);  
            appliedPercentage = percentage;
            allowToBeOverruled = false;
        }
        return;
    } else {
        allowToBeOverruled = true;
    }

    if(percentage != appliedPercentage) {
        console.log("Percentage can be changed to : ", percentage);
        appliedPercentage = percentage;
    } else {
        console.debug("No change in percentage, no need to do anything");
        return;
    }

    if( await getAccessToken() ) {
        if(appliedPercentage == 0) {
            //console.log("FIX ME: Would be setting to pause charging");
            setChargingModeState("PAUSED");
            await pauseCharging()
        } else {
            //console.log("FIX ME: Would be setting chargning percentage: ", percentage);
            setChargingModeState("CHARGING");
            await setChargingMode(percentage); 
        }
    } else {
        console.error("No access_token available, bail out");
    }
}

/**
   * Sets the charging mode.
   * @param {string} mode - The new charging mode. Valid values: "overruled", "paused", "charging".
   * @throws {Error} If an invalid mode is provided.
   */
function setChargingModeState(mode) {
    console.log("Charging mode is set to: ", mode);
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
    await setEVPower(0);
}

/**
 * Get the smart charging mode status
 * @returns {boolean} Smart charging mode enabled
 */
function getSmartCharging() {
    return smartChargingEnabled;
}

module.exports = { setEVPower , getChargingMode, setSmartCharging, getSmartCharging };
