
// @flow
import React, { Component } from 'react';
import connect from '../containers/container';
import * as UIA from '../actions/uiactions';

class TopBar extends Component {
    constructor(props) {
        super(props);
        this.state = {};
    }
    render() {
        var me = this;
        return (
            <div className="w3-top">
                <div className="w3-white w3-xlarge" style={{ maxWidth: '1200px', margin: 'auto' }}>
                    <div className="w3-button w3-padding-16 w3-left" onClick={() => {
                        me.props.UI(UIA.MENU_OPEN, true);
                    }}>☰</div>
                    <div className="w3-right w3-padding-16">Mail</div>
                    <div className="w3-center w3-padding-16">My Food</div>
                </div>
            </div>
        );
    }
}

export default connect(TopBar);