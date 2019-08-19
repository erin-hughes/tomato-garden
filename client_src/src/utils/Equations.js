/**
 * The functions in this file are the equations used to evaluate the requirements as options
 */

const Equations = {
    // util function for normalizing a number between the provided minimum and maximum
    normalize (num, min, max) {
        return ((num - min) / (max - min)*2);
    },

    // PV(X) = the present value of the exercise cost
    // calculated using X / (1 + rf)^t
    presentValueOfX (cost, returnRate, time) {
        return cost / Math.pow(1 + returnRate, time);
    },

    // value-to-cost calculated using NVP = S / PV(X)
    valueToCost (value, cost, returnRate, time) {
        let PVX = this.presentValueOfX(cost, returnRate, time);
        return Math.round(this.normalize((value/PVX),0,3.5) * 1000)/1000;
    },

    // util function for summing the contents of an array
    sumArray(array) {
        let total = 0;
        array.map(x => {
            total += x;
        });
        return total;
    },

    // function that generates a set of variations of a value in a normal distribution
    // used in order to calculate a "risk" for each requirement
    normalDistribution(value) {
        let variations = [];
        for (let i = 0; i < 10; i++) {
            // 1. define what the standard deviation will be
            let stdDev = value/100*10;

            // 2. generate a number between 1 and 100 to determine how much this value will deviate
            let percent = Math.round(Math.random()*100);

            // 3. depending on the value of the generated number the amount of deviation will vary
            let deviation;

            if(percent <= 68)
                deviation = stdDev * 1;
             else if(percent <= 95)
                deviation = stdDev * 2;
             else
                deviation = stdDev * 3;

            // randomise the offset within the appropriate bounds
            let offset = Math.random() * deviation;
            // randomise the sign of the offset
            let sign = Math.round(Math.random());
            offset *= sign < 1 ? -1 : 1;

            variations.push(value + offset);
        }
        return variations;
    },

    // function that generates a normal distribution of a value and uses it to calculate a risk value
    generateRisk(value) {
        // 1. you need a range of different numbers for the value of the option
        let variations = this.normalDistribution(value);

        // 2. take the average of that range of numbers
        let total = this.sumArray(variations);
        let average = (total/variations.length);

        // 3. for each number work out the difference between it and the average
        // 4. square each of the differences
        let squareDifferences = [];
        for (let i = 0; i < variations.length; i++) {
            let squareDiff = Math.pow((Math.abs(variations[i]-average)),2);
            squareDifferences.push(squareDiff);
        }

        // 5. add them together to get the VARIANCE
        let variance = this.sumArray(squareDifferences);

        // 6. take the square root of the variance to get the STANDARD DEVIATION
        let standardDeviation = Math.sqrt(variance);

        return Math.round(standardDeviation * 1000)/1000;
    },

    // volatility calculated using σ√t
    volatility (risk, time) {
        let volatility = risk * Math.sqrt(time)
        return Math.round(this.normalize((volatility),0,7) * 1000)/1000;
    },

    // runs over all elements in the array and calculates their value-to-cost and volatility
    calculateWithIndividualExpiryTime (array, elapsedTime) {
        array.map(item => {
            item.valueToCost = this.valueToCost(item.value, item.cost, item.returnRate, (item.timeRemaining - elapsedTime));
            item.volatility = this.volatility(item.risk, (item.timeRemaining - elapsedTime));
        });
        return array;
    },

    // runs over all elements in the array and calculates their score
    calculateScores (array) {
        // assign a score by increasing the valueToCost based on the volatility
        array.map(item => {
            item.score = item.valueToCost + (item.volatility * item.valueToCost);
        });
        return array
    },
};

export default Equations;