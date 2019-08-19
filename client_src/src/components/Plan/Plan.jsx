/**
 * This component applies the ROA equations to the requirements fetched from the database and generates release plans that are displayed to the user based on the results.
 * It allows a user to change the test set and algorithm that have been used to generate that release, as well as move forwards and backwards through the releases.
 * All the API calls necessary to obtain and edit this information are made within this component.
 * It also determines the data to be passed to the Graph component.
 */

import React, { Component } from 'react';
import axios from 'axios';
import Graph from '../Graph/Graph';
import Equations from '../../utils/Equations';
import Algorithms from '../../utils/Algorithms';
import './Plan.css';

class Plan extends Component {
    constructor(props) {
        super(props);
        this.state = {
            data: [],
            planType: "random", // gotta set the default to something yknow
            setType: 1,
            allPlans: [],
            currentPlan: []
        }
    }

    componentWillMount() {
        this.onLoad(this.state.setType);
    }

    // this function fetches the all the MasterPlans and requirements, and uses the results to get the currently active test set
    onLoad(setType, newPlanType) {
        // change the planType if a new one has been provided
        if(newPlanType) {
            this.setState({
                planType: newPlanType
            });
        }
        axios.get(`http://localhost:3000/api/MasterPlans`)
            .then(response => {
                this.setState({
                    allPlans: response.data
                })
                axios.get(`http://localhost:3000/api/requirements`)
                    .then(response => {
                        let testSet = this.getTestSet(response.data,setType);
                        this.filterRequirements(testSet);
                    })
                    .catch(error => {
                        console.error(error);
                    })
            })
            .catch(error => {
                console.error(error);
            })
    }

    // util function to filter the requirements down to the correct test set based on the setType param
    getTestSet(testData, setType) {
        let testSet = [];
        switch(setType) {
            case 1: testSet = testData.slice(0,20);    break;
            case 2: testSet = testData.slice(20,120);  break;
            case 3: testSet = testData.slice(120,220); break;
            case 4: testSet = testData.slice(220,470); break;
            case 5: testSet = testData.slice(470,720); break;
        }
        this.setState({
            setType: setType
        });
        return testSet
    }

    // this function removes requirements from the active test set that have already been completed or already expired
    filterRequirements(array) {
        let dataArray = [], completedIDs = [], uncompletedReqs = [];
        let masterPlan = this.state.allPlans.filter(masterPlan => masterPlan.algorithm === this.state.planType)[0];
        let reqs = array.slice(); // create a copy of the requirements array to work with
        let elapsedTime = 0;

        axios.get(`http://localhost:3000/api/MasterPlans/`+masterPlan.id+`/subPlans/`)
            .then(response => {
                // determine how much time has elapsed based on the number of SubPlans that the active MasterPlan has
                if(response.data.length !== 0) {
                    elapsedTime = response.data.findIndex(plan => {
                        return plan.completed === false;
                    });
                    elapsedTime = (elapsedTime === -1) ? response.data.length : elapsedTime;
                }
                // calculate valueToCost and volatility for each requirement
                reqs = Equations.calculateWithIndividualExpiryTime(array, elapsedTime);
                // add the requirement codes in the completed subplans to a list of completedIDs so they can be filtered out below
                response.data.map(subplan => {
                    if(subplan.completed === true) {
                        subplan.requirements.map(req => {
                            completedIDs.push(req);
                        })
                    }
                })
                reqs.map(x => {
                    x.timeRemaining -= elapsedTime;
                    // if the requirement hasn't been completed and hasn't expired, add it to the array of uncompleted requirements.
                    if(!completedIDs.includes(x.code) && (x.timeRemaining) >= 0) {
                        uncompletedReqs.push(x);
                        // a workaround for the clipping problem - increase 0 to 0.001 so that the point still shows up on the graph
                        x.valueToCost = x.valueToCost === 0 ? 0.001 : x.valueToCost
                        x.volatility = x.volatility === 0 ? 0.001 : x.volatility
                        // use the calculated valueToCost and volatility as the graph coordinates for that requirements
                        dataArray.push({x: x.valueToCost, y: x.volatility, title: x.code});
                    }
                });
                this.setState({
                    data: uncompletedReqs,
                    graphData: dataArray,
                    elapsedTime: elapsedTime
                });
                this.getCurrentPlan(response.data, masterPlan)
            })
            .catch(error => {
                console.error(error);
            })
    }

    // util function to determine how the current SubPlan can be fetched
    // takes the response from the API call to the database for SubPlans as a parameter
    getCurrentPlan(subPlans, masterPlan) {
        // if there are no subplans then we obvs need to create one and post it to the database
        if(subPlans.length === 0) {
            this.postNewPlan(masterPlan.id, masterPlan.algorithm, (subPlans.length+1), this.state.data);
        } else {
            let totalFinished = 0;
            subPlans.map(plan => {
                if(plan.completed === true) totalFinished++;
            });
            // if the number of completed SubPlans is equal to the total number of SubPlans, then a new plan needs to be posted
            // determined by checking if that index is in the subPlans array
            if(subPlans[totalFinished] === undefined) {
                this.postNewPlan(masterPlan.id, masterPlan.algorithm, (subPlans.length+1), this.state.data);
            } else {
                this.setState({
                    currentPlan: subPlans[totalFinished]
                });
            }
        }
    }

    // util function that runs one of the selection algorithms on the requirements, based on the planType parameter
    generatePlan(planType, data) {
        if(planType === "random")
            return Algorithms.randomAlgorithm(data);
        else if(planType === "best random")
            return Algorithms.bestRandom(data);
        else if(planType === "greedy")
            return Algorithms.greedyAlgorithm(data);
        else if(planType === "knapsack")
            return Algorithms.knapsackAlgorithm(data);
    }

    // this function posts a new SubPlan to the database using the parameters it is provided
    postNewPlan(masterID, planType, planNumber, data) {
        // gotta generate the requirements for the plan first
        let requirements = this.generatePlan(planType, data);
        let currentPlan = {
            planIndex: planType + planNumber,
            requirements: requirements,
            completed: false,
            masterPlanId: masterID
        }
        axios.post(`http://localhost:3000/api/MasterPlans/`+masterID+`/subPlans`, {
            planIndex: currentPlan.planIndex,
            requirements: currentPlan.requirements,
            completed: currentPlan.completed,
            masterPlanId: currentPlan.masterId
        })
        .then(() => {
            // after a successful post update the state
            this.setState({
                currentPlan: currentPlan,
                planType: planType
            });
        })
        .catch(error => {
            console.error(error);
        })
    }

    // util function to get rid of any SubPlans
    tidyUpSubPlans() {
        axios.get(`http://localhost:3000/api/SubPlans`)
        .then(response => {
            if(response.data.length) {
                response.data.map(x => {
                    axios.delete(`http://localhost:3000/api/SubPlans/`+x.id)
                        .catch(error => {
                            console.error(error);
                        })
                })
            }
        })
        .catch(error => {
            console.error(error);
        })
    }

    // handler for when one of the algorithm buttons is clicked
    handleAlgorithmClick(planType) {
        if(planType !== this.state.planType) {
            // remove the SubPlans to prevent any errors
            this.tidyUpSubPlans();
            this.onLoad(this.state.setType, planType);
        }
    }

    // handler for when one of the test set buttons is clicked
    handleSetClick(setType) {
        if(setType !== this.state.setType) {
            // remove the SubPlans to prevent any errors
            this.tidyUpSubPlans();
            this.onLoad(setType, this.state.planType);
        }
    }

    // function that is run whenever the "Next Release" button is clicked
    getNextRelease() {
        let currentPlan = this.state.currentPlan;
        if(currentPlan.id === undefined) {
            // make a call for the subPlans and sort them in ascending order
            axios.get(`http://localhost:3000/api/MasterPlans/`+currentPlan.masterPlanId+`/subPlans/`)
                .then(response => {
                    let plans = response.data
                    // get the first plan that hasn't been completed
                    currentPlan = plans.find(plan => {
                        return plan.completed === false
                    });
                    let updatedPlan = {
                        planIndex: currentPlan.planIndex,
                        requirements: currentPlan.requirements,
                        completed: true,
                        id: currentPlan.id,
                        masterPlanId: currentPlan.masterPlanId
                    };
                    // make a put call to the database to complete this plan
                    this.completeAndUpdate(updatedPlan)
                })
               .catch(error => {
                   console.error(error);
               })
        } else {
            let updatedPlan = {
                planIndex: currentPlan.planIndex,
                requirements: currentPlan.requirements,
                completed: true,
                id: currentPlan.id,
                masterPlanId: currentPlan.masterPlanId
            };
            // make a put call to the database to complete this plan
            this.completeAndUpdate(updatedPlan);
        }
    }

    // util function for completeing and updating a SubPlan
    completeAndUpdate(updatedPlan) {
        axios.put(`http://localhost:3000/api/MasterPlans/`+updatedPlan.masterPlanId+`/subPlans/`+updatedPlan.id, updatedPlan)
            .then(() => {
                this.onLoad(this.state.setType);
            })
    }

    // function that is run whenever the "Last Release" button is clicked
    getLastRelease() {
         // make a call for the subPlans and sort them in descending order
         axios.get(`http://localhost:3000/api/MasterPlans/`+this.state.currentPlan.masterPlanId+`/subPlans/`)
         .then(response => {
             // same sort as in the completeRelease method but this sorts the plans in descending order rather than ascending order
             response.data.sort((a, b) => {
                 if(parseInt(a.planIndex.replace(/\D/g,'')) > parseInt(b.planIndex.replace(/\D/g,'')))
                     return -1;
                 else if (parseInt(a.planIndex.replace(/\D/g,'')) < parseInt(b.planIndex.replace(/\D/g,'')))
                     return 1;
                 else
                     return 0;
             });
             // get the first plan that has already been completed
             let uncompletedRelease = response.data.find(plan => {
                 return plan.completed === true;
             });
             // put call to update the completed status of this plan to false
             axios.put(`http://localhost:3000/api/MasterPlans/`+this.state.currentPlan.masterPlanId+`/subPlans/`+uncompletedRelease.id, {
                 planIndex: uncompletedRelease.planIndex,
                 requirements: uncompletedRelease.requirements,
                 completed: false,
                 id: uncompletedRelease.id,
                 masterPlanId: this.state.currentPlan.masterPlanId
             })
             .then(() => {
                 this.onLoad(this.state.setType);
             })
             .catch(error => {
                 console.error(error);
             })
         })
         .catch(error => {
             console.error(error);
         })

    }

    // util function that determines whether or not the "Next Release" button should be disabled
    getNextDisabled() {
        let data = this.state.data.slice();
        let planReqs = this.state.currentPlan.requirements;
        let extras = data.filter(item => !planReqs.includes(item.code));
        let expired = extras.every(req => {
            return req.timeRemaining === 0;
        })
        return ((this.state.data.length - this.state.currentPlan.requirements.length) === 0 || this.state.elapsedTime === 5 || expired) ? true : false;
    }

    // util function that determines whether or not the "Last Release" button should be disabled
    getLastDisabled() {
        if(this.state.setType === 1)
            return (this.state.data.length === 20) ? true : false;
        else if (this.state.setType < 4)
            return (this.state.data.length === 100) ? true : false;
        else
            return (this.state.data.length === 250) ? true : false;
    }

    showHeadingMessages(timeRemaining, planType, setType) {
        let headings = [];
        let timeRemainingString = timeRemaining > 1 ? (timeRemaining + " sprints remaining!") : ("Last sprint before the deadline!");
        headings.push(<h2 className="title" key="timeRemainingHeading">{timeRemainingString}</h2>);

        let typeString = setType + "th";
        if (setType === 1) typeString = "1st";
        else if (setType === 2) typeString = "2nd";
        else if (setType === 3) typeString = "3rd";

        headings.push(<h6 className="title" key="planTypeHeading">Generated by running a <strong>{planType.toUpperCase()}</strong> algorithm on the <strong>{typeString}</strong> test set.</h6>);
        return headings;
    }


    // util function that returns the message containing the requirements that are in the current release
    showRelease(finalRelease) {
        let releaseString = <span>please wait...</span>;
        if(this.state.currentPlan.requirements) {
            let reqStr = this.state.currentPlan.requirements.join(", ");
            let msg = (finalRelease) ? "FINAL RELEASE: " : "NEXT RELEASE: ";
            releaseString = (
                <span><strong>{msg}</strong>{reqStr}</span>
            );
        }
        return releaseString;
    }

    //////////////////////////
    // MAIN RENDER FUNCTION //
    //////////////////////////
    render() {
        // only attempt to draw the graph if the requirements have been properly filtered and added to the state
        if(this.state.currentPlan.requirements) {
            let nextDisabled = this.getNextDisabled();
            let lastDisabled = this.getLastDisabled();

            return (
                <div className="plan-container">
                    {this.showHeadingMessages(6 - this.state.elapsedTime, this.state.planType, this.state.setType)}
                    <div className="algorithm-btns">
                        <button type="button" className="btn btn-outline-danger" onClick={() => this.handleAlgorithmClick("random")}>Random</button>
                        <button type="button" className="btn btn-outline-danger" onClick={() => this.handleAlgorithmClick("best random")}>Best Random</button>
                        <button type="button" className="btn btn-outline-danger" onClick={() => this.handleAlgorithmClick("greedy")}>Greedy</button>
                        <button type="button" className="btn btn-outline-danger" onClick={() => this.handleAlgorithmClick("knapsack")}>Knapsack</button>
                    </div>
                    <div className="requirements-btns">
                        <button type="button" className="btn btn-outline-danger" onClick={() => this.handleSetClick(1)}>Test Set 1</button>
                        <button type="button" className="btn btn-outline-danger" onClick={() => this.handleSetClick(2)}>Test Set 2</button>
                        <button type="button" className="btn btn-outline-danger" onClick={() => this.handleSetClick(3)}>Test Set 3</button>
                        <button type="button" className="btn btn-outline-danger" onClick={() => this.handleSetClick(4)}>Test Set 4</button>
                        <button type="button" className="btn btn-outline-danger" onClick={() => this.handleSetClick(5)}>Test Set 5</button>
                    </div>
                    <div className="plain-background"/>
                    <Graph graphData={this.state.graphData} elapsedTime={this.state.elapsedTime}/>
                    <br/>
                    <div className="release-div">
                        {this.showRelease(nextDisabled)}
                    </div>
                    <br/>
                    <div className="algorithm-btns">
                        <button type="button" className="btn btn-outline-danger btn-bottom" disabled={lastDisabled} onClick={() => this.getLastRelease()}>Last release</button>
                        <button type="button" className="btn btn-outline-danger btn-bottom" disabled={nextDisabled} onClick={() => this.getNextRelease()}>Next release</button>
                    </div>
                </div>
            )
        } else {
            return (
                <div>
                    <div className="plain-background"/>
                    Please wait...
                </div>
            )
        }
    }

}

export default Plan;