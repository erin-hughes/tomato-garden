/**
 * Root component of the application.
 * Renders the NavBar component at the top of every page.
 * Makes use of the Switch component from react-router to render certain pages depending on what the url is.
 */

import React, { Component } from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import Page from './components/Page/Page';
import Scenario from './components/Scenario/Scenario';
import NavBar from './components/NavBar/NavBar';
import Plan from './components/Plan/Plan';
import Setup from './utils/Setup'
import './App.css';

class App extends Component {

	// run setup logic
	componentWillMount() {
		Setup.onStartup();
	}

	render() {
    	return (
    		<div>
    			<NavBar/>
    			<Switch>
					<Route exact path="/plan" render={() => <Page title="Plan | Tomato Garden" contents={<Plan/>}/>}/>
    				<Route exact path="/" render={() => <Page title="Scenario | Tomato Garden" contents={<Scenario/>}/>}/>
    				<Redirect to="/"/>
    			</Switch>
    		</div>
		);
	}
}

export default App;
