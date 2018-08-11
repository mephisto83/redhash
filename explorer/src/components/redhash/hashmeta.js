import React, { Component } from 'react'
import { connect } from 'react-redux'
import * as Util from '../../util';
import * as UIA from '../../actions';
import RedHash from 'redhashgraph';
import Properties from '../properties';
import Row from '../row';
import Panel from '../panel';
import * as Titles from '../titles';
import HashMetaData from './hashmetadata';

class RedHashMeta extends Component {
    constructor(props) {
        super(props)
        var hashMeta = new RedHash.HashMeta.create(2);
        this.state = {
            hashMeta
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
                    <Panel title={Titles.HashEvent}>
                        <h1>{Titles.What}</h1>
                        <p className="m-b-30">{Titles.WhatIsAHashMeta}</p>
                    </Panel>
                </div>

                <div className="col-lg-4 col-md-4 col-sm-6 col-xs-12">
                    <Panel title={Titles.Statics}>
                        <Properties static={true} object={RedHash.HashMeta} descriptions={RedHash.Documentation.HashMeta} />
                    </Panel>
                </div>

                <div className="col-lg-8 col-md-8 col-sm-8 col-xs-12">
                    <Panel title={Titles.HashMetaExamples}>
                        <HashMetaData size={3} title={Titles.Default3X3} />

                        <HashMetaData size={10} title={Titles.Default10x10} />
                    </Panel>
                </div>
            </Row>
        )
    }
}
RedHashMeta = connect(Util.mapStateToProps, Util.mapDispatchToProps)(RedHashMeta)

export default RedHashMeta