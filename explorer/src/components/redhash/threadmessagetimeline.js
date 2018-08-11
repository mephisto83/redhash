import React, { Component } from 'react'
import { connect } from 'react-redux'
import * as Util from '../../util';
import * as UIA from '../../actions';
import RedHash from 'redhashgraph';
import Properties from '../properties';
import Row from '../row';
import Panel from '../panel';
import * as Titles from '../titles';
import * as d3 from "d3";
export default class ThreadMessageTimeline extends Component {
    constructor(props) {
        super(props)
        this.state = {};
    }
    componentDidMount() {
        this.setState({ mounted: true })
    }
    shouldComponentUpdate() {
        return !this.state.mounted;
    }
    componentWillReceiveProps() {
        var me = this;
        var threadGroupPaddingX = 20;
        var contribSubLinePaddingTop = 15;
        var contribSubLinePaddingBottom = 10;
        var keys = Object.keys(me.props.threadDic || {});
        var historyZoom = .4;
        var paddingBottom = 10;
        var paddingTop = 10;
        var threadGroupHeight = threadGroupPaddingX * keys.length + contribSubLinePaddingTop + contribSubLinePaddingBottom;
        console.log('will received props');
        var events = keys.map(t => {
            var thread = me.props.threadDic[t];
            thread.eventList
        });
        var outerBody = d3.select(me.body).selectAll('.outerBody').data([0]);
        // var bb = me.body.getBBox();
        // var bbx = bb.x;
        // var bby = bb.y;
        // var bbw = bb.width;
        // var bbh = bb.height;
        // var vb = [bbx, bby, bbw, bbh];
        me.body.setAttribute("height", threadGroupHeight + paddingTop + paddingBottom);

        outerBody
            .exit().remove();

        outerBody
            .enter()
            .append('g')
            .attr('transform', 'translate(10, 10)')
            .attr('class', 'outerBody');

        // body.enter()
        //     .append('g')
        //     .attr("class", "outerBody")
        //     .attr('transform', 'translate(0,29)');
        // body.exit().remove();

        var threadGroup = outerBody.selectAll('.thread');
        var threads = threadGroup.data(['communication']);

        // // Enter...
        threads.enter()
            .append('g')
            .attr('class', `thread`)
            .attr("transform", (d, index) => {
                return `translate(${threadGroupPaddingX} ,${index * threadGroupHeight})`
            })
            .append('text')
            .text(function (d) { return d; })
            .attr("font-family", "sans-serif")
            .attr("font-size", "12px")
            .attr("fill", "red");;

        var trans = me.props.messageTransitions;
        var sentLines = threads
            .append('g')
            .attr('class', 'contrib-sent-line')
            .attr('transform', (d) => {
                return `translate(${threadGroupPaddingX + 100},${contribSubLinePaddingTop})`
            })
            .selectAll('.event-sent-instance')
            .data(keys.map(function (key, index) {
                var thread = me.props.threadDic[key];
                return trans.map(t => {
                    var evt = thread.eventList.find(y => y.id === t.id);
                    if (evt) {
                        var from = evt.history[t.from];
                        var to = evt.history[t.to];
                        var con_1 = keys.indexOf(t.from);
                        var con_2 = keys.indexOf(t.to);
                        return {
                            x1: from * historyZoom,
                            y1: threadGroupPaddingX * con_1,
                            x2: to * historyZoom,
                            y2: threadGroupPaddingX * con_2
                        };
                    }
                    return null;
                }).filter(t => t && t.x2 !== undefined);
            }));

        sentLines.enter().append('g')
            .attr('class', 'event-sent-instance')
            .selectAll('.event-sent-ii')
            .data(d => d)
            .enter()
            .append('line')
            .attr('class', 'event-sent-ii')
            .attr('x1', d => {
                return d.x1;
            })
            .attr('y1', d => {
                return d.y1
            })
            .attr('x2', d => {
                return d.x2;
            })
            .attr('y2', d => {
                return d.y2;
            })
            .style('stroke', '#1452A7')
            .style('stroke-width', '.4')

        var contribLine = threads.selectAll('.contrib-sub-line')
            .data(keys, function (key, index) {
                var thread = me.props.threadDic[key];

                return {
                    events: thread.eventList,
                    contrib: key
                };
            });

        var contribLineBox = contribLine.enter()
            .append('g')
            .attr('class', `contrib-sub-line`)
            .attr("transform", (d, index) => {
                return `translate(${threadGroupPaddingX},${contribSubLinePaddingTop})`
            });
        var lines = contribLineBox
            .selectAll('.event-contrib-instance')
            .data(keys.map(function (key) {
                var t = me.props.threadDic[key];
                t = { events: [...t.eventList], contrib: key };
                return [...t.events.filter(v => v && v.history && v.history.hasOwnProperty(t.contrib))
                    .map(v => {
                        return {
                            contrib: t.contrib,
                            event: v
                        };
                    })];
            }));

        var t_line = lines.enter()
            .selectAll('.lines')
            .data(d => d)
            .enter()
            .append('g')
            .attr('transform', (d) => {
                var con_ = keys.indexOf(d.contrib);
                return `translate(100, ${threadGroupPaddingX * con_})`
            })
            .attr('class', 'lines');
        t_line
            .append('g')
            .attr('transform', 'translate(-100, 0)')
            .append('text')
            .text(function (d) { return d.contrib; })
            .attr("font-family", "sans-serif")
            .attr("font-size", "12px")
            .attr("fill", "red");;

        t_line.append('line')
            // x1="0" y1="0" x2="200" y2="200" style="stroke:rgb(255,0,0);stroke-width:2" 
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', 1000)
            .attr('y2', 0)
            .style('stroke', '#F7B801')
            .style('stroke-width', '1')

        var clbText = contribLineBox
            .selectAll('.event-contrib-instance')
            .data(keys.map(function (key) {
                var t = me.props.threadDic[key];
                t = { events: [...t.eventList], contrib: key };
                return [...t.events.filter(v => v && v.history && v.history.hasOwnProperty(t.contrib))
                    .map(v => {
                        return {
                            contrib: t.contrib,
                            event: v
                        };
                    })];
            }));

        clbText.enter()
            .selectAll('.circle-nodes')
            .append('g')
            .attr('transform', 'translate(100,0)')
            .data(d => d)
            .enter()
            .append('g')
            .attr('transform', (d) => {
                var con_ = keys.indexOf(d.contrib);
                return `translate(${(d.event.history[d.contrib] * historyZoom) + 100},${threadGroupPaddingX * con_})`
            })
            .attr('class', 'circle-nodes')
            .append('circle')
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', `3px`)
            .attr('fill', 'green')

        // Exit...
        sentLines.exit().remove()
        lines.exit().remove();
        clbText.exit().remove();
        contribLine.exit().remove();
        threads.exit().remove();
    }
    getEventInfo() {
        var me = this;
        var keys = Object.keys(me.props.threadDic || {});
        var events = keys.map(t => {
            var thread = me.props.threadDic[t];
            thread.eventList
        });
    }
    render() {
        var me = this;

        return (
            <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12" style={{
                overflow: 'scroll'
            }}>
                <svg ref={r => this.body = r} style={{ width: '20000' }}>

                </svg>
            </div>
        )
    }
}