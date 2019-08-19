/**
 * This file contains the setup functions needed to initialize the application
 */

import axios from 'axios';
import Requirements from './Requirements';

const Setup = {

    // randomly assigns dependencies to the provided requirements
    // the number that is assigned is based on the dependencyPercentage parameter
    assignValues(requirements, dependencyPercentage) {
        // first randomly generate dependencies depending on the percentage
        let dependencyNum = Math.floor(requirements.length / 100 * dependencyPercentage);
        let reqs = [], deps = []
        for(let i = 0; i < (dependencyNum); i++) {
            let reqIndex = Math.floor(Math.random() * (requirements.length - 1))
            let depIndex = Math.floor(Math.random() * (requirements.length - 1));
            if(!reqs.includes(reqIndex)) {
                reqs.push(reqIndex);
                deps.push(depIndex);
            } else {
                i--;
            }
        }

        // map over the requirements and add the necessary fields
        requirements.map((req, index) => {
            if(reqs.includes(index)) {
                req.dependencies.push("R"+deps[0]);
                reqs.splice(reqs.indexOf(index),1);
                deps.splice(0,1);
            }
        });
        return requirements;
    },

    // function to post all of the requirements in the JSON file
    postAllRequirements() {
        axios.get(`http://localhost:3000/api/requirements`)
            .then(response => {
                if(response.data[0] === undefined) {
                    let testSet = Requirements.testSet;
                    let hundredSet1 = this.assignValues(Requirements.hundredSet1,10);
                    let hundredSet2 = this.assignValues(Requirements.hundredSet2,70);
                    let twoFiftySet1 = this.assignValues(Requirements.twoFiftySet1,10);
                    let twoFiftySet2 = this.assignValues(Requirements.twoFiftySet2,70);
                    let reqsToPost = testSet.concat(hundredSet1, hundredSet2, twoFiftySet1, twoFiftySet2);
                    axios.post(`http://localhost:3000/api/requirements/`, reqsToPost)
						.catch(error => {
							console.error(error);
						})
                }
            })
            .catch(error => {
                console.error(error);
            })
    },

    // function to wipe out all of the requirements that are currently in the database
    nukeAllRequirements(repost) {
            axios.get(`http://localhost:3000/api/requirements`)
                .then(response => {
                    if(response.data.length) {
                        response.data.map(x => {
                            axios.delete(`http://localhost:3000/api/requirements/`+x.id)
                                .catch(error => {
                                    console.error(error);
                                })
                        })
                    }
                })
                .then(() => {
                    if(repost === true) {
                        this.postAllRequirements();
                    }
                })
                .catch(error => {
                    console.error(error);
                })
    },

    // function to post all the necessary MasterPlan instances
    postAllMasterPlans() {
        let masterPlans = [
            {algorithm: "random"},
            {algorithm: "best random"},
            {algorithm: "greedy"},
            {algorithm: "knapsack"}
        ];
        axios.post(`http://localhost:3000/api/MasterPlans`,masterPlans)
            .catch(error => {
                console.error(error);
            })
    },

    // function to wipe out all the MasterPlans that are currently in the database
    nukeAllMasterPlans(repost) {
        axios.get(`http://localhost:3000/api/MasterPlans`)
                .then(response => {
                    if(response.data.length) {
                        response.data.map(x => {
                            axios.delete(`http://localhost:3000/api/MasterPlans/`+x.id)
                                .catch(error => {
                                    console.error(error);
                                })
                        })
                    }
                })
                .then(() => {
                    if(repost === true) {
                        this.postAllMasterPlans();
                    }
                })
                .catch(error => {
                    console.error(error);
                })
    },

    nukeAllSubPlans() {
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
    },



    // function that actually does the setup
    onStartup() {
        axios.get(`http://localhost:3000/api/MasterPlans`)
        .then(response => {
            // if the MasterPlans aren't there properly then nothing will work
            // so we should nuke whatever might be there from orbit and start again (it's the only way to be sure)
            if(response.data.length < 4) {
                this.nukeAllSubPlans();
                this.nukeAllMasterPlans(true);
                this.nukeAllRequirements(true);
                console.log("please manually refresh the page to see the application!");
            }
        })
        .catch(error => {
            console.error(error);
        })
    }




}

export default Setup;