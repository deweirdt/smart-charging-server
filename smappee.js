const axios = require("axios");
const config = require("./config");
require('dotenv').config();

const CLIENT_ID     = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const USERNAME      = process.env.USERNAME;
const PASSWORD      = process.env.PASSWORD;

const AUTH_URL = config.smappee.auth;
const CTRL_URL = config.smappee.ctrl;
let access_token = null;
let refresh_token = null;
let tokenExpiry = 0;

let appliedPercentage = null;
let chargingMode = 'Unknown';
let smartChargingEnabled = true;

let chargingModes = new Set(["OVERRULED", "PAUSED", "CHARGING"]);

async function authenticate() {
    try{
       const response = await axios.post(AUTH_URL,
            new URLSearchParams({
                grant_type: 'password',
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                username: USERNAME,
                password: PASSWORD
            })
        );
        //console.log("Got feedback from Smappee: ", response.data);
        console.log("Authenticated with SMAPPEE");
        storeTokens(response.data)
        return access_token;
    } catch(error) {
        console.error("Could not get token: ", error);
        return false;
    }
}

async function refreshAccessToken() {
    if(!refresh_token) {
        console.error("No refresh token available, re-authenticate");
        return authenticate();
    }
    try {
        const response = await axios.post(AUTH_URL,
            new URLSearchParams({
                grant_type: 'refresh_token',
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                refresh_token, refresh_token
            })
        );
        console.log("Got feedback refresh_token from Smappee: ", response.data);
        storeTokens(response.data);
        return access_token;
    } catch(error) {
        console.error("Could not refresh token: ", error.response?.data || error.message);
        return null;
    }
}

async function setChargingMode(percentage) {
    try {
        const response = await axios.put(CTRL_URL,
            {
                mode: "NORMAL",
                limit: {
                    unit: "PERCENTAGE",
                    value: percentage
                }
            },
            {
                headers: {
                    "Authorization": `Bearer ${access_token}`,
                    "Content-Type": "application/json"
                }
            }
        );
        console.log("Changed charget to: %d ", percentage);
        return true;
    } catch(error) {
        console.error("Could not refresh token: ", error.response?.data || error.message);
        return false;
    }
}

async function pauseCharging() {
    try {
        const response = await axios.put(CTRL_URL,
            {
                mode: "PAUSED"
            },
            {
                headers: {
                    "Authorization": `Bearer ${access_token}`,
                    "Content-Type": "application/json"
                }
            }
        );
        console.log("Changed charging to PAUSED");
        return true;
    } catch(error) {
        console.error("Could not set in PAUSED mode: ", error.response?.data || error.message);
        return false;
    }
}

function storeTokens(data) {
    access_token = data.access_token;
    refresh_token = data.refresh_token;
    tokenExpiry = Date.now() + data.expires_in * 1000; //Converto to ms
    console.log("Token expires in: ", tokenExpiry);
}

async function getAccessToken() {
    if(!access_token || Date.now() >= tokenExpiry) {
        console.log("%s Need to refresh token: %s", new Date().toISOString(), access_token);
        console.log("Access token expired or missing, refreshing..");
        return refreshAccessToken();
    } else {
        //console.log("Got already a token, nothing to do");
    }
    return access_token;
}

let allowToBeOverruled = true;

async function setEVPower(percentage) {
    //let allowToBeOverruled = true;

    if(!smartChargingEnabled) {
        console.log("Process is overruled");
        if(allowToBeOverruled) {
            setChargingMode("OVERRULED");
            console.log("Process is overruled, go back to default, charging mode");
            //await setChargingMode(30);  
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
            console.log("FIX ME: Would be setting to pause charging");
            setChargingMode("PAUSED");
            //await pauseCharging()
        } else {
            console.log("FIX ME: Would be setting chargning percentage: ", percentage);
            setChargingMode("CHARGING");
            //await setChargingMode(percentage); 
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
function setChargingMode(mode) {
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

function setSmartCharging(enabled) {
    smartChargingEnabled = enabled;
}

function getSmartCharging() {
    return smartChargingEnabled;
}
 
module.exports = { setEVPower , getChargingMode, setSmartCharging, getSmartCharging };