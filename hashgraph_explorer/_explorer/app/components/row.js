// @flow
import React, { Component } from 'react';
import connect from '../containers/container';


class Row extends Component {
    constructor(props) {
        super(props);
        this.state = {};
    }
    render() {
        var me = this;
        return (
            <div className="w3-row-padding w3-padding-16 w3-center">
                {this.props.children}
            </div>
        );
    }
}

export default connect(Row);