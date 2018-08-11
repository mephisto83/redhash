

import React, { Component } from 'react'
import { connect } from 'react-redux'
import * as Util from '../../util';
import * as UIA from '../../actions';
import RedHash from 'redhashgraph';
import Properties from '../properties';
import Row from '../row';
import Panel from '../panel';
import * as Titles from '../titles';

class RedHashMetaData extends Component {
    constructor(props) {
        super(props)
        this.state = {
            meta: {}
        }
    }
    componentDidMount() {
        var me = this;
        var size = me.props.size || 2;
        var meta = me.props.meta || RedHash.HashMeta.create(size);
        me.setState({ meta });
    }
    render() {
        var me = this;
        var { state } = me.props;
        var size = me.props.size || 2;
        var meta = me.state.meta || RedHash.HashMeta.create(size);
        if (me.props.disabled) {
            meta = me.props.meta;
        }
        var rawmeta = [...meta];
        var comps = [].interpolate(0, size, (index) => {
            var row = RedHash.HashMeta.row(meta, index, size);
            return (
                <div className="demo-button-toolbar clearfix">
                    <div key={'row' + index}
                        className="btn-toolbar" role="toolbar" aria-label="Toolbar with button groups">
                        <div className="btn-group" role="group" aria-label="First group">
                            {
                                row.map((t, i) => {
                                    return (<RippleButton title={(index * size + i < 10 ? '0' : '') + (index * size + i)} key={"ripp-" + i} bgColorCls={t ? 'btn bg-pink' : ''} onClick={() => {
                                        console.log('clicked');
                                        var newmeta = RedHash.HashMeta.setValue(me.state.meta, i, index, t === 0 ? 1 : 0, size);
                                        me.setState({ meta: newmeta });
                                    }} />);
                                })
                            }
                        </div>
                    </div>
                </div>)
        });

        return (
            <div>
                {this.props.title ? <p>{this.props.title}</p> : null}
                {comps}
                <p>{Titles.RawMetaData}</p>
                <div className="btn-group" role="group" aria-label="First group">
                    {
                        rawmeta.map((t, i) => {
                            return (<RippleButton title={(t < 10 ? '0' : '') + (t)} key={"ripp-" + i} bgColorCls={t ? 'btn bg-pink' : ''} />);
                        })
                    }
                </div>
            </div>
        )
    }
}
RedHashMetaData = connect(Util.mapStateToProps, Util.mapDispatchToProps)(RedHashMetaData)

export default RedHashMetaData

export class RippleButton extends Component {
    constructor(props) {
        super(props)
        this.state = {};
    }
    render() {
        var me = this;
        var rippleAttr = me.state.rippleAttr || {};
        return (
            <button ref={e => me.element = e} type="button" onClick={() => {
                var relativeX = 15;
                var relativeY = 14;
                var scale = 'scale(' + ((me.element.clientWidth / 100) * 3) + ')';
                var translate = 'translate(0,0)';
                var rippleClassList = [];
                rippleAttr = {
                    'data-hold': Date.now(),
                    'data-x': relativeX,
                    'data-y': relativeY,
                    'data-scale': scale,
                    'data-translate': translate
                }
                // Set ripple position
                var rippleStyle = {
                    top: relativeY + 'px',
                    left: relativeX + 'px',
                    transform: 'scale(0)' + ' ' + translate
                };
                var ripp2 = {};
                // Scale the ripple
                // rippleStyle['-webkit-transform'] = scale + ' ' + translate;
                // rippleStyle['-moz-transform'] = scale + ' ' + translate;
                // rippleStyle['-ms-transform'] = scale + ' ' + translate;
                // rippleStyle['-o-transform'] = scale + ' ' + translate;
                ripp2.transform = scale + ' ' + translate;
                ripp2.opacity = '1';

                var duration = me.props.effectDuration || 450;
                // rippleStyle['-webkit-transition-duration'] = duration + 'ms';
                // rippleStyle['-moz-transition-duration'] = duration + 'ms';
                // rippleStyle['-o-transition-duration'] = duration + 'ms';

                ripp2['transitionDuration'] = duration + 'ms';


                rippleAttr.style = rippleStyle;
                me.setState({
                    ripple: true,
                    rippleAttr,
                    rippleCls: 'waves-notransition'
                });
                setTimeout(() => {
                    me.setState({
                        rippleCls: '',
                        rippleAttr: Object.assign({}, me.state.rippleAttr,
                            Object.assign({ style: me.state.rippleAttr.style }),
                            { style: ripp2 })
                    });
                }, 100)
                setTimeout(() => {
                    me.setState({ rippleAttr: {}, ripple: false })
                }, 2000);
                if (me.props.onClick) {
                    me.props.onClick();
                }
            }} className={`btn waves-effect ${me.props.bgColorCls || ' btn-default'}`}>{this.props.title}
                {this.state.ripple ? (<div {...this.state.rippleAttr} className={`waves-ripple waves-rippling ${me.state.rippleCls}`}></div>) : null}
            </button>
        )
    }
}