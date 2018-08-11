import React, { Component } from 'react'
import { connect } from 'react-redux'
import * as Util from '../util';
import NavBar from './navbar';

import TopBar from './topbar';
import Content from './content';
import * as Titles from './titles';
class Properties extends Component {
    constructor(props) {
        super(props)
        this.state = {
            menuOpen: false
        }
    }
    render() {
        var me = this;
        var { state, dispatch, object, descriptions } = this.props;

        var propers = [];
        var keys = [];
        var args = {};
        var descriptors = Object.getOwnPropertyDescriptors(object || {});
        descriptors = me.props.methods ? Object.getOwnPropertyDescriptors(Object.getPrototypeOf(object)) : descriptors;
        if (me.props.static || me.props.methods) {
            keys = Object.keys(descriptors).filter(t => {
                if (descriptors[t].value) {
                    var _func_ = descriptors[t].value.toString();
                    try {
                        var _arg = _func_.split(t)[1].split('{')[0];
                        args[t] = _arg;
                    }
                    catch (e) { }
                }
                return (descriptors[t] && descriptors[t].configurable && (me.props.methods || typeof (object[t]) === 'function'));
            });
        }
        else {
            keys = !object ? [] : Object.keys(object);
        }
        console.log(object);
        keys.map(key => {
            if (object.hasOwnProperty(key) || me.props.static || me.props.methods) {
                let type = null;
                let description = null;
                let __arg = null;
                if (args[key]) {
                    __arg = (<span className="col-teal" key={'args-k-' + key}>{args[key]} </span>);
                }
                if (descriptions && descriptions[key]) {

                    if (descriptions[key].type) {
                        type = <span className={"col-pink"}>[{descriptions[key].type}]</span>
                    }
                    if (descriptions[key].description) {
                        description = <span key={'desc-' + key} className={"col-blue-grey"}>{descriptions[key].description}</span>
                    }
                }
                propers.push((<p className="col-orange" key={'propkey-' + key}>
                    {type} <span className="font-bold">{key}</span> {__arg}  </p >));

                if (description) {
                    propers.push(description);
                }
            }
        }).filter(t => t)
        return (
            <div>
                <p>
                    <b>{this.props.title}</b>
                </p>
                {propers}
                {/* <p class="col-pink">Text pink color</p>
                <p class="col-cyan">Text cyan color</p>
                <p class="col-teal">Text teal color</p>
                <p class="col-orange">Text orange color</p>
                <p class="col-blue-grey">Text blue grey color</p> */}
            </div>
        )
    }
}
Properties = connect(Util.mapStateToProps, Util.mapDispatchToProps)(Properties)

export default Properties