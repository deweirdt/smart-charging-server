const { getP1Power } = require("./p1-reader");
const { setEVPower, getChargingMode, getSmartCharging, setSmartCharging } = require("./smappee");
const { calculatedEVPower } = require("./calculateEVPower");
const config = require("./config");

const CHECK_INTERVAL = config.processing.interval;
let log_recommended = null;
async function monitorPower() {
    const power = await getP1Power();
    if(power != null) {
        recommendedPercentage = await calculatedEVPower(power);
        if( log_recommended != recommendedPercentage ) {
            console.debug("%s Current power is: %d, recommending %d", new Date().toISOString(), power, recommendedPercentage);
            log_recommended = recommendedPercentage;
        }
        
        await setEVPower(recommendedPercentage);
    } else {
        console.error("Could not process power");
    }
}

const express = require("express");
const cors = require("cors");

const app = express();
var corsOptions = {
    origin: "http://localhost:8100"
  };

app.use(cors(corsOptions));
// parse requests of content-type - application/json
app.use(express.json());
// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Yeah yeah it's working." });
});

app.get("/mode", (req, res) => {
    let mode = getChargingMode();
    let smartCharging = getSmartCharging();
    res.json({ "smartCharging": smartCharging, "charging": mode})
})

app.post("/smartCharging", (req, res) => {
    const { smartCharging } = req.body;

    if(typeof smartCharging !== "boolean") {
        return res.status(400).json({error: "Invalid request. 'smartCharging' must be true or false"});
    }
    setSmartCharging(smartCharging);
    res.json({'smartCharging': smartCharging});
})

// set port, listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

setInterval(monitorPower, CHECK_INTERVAL);