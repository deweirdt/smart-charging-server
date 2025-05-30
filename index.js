const { getP1Power } = require("./p1-reader");
const { setEVPower, getChargingMode, getSmartCharging, setSmartCharging, getPercentage } = require("./EVChargingController");
const { calculateEVPower } = require("./calculateEVPower");
const config = require("./config");

const CHECK_INTERVAL = config.processing.interval;
let log_recommended = null;
async function monitorPower() {
    const power = await getP1Power();
    //console.log("Power read from P1: ", power);
    if(power != null) {
        recommendedPercentage = await calculateEVPower(power);
        if( log_recommended != recommendedPercentage ) {
            console.debug("%s Current power is: %d, recommending %d", new Date().toISOString(), power, recommendedPercentage);
            log_recommended = recommendedPercentage;
        }
        
        await setEVPower(recommendedPercentage);
    } else {
        console.error("%s Could not process power", new Date().toISOString());
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
    res.json({ "smartCharging": smartCharging, "charging": mode});
})

app.get("/percentage", (req, res) => {
    let percentage = getPercentage();
    res.json({"percentage": percentage});
})

app.post("/smartcharging", (req, res) => {
    const { smartcharging } = req.body;
    if(typeof smartcharging !== "boolean") {
        return res.status(400).json({error: "Invalid request. 'smartcharging' must be true or false"});
    }
    setSmartCharging(smartcharging);
    res.json({'smartcharging': smartcharging});
})

app.get("/smartcharging", (req, res) => {
    let smartCharging = getSmartCharging();
	res.json({ "smartcharging": smartCharging});
})

// set port, listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

setInterval(monitorPower, CHECK_INTERVAL);
