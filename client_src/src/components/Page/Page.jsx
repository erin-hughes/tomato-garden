/**
 * Wrapper for the various pages in the UI to ensure consistency
 *
 * @param {string} title: what the title of this webpage will be set to
 * @param {object} contents: JSX that will be rendered inside this Page component
 */

import React, { Component } from 'react';
import './Page.css';

class Page extends Component {
    constructor(props) {
        super(props);
        this.state = {
            title: this.props.title,
            contents: this.props.contents
        }
    }

    componentDidMount() {
        document.title = this.state.title;
    }

    render() {
        return (
            <div className="page-container">
                {this.state.contents}
            </div>
        )
    }
}

export default Page;