import React, { Component } from 'react'
import { connect } from 'react-redux'
import * as Util from '../../util';
import * as UIA from '../../actions';
import RedHash from 'redhashgraph';
import Properties from '../properties';
import Row from '../row';
import Panel from '../panel';
import * as Titles from '../titles';
import ThreadSimulation from './threadsimulation';
class RedHashThread extends Component {
    constructor(props) {
        super(props)
        var hashThread = new RedHash.HashThread(['me', 'myself', 'i'], 'me');
        this.state = {
            hashThread
        }
    }
    event() {

    }
    render() {
        var me = this;
        var { state } = me.props;

        return (
            <Row>
                <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                    <Panel title={Titles.HashThread}>
                        <h1>{Titles.What}</h1>
                        <p className="m-b-30">{Titles.WhatIsAHashEvent}</p>
                    </Panel>
                </div>
                <div className="col-lg-4 col-md-4 col-sm-6 col-xs-12">
                    <Panel title={Titles.Properties}>
                        <Properties object={this.state.hashThread} descriptions={RedHash.Documentation.HashThread} />
                    </Panel>
                </div>
                <div className="col-lg-4 col-md-4 col-sm-6 col-xs-12">
                    <Panel title={Titles.Methods}>
                        <Properties methods={true} object={this.state.hashThread} descriptions={RedHash.Documentation.HashThread} />
                    </Panel>
                </div>

                <div className="col-lg-4 col-md-4 col-sm-6 col-xs-12">
                    <Panel title={Titles.Statics}>
                        <Properties static={true} object={RedHash.HashThread} descriptions={RedHash.Documentation.HashThread} />
                    </Panel>
                </div>

                <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                    <Panel title={Titles.ThreadSimulation}>
                        <ThreadSimulation />
                    </Panel>
                </div>
            </Row>
        )
    }
}
RedHashThread = connect(Util.mapStateToProps, Util.mapDispatchToProps)(RedHashThread)

export default RedHashThread