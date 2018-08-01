// @flow
import React, { Component } from 'react';
import connect from '../containers/container';
import * as UIA from '../actions/uiactions';


class SideBar extends Component {
    constructor(props) {
        super(props);
        this.state = {};
    }
    render() {
        var me = this;
        var { state } = me.props;
        return (
            <nav className="w3-sidebar w3-bar-block w3-card w3-top w3-xlarge w3-animate-left"
                style={{
                    display: UIA.Get(state, UIA.MENU_OPEN) ? 'block' : 'none',
                    zIndex: 2,
                    width: '40%',
                    minWidth: '300px'
                }} id="mySidebar">
                <a onClick={() => {
                    me.props.UI(UIA.MENU_OPEN, false);
                }}
                    className="w3-bar-item w3-button">Close Menu</a>
                <a onClick={() => {
                    me.props.UI(UIA.MENU_OPEN, false);
                }} className="w3-bar-item w3-button">Food</a>
                <a onClick={() => {
                    me.props.UI(UIA.MENU_OPEN, false);
                }} className="w3-bar-item w3-button">About</a>
            </nav >
        );
    }
}

export default connect(SideBar);