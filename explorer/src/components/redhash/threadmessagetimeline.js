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
    componentWillUnmount() {
        var ok = this;
        this.updateTimeline(true);
    }
    //     shouldComponentUpdate() {
    // return true;
    //         return !this.state.mounted;
    //     }
    componentWillReceiveProps() {
        this.updateTimeline()
        this.updateTimeline()
    }
    updateTimeline(clear) {
        var me = this;
        var threadGroupPaddingX = 20;
        var contribSubLinePaddingTop = 15;
        var contribSubLinePaddingBottom = 10;
        var keys = clear ? [] : Object.keys(me.props.threadDic || {});
        var historyZoom = .4;
        var paddingBottom = 10;
        var paddingTop = 10;
        var threadGroupHeight = threadGroupPaddingX * keys.length + contribSubLinePaddingTop + contribSubLinePaddingBottom;
        console.log('will received props');
        var events = keys.map(t => {
            var thread = me.props.threadDic[t];
            return thread.eventList
        });
        var outerBody = d3.select(me.body).selectAll('.outerBody').data(clear ? [] : [1]);
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
        var threads = threadGroup.data(clear ? [] : ['communication']);
        // // Enter...
        threads.exit().remove();
        threads.enter().append('g')
            .attr('class', `thread`)
            .attr("transform", (d, index) => {
                return `translate(${threadGroupPaddingX} ,${index * threadGroupHeight})`
            })
            .append('text')
            .text(function (d) { return d; })
            .attr("font-family", "sans-serif")
            .attr("font-size", "12px")
            .attr("fill", "red")
        var lineholder = threads.selectAll('.line-holder').data([1]);
        lineholder.exit().remove();
        lineholder.enter().append('g')
            .attr("transform", (d, index) => {
                return `translate(${threadGroupPaddingX + 100},${contribSubLinePaddingTop})`
            })
            .attr('class', 'line-holder');

        var trans = clear ? [] : me.props.messageTransitions;
        var sentLines = lineholder
            .selectAll('.event-sent-ii')
            .data(trans.map(t => {
                var evt = null;
                Object.keys(me.props.threadDic).find(g => {
                    var temp = me.props.threadDic[g];
                    if (g === t.from) {
                        var found = temp.eventList.find(y => y.id === t.id);
                        if (!evt) {
                            evt = found;
                        }
                    }
                });
                if (evt) {
                    var from = evt.history[t.from];
                    var to = t.time || evt.history[t.to];
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
            }).filter(t => t && !isNaN(t.x2)));

        console.log(trans);
        sentLines.exit().remove();
        sentLines.enter().append('line')
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
            .style('stroke-width', '.4');

        var contribLine = threads.selectAll('.contrib-sub-line')
            .data([keys[0]].filter(t => t));
        contribLine.exit().remove();

        var contribLineBox = contribLine.enter()
            .append('g')
            .attr('class', `contrib-sub-line`)
            .attr("transform", (d, index) => {
                return `translate(${threadGroupPaddingX},${contribSubLinePaddingTop})`
            });
        var contributors = contribLineBox
            .selectAll('.contributors')
            .data(keys);
        contributors.exit().remove();
        contributors.enter()
            .append('g')
            .attr('transform', (d) => {
                var con_ = keys.indexOf(d);
                return `translate(0, ${threadGroupPaddingX * con_})`
            })
            .attr('class', 'contributors')
            .append('text')
            .text(function (d) { return d; })
            .attr("font-family", "sans-serif")
            .attr("font-size", "12px")
            .attr("fill", "blue");;

        var lines = contribLineBox
            .selectAll('.lines')
            .data(keys);
        lines.exit().remove();
        lines.enter()
            .append('g')
            .attr('transform', (d) => {
                var con_ = keys.indexOf(d);
                return `translate(100, ${threadGroupPaddingX * con_})`
            })
            .attr('class', 'lines').append('line')
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', 10000)
            .attr('y2', 0)
            .style('stroke', '#F7B801')
            .style('stroke-width', '1');
        var c_data = trans.map(t => {
            var evt = null;
            Object.keys(me.props.threadDic).find(g => {
                var temp = me.props.threadDic[g];
                if (g === t.from) {
                    var found = temp.eventList.find(y => y.id === t.id);
                    if (!evt) {
                        evt = found;
                    }
                }
            });
            if (evt) {
                var from = evt.history[t.from];
                var to = t.time || evt.history[t.to];
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
        }).filter(t => t && !isNaN(t.x2))
        var circles = lineholder
            .selectAll('.event-sent-circles.x1-y1')
            .data(c_data);
        circles.exit().remove();
        circles.enter().append('g')
            .attr('transform', (d) => {
                return `translate(${(d.x1)},${d.y1})`
            })
            .attr('class', 'event-sent-circles x1-y1')
            .append('circle')
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', `3px`)
            .attr('fill', 'green')
      
            var circles = lineholder
            .selectAll('.event-sent-circles.x2-y2')
            .data(c_data);
        circles.exit().remove();
        circles.enter().append('g')
            .attr('transform', (d) => {
                return `translate(${(d.x2)},${d.y2})`
            })
            .attr('class', 'event-sent-circles x2-y2')
            .append('circle')
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', `3px`)
            .attr('fill', 'red')
      
        // t_line.append('g')
        //     .attr('transform', 'translate(-100, 0)')
        //     .append('text')
        //     .text(function (d) { return d.contrib; })
        //     .attr("font-family", "sans-serif")
        //     .attr("font-size", "12px")
        //     .attr("fill", "red");;

        // t_line

        // var clbText = contribLineBox
        //     .selectAll('.event-contrib-instance')
        //     .data(keys.map(function (key) {
        //         var t = me.props.threadDic[key];
        //         t = { events: [...t.eventList], contrib: key };
        //         return [...t.events.filter(v => v && v.history && v.history.hasOwnProperty(t.contrib))
        //             .map(v => {
        //                 return {
        //                     contrib: t.contrib,
        //                     event: v
        //                 };
        //             })];
        //     }));

        // clbText.enter()
        //     .selectAll('.circle-nodes')
        //     .append('g')
        //     .attr('transform', 'translate(100,0)')
        //     .data(d => d)
        //     .enter()
        //     .append('g')
        //     .attr('transform', (d) => {
        //         var con_ = keys.indexOf(d.contrib);
        //         return `translate(${(d.event.history[d.contrib] * historyZoom) + 100},${threadGroupPaddingX * con_})`
        //     })
        //     .attr('class', 'circle-nodes')
        //     .append('circle')
        //     .attr('cx', 0)
        //     .attr('cy', 0)
        //     .attr('r', `3px`)
        //     .attr('fill', 'green')

        // Exit...
        //
        // lines.exit().remove();
        // clbText.exit().remove();


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