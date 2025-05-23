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
        console.log("%s: Authenticated with SMAPPEE", new Date().toISOString());
        storeTokens(response.data)
        return access_token;
    } catch(error) {
        console.error("Could not get token: ", error);
        return false;
    }
}

async function refreshAccessToken() {
    if(!refresh_token) {
        console.error("%s No refresh token available, re-authenticate", new Date().toISOString());
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
        console.log("%s: Got feedback refresh_token from Smappee: %s", new Date().toISOString(), response.data);
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
        console.log("%s: Changed charger to: %d ", new Date().toISOString(), percentage);
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
        console.log("%s: Changed charging to PAUSED", new Date().toISOString());
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
    console.log("%s: Token expires in: %s", new Date().toISOString(), tokenExpiry);
}

async function getAccessToken() {
    if(!access_token || Date.now() >= tokenExpiry) {
        console.log("%s: Need to refresh token: %s", new Date().toISOString(), access_token);
        return refreshAccessToken();
    } else {
        //console.log("Got already a token, nothing to do");
    }
    return access_token;
}

module.exports = { pauseCharging , setChargingMode, getAccessToken };