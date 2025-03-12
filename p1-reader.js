
const axios = require('axios');
const config = require('./config');

const IP = config.P1.ip;
const P1_URL = `http://${IP}/api/v1/data`;

async function getP1Power() {
  try {
    const response = await axios.get(P1_URL);
    //console.log("Response received: ", response);
    return response.data.active_power_w;
  } catch(error) {
    console.error("Could not fetch P1 data: ", error.message);
    return null;
  }
}



module.exports = { getP1Power };
