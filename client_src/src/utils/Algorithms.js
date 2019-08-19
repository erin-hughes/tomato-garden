/**
 * This file contains the four selection algorithms that will be used to generate the release plans.
 * All functions take an array of requirements that have been evaluated using ROA as a parameter and use it to make their selections.
 */

import Equations from './Equations';
import math from 'mathjs';

const Algorithms = {

    // random selection algorithm
    // the keep values parameter is used to determine if the values of the requirements should be kept when generating the plan
    // it is needed because the best-random plan needs the values to choose its optimal plan
    randomAlgorithm(testData, keepValues = false) {
        // only log the time if the algorithm isn't being run by the best-random algorithm
        if(keepValues === false) console.time("Random Algorithm");
        let plan = [];
        // maxPlanCost is defined in the scenario
        let planCost = 0, maxPlanCost = 15;
        let uncompletedReqs = testData.slice();
        let blocked = false;
        let finished = false;
        while(!finished && uncompletedReqs.length) {
            blocked = false;
            // first pick a user story from the array at random
            let index = Math.floor(Math.random() * (uncompletedReqs.length));
            let req = uncompletedReqs[index];
            // need to check if this requirement has any dependencies
            if(req.dependencies.length > 0) {
                req.dependencies.map(dep => {
                    if(uncompletedReqs.find(x => x.code === dep)) {
                        // a dependency has been found, this issue is blocked
                        if(!blocked) {
                            blocked = true;
                        }
                    }
                });
            }
            if(blocked === false) {
                // if the user story isn't waiting on anything then we can add it to the plan
                if(planCost + req.cost <= maxPlanCost) {
                    if (keepValues === true) {
                        plan.push(req)
                    } else {
                        plan.push(req.code);
                    }
                    // remove the added requirement from the array
                    uncompletedReqs.splice(index, 1);
                    planCost += req.cost;
                } else {
                    finished = true;
                }
            }
        }
        // only log the time if the algorithm isn't being run by the best-random algorithm
        if(keepValues === false) console.timeEnd("Random Algorithm");
        return plan;
    },

    // best random selection algorithm
    bestRandom(testData) {
        console.time("Best Random Algorithm");
        // push 10 randomly generated candidates into an array
        let randomPlans = [];
        for(let i = 0; i < 10; i++) {
            randomPlans.push(this.randomAlgorithm(testData, true));
        }
        // work out which plan is the "best", i.e. which one has the highest value to cost ratio
        let bestPlan = [];
        let bestTotal = 0;
        randomPlans.map(plan => {
            let total = 0;
            plan.map(req => {
                total += req.valueToCost;
            })
            if (total > bestTotal) {
                bestPlan = plan;
                bestTotal = total;
            }
        });
        // return the best plan in the appropriate format
        let formattedPlan = [];
        bestPlan.map(req => {
            formattedPlan.push(req.code);
        });
        console.timeEnd("Best Random Algorithm");
        return formattedPlan;
    },

    // greedy selection algorithm
    greedyAlgorithm(testData) {
        console.time("Greedy Algorithm");
        let plan = [];
        //maxPlanCost is defined in the scenario and should probably live in constants actually
        let planCost = 0, maxPlanCost = 15;
        let uncompletedReqs = testData.slice();
        let blocked = false, finished = false;
        let index = 0;

        // obtain scores
        uncompletedReqs = Equations.calculateScores(uncompletedReqs);

        // need to address dependencies
        // before we do anything we should check for requirements that are about to expire
        uncompletedReqs.map((req, index) => {
            if(req.timeRemaining === 0) {
                blocked = this.checkBlocked(req, uncompletedReqs);
                if(req.score >= 1.0 && !blocked && planCost + req.cost <= maxPlanCost) {
                    plan.push(req.code);
                    uncompletedReqs.splice(index, 1);
                    planCost += req.cost;
                }
            }
        });

        // sort the requirements in order of descending value-to-cost (i.e. from the highest value-to-cost to the lowest)
        uncompletedReqs.sort((a, b) => {
            if(a.score > b.score)
                return -1;
            else if (a.score < b.score)
                return 1;
            else
                return 0;
        });
        // now add the requirements to different releases
        while(!finished && uncompletedReqs.length) {
            let req = uncompletedReqs[index];
            blocked = this.checkBlocked(req, uncompletedReqs);
            if(blocked === false) {
                // if the user story isn't waiting on anything then we can add it to the plan
                if(planCost + req.cost <= maxPlanCost) {
                    plan.push(req.code);
                    // remove the added requirement from the array
                    uncompletedReqs.splice(index, 1);
                    planCost += req.cost;
                    index = -1; //need to restart the search at index 0 (1 will be incremented at the end of the loop)
                } else {
                    finished = true;
                }
            }
            if(index+1 > (uncompletedReqs.length-1)) {
                index = 0;
            } else {
                index++;
            }
        }
        console.timeEnd("Greedy Algorithm");
        return plan;
    },

    // knapsack selection algorithm
    // derived from the tabulation method of solving the 0/1 knapsack problem
    knapsackAlgorithm(testData) {
        console.time("Knapsack Algorithm");
        let plan = [];
        // maxPlanCost is defined in the scenario and should probably live in constants actually
        let maxPlanCost = 15;
        let uncompletedReqs = testData.slice();
        let blocked = false;

        let independentReqs = [];
        let table, keep;

        // obtain scores
        uncompletedReqs = Equations.calculateScores(uncompletedReqs);

        uncompletedReqs.map(req => {
            blocked = this.checkBlocked(req, uncompletedReqs);
            if(!req.dependencies.length || blocked === false) {
                independentReqs.push(req);
            }
        });

        // before we do anything we should check for requirements that are about to expire
        independentReqs.map((req, index) => {
            if(req.timeRemaining === 0) {
                if(req.valueToCost >= 1.0 && maxPlanCost - req.cost >= 0) {
                    plan.push(req.code);
                    independentReqs.splice(index, 1);
                    maxPlanCost -= req.cost;
                }
            }
        });

        // i probably need to make a wee check in here to make sure that if the release is already full up then dont bother running the rest of the algorithm
        if(maxPlanCost > 0) {
            let totalStoryNumber = independentReqs.length;
            // the table matrix is the table of the value vs capacity of each requirement
            // the keep matrix contains 0s and 1s, and keeps track of which requirements get added into the release
            table = math.matrix(math.zeros((totalStoryNumber+1),(maxPlanCost+1)));
            keep = math.matrix(math.zeros((totalStoryNumber+1),(maxPlanCost+1)));

            for(let i = 0; i <= totalStoryNumber; i++) {
                for (let j = 0; j <= maxPlanCost; j++) {
                    // fill the top row and left column with zeroes (can't have 0 cost or 0 value)
                    if (i === 0 || j === 0) {
                        table._data[i][j] = 0;
                        keep._data[i][j] = 0;
                    }
                    // if the requirement can fit in the release, work out if there's more value in including or excluding it
                    else if (independentReqs[i-1].cost <= j) {
                        let oldMax = table._data[i-1][j]; // exclude this requirement
                        let newMax = independentReqs[i-1].score + table._data[i-1][j-independentReqs[i-1].cost]; // include this requirement
                        table._data[i][j] = newMax > oldMax ? newMax : oldMax;
                        keep._data[i][j] = newMax > oldMax ? 1 : 0;
                    // if the requirement can't fit then the value is the same as the previous row
                    } else {
                        table._data[i][j] = table._data[i-1][j];
                    }
                }
            }
            // traverse back through the keep matrix to find which requirements should be included
            let runningCapacity = maxPlanCost;
            for(let i = totalStoryNumber; i > 0; i--) {
                if(keep._data[i][runningCapacity] === 1) { // 1 means include
                    plan.push(independentReqs[i-1].code);
                    //subtract the cost of the included requirement from the total capacity
                    runningCapacity -= independentReqs[i-1].cost;
                }
            }
        }
        console.timeEnd("Knapsack Algorithm");
        return plan;
    },

    // util function to determine if the provided requirement is blocked by an incomplete dependency
    checkBlocked(req, array) {
        let blocked = false;
        // first we need to check if this requirement has any dependencies
        if(req.dependencies.length > 0) {
            req.dependencies.map(dep => {
                if(array.find(x => x.code === dep)) {
                    // a dependency has been found, this issue is blocked
                    if(!blocked) {
                        blocked = true;
                    }
                }
            });
        }
        return blocked;
    },

};

export default Algorithms;
