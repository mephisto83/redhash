import React, { Component } from 'react'
import { connect } from 'react-redux'
import * as Util from '../util';
class DropDown extends Component {
    constructor(props) {
        super(props)
        this.state = {
            open: false
        }
    }
    render() {

        var { state, dispatch } = this.props;
        return (
            <ul className={`header-dropdown m-r--5 ${this.state.open ? 'menu' : null}`}>
                <li className="dropdown">
                    <a href="javascript:void(0);" onClick={() => {
                        me.setState({ open: !this.state.open })
                    }} className="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">
                        <i className="material-icons">more_vert</i>
                    </a>

                    <ul className="dropdown-menu pull-right">
                        <li><a href="javascript:void(0);">Action</a></li>
                        <li><a href="javascript:void(0);">Another action</a></li>
                        <li><a href="javascript:void(0);">Something else here</a></li>
                    </ul>
                </li>
            </ul>
        )
    }
}
DropDown = connect(Util.mapStateToProps, Util.mapDispatchToProps)(DropDown)

export default DropDown