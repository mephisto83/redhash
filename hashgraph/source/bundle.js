import HashGraph from './index';
import HashEvent from './hashevent';
import { _documentation } from './hashevent';
import HashLine from './hashline';
import HashMeta from './hashmeta';
import * as HashMetaData from './hashmeta';
import HashThread from './hashthread';
import * as HashThreadData from './hashthread';
import Interfaces from './interfaces';
import IConnectionInfo from './statemachines/iconnectioninfo';
import MembershipActions from './statemachines/membershipactions';
import MembershipStateMachine from './statemachines/membershipstatemachine';
import NodeServer from './server/nodeserver';
import hashevent from '../../explorer/node_modules/redhashgraph/distribution/hashevent';
import ServerSocket from './server/serversocket';
import TestMessageService from './testmessageservice';


function strarse(t) {
    return JSON.parse(JSON.stringify(t))
}

export default {
    HashEvent,
    HashGraph,
    HashLine,
    HashMeta,
    HashThread,
    Interfaces,
    IConnectionInfo,
    MembershipActions,
    MembershipStateMachine,
    NodeServer,
    ServerSocket,
    strarse,
    TestMessageService,
    Documentation: {
        HashMeta: HashMetaData._documentation,
        HashEvent: _documentation,
        HashThread: HashThreadData._documentation
    }
}