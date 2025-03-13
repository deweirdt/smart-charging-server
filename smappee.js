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

module.exports = { pauseCharging , setChargingMode, getAccessToken };