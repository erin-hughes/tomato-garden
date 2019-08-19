/**
 * A component that gives new users an overview of the scenario that this application is experimenting with.
 * Serves as the "home page" of the application.
 */

import React from 'react';
import './Scenario.css';

function Scenario() {
    return (
        <div>
            <div className="scenario-head">
                <h1 className="title">Tomato Garden</h1>
                <h4 className="title">An experiment to investigate how real options theory can be applied to software planning</h4>
            </div>
            <div className="scenario-body">
                <p>A small team of software developers, <strong>Team A</strong>, have developed and currently maintain a live application. Their product is already successful and they have a reasonably sized user base.</p>
                <p><strong>Team A work in two-week sprints</strong>, and do a release of their application at the end of every sprint.</p>
                <p>In 12 weeks, or <strong>six sprints</strong>, Team A has an important meeting with their supervisors, and they need to be able to show as much new functionality as possible.</p>
                <p>Team A often has trouble deciding which requirements are the most valuable and what they should add to their application first. Can <strong>Real Options Theory</strong> be used to help them?</p>
            </div>
        </div>
    );
}

export default Scenario;