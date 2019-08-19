/**
 * A navigation bar that is drawn at the top of all screens in the UI.
 * Links to navigate to the Scenario page, the Plan page, and the article that inspired this experiment.
 */

import React from 'react';
import './NavBar.css';

function NavBar() {
    return (
        <nav className="navbar navbar-dark bg-danger fixed-top navbar-height">
            <a className="tomato" href="/"><span>Home</span></a>
            <div className="navbar-items">
                <ul className="navbar-nav navbar-item-list">
                    <li className="nav-item">
                        <a className="nav-link" href="/">Scenario</a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" href="/Plan">Plan</a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" href="https://hbr.org/1998/09/strategy-as-a-portfolio-of-real-options">Inspiration</a>
                    </li>
                </ul>
            </div>
        </nav>
    );
}
export default NavBar;