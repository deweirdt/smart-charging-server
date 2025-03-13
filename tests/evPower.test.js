const { calculateEVPower, getCurrentSetting, resetEVState } = require("../calculateEVPower");

describe("EV Charger Power Calculation", () => {
    beforeEach(() => {
        resetEVState(); // Reset charger state before each test
    });

    test("should not enable charger when there is no power to the grid from EV", () => {
        //expect(calculateEVPower(0)).toBe(0);
        expect(calculateEVPower(500)).toBe(0);  // Positive means consuming from grid
        expect(calculateEVPower(1500)).toBe(0);  // Positive means consuming from grid
        expect(calculateEVPower(500)).toBe(0);  // Positive means consuming from grid
        expect(calculateEVPower(5000)).toBe(0);  // Positive means consuming from grid
    });

    test("should apply correct the EV Setting if there is sufficient power to the grid", () => {
        expect(calculateEVPower(-1500)).toBe(1); // Expect setting 1
        expect(calculateEVPower(-2500)).toBe(50); // Expect setting 20
        expect(calculateEVPower(-3500)).toBe(100); // Expect setting 40
    });

    test("should not continuously change levels when power remains more of less stable", () => {
        expect(calculateEVPower(-3500)).toBe(40); // Set to 40
        expect(calculateEVPower(-100)).toBe(40); // Should remain on this level
        expect(calculateEVPower(-200)).toBe(40); // Should remain on this level
        expect(calculateEVPower(-100)).toBe(40); // Should remain on this level
    });

    test("should reduce remain in current power mode", () => {
        expect(calculateEVPower(-5000)).toBe(70); // Expect setting 70
        expect(calculateEVPower(-100)).toBe(70); // Should remain on this level
        expect(calculateEVPower(-200)).toBe(70); // Should remain on this level

    });

    test("should reduce setting when grid power is reducing", () => {
        expect(calculateEVPower(-5000)).toBe(70); // Expect setting 70
        expect(calculateEVPower(1000)).toBe(40); // Should remain on this level
        expect(calculateEVPower(-200)).toBe(40); // Should remain on this level

        expect(calculateEVPower(1000)).toBe(10); // EV Setting will have to be reduced not having sufficient power
    });

    test("should reduce until stopping", () => {
        expect(calculateEVPower(-3000)).toBe(30); // EV Setting will have to be reduced not having sufficient power
        expect(calculateEVPower(1000)).toBe(10); 
        expect(calculateEVPower(1000)).toBe(0); 
    });

    test("increasing slighty the EV-Charger", () => {
        expect(calculateEVPower(-1000)).toBe(0);
        expect(calculateEVPower(-1300)).toBe(1);
        expect(calculateEVPower(-1000)).toBe(20); 
        expect(calculateEVPower(-1000)).toBe(40); 
        expect(calculateEVPower(-1000)).toBe(50); 
    });

    test("Field bugr", () => {
        expect(calculateEVPower(-1490)).toBe(1);
        expect(calculateEVPower(800)).toBe(0);
        expect(calculateEVPower(2300)).toBe(0); 

    });

    
});
