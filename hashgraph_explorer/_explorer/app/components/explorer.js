
// @flow
import React, { Component } from 'react';
import connect from '../containers/container';
import Row from './row';
import TopBar from './topbar';
import SideBar from './sidebar';
class Explorer extends Component {
    constructor(props) {
        super(props);
        this.state = {};
    }
    render() {
        var me = this;
        return (
            <div>
                <SideBar />
                <TopBar />
                <div className="w3-main w3-content w3-padding" style={{ maxWidth: '1200px', marginTop: '100px' }}>
                    <Row>
                    </Row>
                </div>
            </div>
        );
    }
}

export default connect(Explorer);

