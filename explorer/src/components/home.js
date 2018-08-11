import React, { Component } from 'react'
import { connect } from 'react-redux'
import * as Util from '../util';
import Row from './row';
import Panel from './panel';
import * as UIA from '../actions';
import * as Titles from './titles';
class Home extends Component {
    constructor(props) {
        super(props)
        this.state = {
            menuOpen: false
        }
    }
    render() {
        var me = this;
        var { state } = me.props;

        return (
            <div>
                <Row>
                    <Panel title={Titles.WhatsThis}>
                        <div className="dashboard-flot-chart">
                            {Titles.WhatsThisExplanation}
                            <a href="https://en.wikipedia.org/wiki/Hashgraph">{Titles.HashGraphLink}</a>
                        </div>
                    </Panel>
                </Row>
            </div>
        )
    }
}
Home = connect(Util.mapStateToProps, Util.mapDispatchToProps)(Home)

export default Home