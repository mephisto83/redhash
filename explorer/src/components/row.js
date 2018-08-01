import React, { Component } from 'react'
import { connect } from 'react-redux'
import * as Util from '../util';
import NavBar from './navbar';
import TopBar from './topbar';
import Content from './content';
class Row extends Component {
    constructor(props) {
        super(props)
        this.state = {
            menuOpen: false
        }
    }
    render() {

        var { state, dispatch } = this.props;
        return (
            <div class="row clearfix">
                {this.props.children}
            </div>
        )
    }
}
Row = connect(Util.mapStateToProps, Util.mapDispatchToProps)(Row)

export default Row