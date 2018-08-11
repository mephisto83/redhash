import React, { Component } from 'react'
import { connect } from 'react-redux'
import * as Util from '../util';
import Row from './row';
import Panel from './panel';
import * as UIA from '../actions';
import * as Titles from './titles';
import RedHashEvent from './redhash/hashevent';


class RedHash extends Component {
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
                    <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                        <Panel title={Titles.RedHash}>
                        </Panel>
                    </div>
                </Row>
            </div>
        )
    }
}
RedHash = connect(Util.mapStateToProps, Util.mapDispatchToProps)(RedHash)

export default RedHash