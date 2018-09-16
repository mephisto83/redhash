import MembershipStateMachine from './membershipstatemachine';
import * as MA from './membershipactions';
import assert from 'assert';
import IConnectionInfo from './iconnectioninfo';
const self = 'self';
const person = 'person';
const person2 = 'person2';

describe('MembershipStateMachine', function () {
    it('can create a hash line', () => {
        var machine = new MembershipStateMachine();
        assert.ok(machine);
    });

    it('can request contributor add', function () {
        var machine = new MembershipStateMachine({
            contributors: [self]
        });

        var state = machine.action([MA.INITIALIZE_STATE].map(t => { return { type: t } }));
        assert.equal(state.state, MA.INITIALIZE_STATE);
    });

    it('can initialize state', function () {
        var machine = new MembershipStateMachine({
            contributors: [self]
        });

        var state = machine.action([MA.INITIALIZE_STATE, MA.INITIALIZE_STATE].map(t => { return { type: t } }));
        assert.equal(state.state, MA.INITIALIZE_STATE);
    });


    it('can initialize state', function () {
        var machine = new MembershipStateMachine({
            contributors: [self]
        });

        var state = machine.action([MA.INITIALIZE_STATE, MA.INITIALIZE_STATE].map(t => { return { type: t } }));
        assert.equal(state.state, MA.INITIALIZE_STATE);
        assert.equal(machine.state.state, undefined);
    });

    it('can apply state to machine', () => {

        var machine = new MembershipStateMachine({
            contributors: [self]
        });

        var state = machine.action([MA.INITIALIZE_STATE, MA.INITIALIZE_STATE].map(t => { return { type: t } }));
        assert.equal(state.state, MA.INITIALIZE_STATE);
        assert.equal(machine.state.state, undefined);

        machine.applyState(state);
        assert.equal(machine.state.state, MA.INITIALIZE_STATE);
    });


    it('can initialize => request contributor add ', function () {
        var machine = new MembershipStateMachine({
            contributors: [self]
        });

        var state = machine.action(
            [...[MA.INITIALIZE_STATE].map(t => { return { type: t } }),
            {
                type: MA.REQUEST_CONTRIBUTOR_ADD,
                // Need to have all the information required, to make a connection between clients
                connectionInfo: new IConnectionInfo(person)
            }
            ]);
        assert.equal(state.state, MA.REQUEST_CONTRIBUTOR_ADD);
        assert.equal(machine.state.state, undefined);
    });


    it('can initialize => request contributor add , will only take the first one ', function () {
        var machine = new MembershipStateMachine({
            contributors: [self]
        });

        var state = machine.action(
            [...[MA.INITIALIZE_STATE].map(t => { return { type: t } }),
            {
                type: MA.REQUEST_CONTRIBUTOR_ADD,
                // Need to have all the information required, to make a connection between clients
                connectionInfo: new IConnectionInfo(person)
            }, {
                type: MA.REQUEST_CONTRIBUTOR_ADD,
                // Need to have all the information required, to make a connection between clients
                connectionInfo: new IConnectionInfo('person2')
            }]);
        assert.equal(state.state, MA.REQUEST_CONTRIBUTOR_ADD);
        assert.equal(state.contributorRequest.connectionInfo.name, person);
        assert.equal(machine.state.state, undefined);
    });



    it('can initialize => request contributor add => reject contributor', function () {
        var machine = new MembershipStateMachine({
            contributors: [self]
        });

        var state = machine.action([...[MA.INITIALIZE_STATE].map(t => { return { type: t } }), {
            type: MA.REQUEST_CONTRIBUTOR_ADD,
            // Need to have all the information required, to make a connection between clients
            connectionInfo: new IConnectionInfo(person)
        }, {
            from: self,
            type: MA.REJECT_CONTRIBUTOR_ADD,
            name: person
        }]);

        assert.equal(state.state, MA.REJECT_CONTRIBUTOR_ADD);
        assert.equal(machine.state.state, undefined);
    });


    it('can initialize => request contributor add => reject contributor, only with right name', function () {
        var machine = new MembershipStateMachine({
            contributors: [self]
        });

        var state = machine.action([...[MA.INITIALIZE_STATE].map(t => { return { type: t } }), {
            type: MA.REQUEST_CONTRIBUTOR_ADD,
            // Need to have all the information required, to make a connection between clients
            connectionInfo: new IConnectionInfo(person)
        }, {
            type: MA.REJECT_CONTRIBUTOR_ADD,
            from: self,
            name: person2
        }]);

        assert.equal(state.state, MA.REQUEST_CONTRIBUTOR_ADD);
        assert.equal(state.contributorElection.length, 0);
        assert.equal(machine.state.state, undefined);
    });

    it('can initialize => request contributor add => reject contributor, only the last vote will count.', function () {
        var machine = new MembershipStateMachine({
            contributors: [self]
        });

        var state = machine.action([...[MA.INITIALIZE_STATE].map(t => { return { type: t } }), {
            type: MA.REQUEST_CONTRIBUTOR_ADD,
            // Need to have all the information required, to make a connection between clients
            connectionInfo: new IConnectionInfo(person)
        }, {
            type: MA.REJECT_CONTRIBUTOR_ADD,
            from: self,
            name: person
        }, {
            type: MA.REJECT_CONTRIBUTOR_ADD,
            from: self,
            name: person
        }]);

        assert.equal(state.state, MA.REJECT_CONTRIBUTOR_ADD);
        assert.equal(state.contributorElection.length, 1);
        assert.equal(machine.state.state, undefined);
    });

    it('can initialize => request contributor add => reject contributor, only contributors can vote.', function () {
        var machine = new MembershipStateMachine({
            contributors: [self]
        });

        var state = machine.action([...[MA.INITIALIZE_STATE].map(t => { return { type: t } }), {
            type: MA.REQUEST_CONTRIBUTOR_ADD,
            // Need to have all the information required, to make a connection between clients
            connectionInfo: new IConnectionInfo(person)
        }, {
            type: MA.REJECT_CONTRIBUTOR_ADD,
            from: person,
            name: person
        }]);

        assert.equal(state.state, MA.REQUEST_CONTRIBUTOR_ADD);
        assert.equal(state.contributorElection.length, 0);
        assert.equal(machine.state.state, undefined);
    });


    it('can initialize => request contributor add => reject contributor, rejection state reached after all contributors have contributed.', function () {
        var machine = new MembershipStateMachine({
            contributors: [self]
        });

        var state = machine.action([...[MA.INITIALIZE_STATE].map(t => { return { type: t } }), {
            type: MA.REQUEST_CONTRIBUTOR_ADD,
            // Need to have all the information required, to make a connection between clients
            connectionInfo: new IConnectionInfo(person)
        }, {
            type: MA.REJECT_CONTRIBUTOR_ADD,
            from: self,
            name: person
        }]);

        assert.equal(state.state, MA.REJECT_CONTRIBUTOR_ADD);
        assert.equal(state.contributorElection.length, 1);
        assert.equal(machine.state.state, undefined);
    });

    it('can initialize => request contributor add => accept contributor, accept state reached after all contributors have contributed.', function () {
        var machine = new MembershipStateMachine({
            contributors: [self]
        });

        var state = machine.action([...[MA.INITIALIZE_STATE].map(t => { return { type: t } }), {
            type: MA.REQUEST_CONTRIBUTOR_ADD,
            // Need to have all the information required, to make a connection between clients
            connectionInfo: new IConnectionInfo(person)
        }, {
            type: MA.ACCEPT_CONTRIBUTOR_ADD,
            from: self,
            name: person
        }]);

        assert.equal(state.state, MA.ACCEPT_CONTRIBUTOR_ADD);
        assert.equal(state.contributorElection.length, 1);
        assert.equal(machine.state.state, undefined);
    });

    it('cant add someone already in as a contributor.', function () {
        var machine = new MembershipStateMachine({
            contributors: [self, person]
        });

        var state = machine.action([...[MA.INITIALIZE_STATE].map(t => { return { type: t } }), {
            type: MA.REQUEST_CONTRIBUTOR_ADD,
            // Need to have all the information required, to make a connection between clients
            connectionInfo: new IConnectionInfo(person)
        }, {
            type: MA.ACCEPT_CONTRIBUTOR_ADD,
            from: self,
            name: person
        }]);

        assert.equal(state.state, MA.INITIALIZE_STATE);
        assert.equal(state.contributorElection.length, 0);
        assert.equal(machine.state.state, undefined);
    });

    it('can initialize => request contributor add => reject contributor => initial', function () {
        var machine = new MembershipStateMachine({
            contributors: [self]
        });

        var state = machine.action([...[MA.INITIALIZE_STATE].map(t => { return { type: t } }), {
            type: MA.REQUEST_CONTRIBUTOR_ADD,
            // Need to have all the information required, to make a connection between clients
            connectionInfo: new IConnectionInfo(person)
        }, {
            type: MA.REJECT_CONTRIBUTOR_ADD,
            from: self,
            name: person
        }, {
            type: MA.INITIALIZE_STATE,
            from: self
        }]);

        assert.equal(state.state, MA.INITIALIZE_STATE);
        assert.equal(state.contributorElection.length, 0);
        assert.ok(!state.connectionInfo);
        assert.equal(machine.state.state, undefined);
    });


    it('can initialize => request contributor add => accept contributor => add contributor, accept state reached after all contributors have contributed.', function () {
        var machine = new MembershipStateMachine({
            contributors: [self]
        });

        var state = machine.action([...[MA.INITIALIZE_STATE].map(t => { return { type: t } }), {
            type: MA.REQUEST_CONTRIBUTOR_ADD,
            // Need to have all the information required, to make a connection between clients
            connectionInfo: new IConnectionInfo(person)
        }, {
            type: MA.ACCEPT_CONTRIBUTOR_ADD,
            from: self,
            name: person
        }, {
            type: MA.ADD_CONTRIBUTOR,
            from: self,
            name: person
        }]);

        assert.equal(state.state, MA.ADD_CONTRIBUTOR);
        assert.equal(state.contributorElection.length, 0);
        assert.equal(state.contributors.length, 1);
        assert.equal(state.proposed.length, 2);
        assert.equal(machine.state.state, undefined);
    });

    it('initialize after adding contributor.', function () {
        var machine = new MembershipStateMachine({
            contributors: [self]
        });

        var state = machine.action([...[MA.INITIALIZE_STATE].map(t => { return { type: t } }), {
            type: MA.REQUEST_CONTRIBUTOR_ADD,
            // Need to have all the information required, to make a connection between clients
            connectionInfo: new IConnectionInfo(person)
        }, {
            type: MA.ACCEPT_CONTRIBUTOR_ADD,
            from: self,
            name: person
        }, {
            type: MA.ADD_CONTRIBUTOR,
            from: self,
            name: person
        }, {
            type: MA.INITIALIZE_STATE
        }]);

        assert.equal(state.state, MA.ADD_CONTRIBUTOR);
        assert.equal(state.contributorElection.length, 0);
        assert.equal(state.contributors.length, 1);
        assert.equal(state.proposed.length, 2);
        assert.equal(machine.state.state, undefined);
    });

    it('can initialize => request contributor remove', function () {
        var machine = new MembershipStateMachine({
            contributors: [self, person, person2]
        });
        var state = machine.action([...[MA.INITIALIZE_STATE].map(t => { return { type: t } }), {
            type: MA.REQUEST_CONTRIBUTOR_REMOVE,
            name: person2
        }]);


        assert.equal(state.state, MA.REQUEST_CONTRIBUTOR_REMOVE);
        assert.equal(state.contributorElection.length, 0);
        assert.equal(state.contributors.length, 3);
        assert.ok(state.contributorRequest);
        assert.equal(machine.state.state, undefined);
    });


    it('can initialize => request contributor remove, only contributores can be removed', function () {
        var machine = new MembershipStateMachine({
            contributors: [self, person, person2]
        });
        var state = machine.action([...[MA.INITIALIZE_STATE].map(t => { return { type: t } }), {
            type: MA.REQUEST_CONTRIBUTOR_REMOVE,
            name: 'person3'
        }]);


        assert.equal(state.state, MA.INITIALIZE_STATE);
        assert.ok(!state.contributorRequest);
        assert.equal(state.contributorElection.length, 0);
        assert.equal(state.contributors.length, 3);
        assert.equal(machine.state.state, undefined);
    });

    it('can initialize => request contributor remove => reject removal of contributor ', function () {
        var machine = new MembershipStateMachine({
            contributors: [self, person, person2]
        });
        var state = machine.action([...[MA.INITIALIZE_STATE].map(t => { return { type: t } }), {
            type: MA.REQUEST_CONTRIBUTOR_REMOVE,
            name: person
        }, {
            type: MA.REJECT_CONTRIBUTOR_REMOVE,
            from: self,
            name: person
        }]);


        assert.equal(state.state, MA.REQUEST_CONTRIBUTOR_REMOVE);
        assert.equal(state.contributorElection.length, 1, 'state.contributorElection.length');
        assert.equal(state.contributors.length, 3);
        assert.equal(machine.state.state, undefined);
    });

    it('can initialize => request contributor remove => reject removal of contributor, MUST send the correct name to vote on. ', function () {
        var machine = new MembershipStateMachine({
            contributors: [self, person, person2]
        });
        var state = machine.action([...[MA.INITIALIZE_STATE].map(t => { return { type: t } }), {
            type: MA.REQUEST_CONTRIBUTOR_REMOVE,
            name: person2
        }, {
            type: MA.REJECT_CONTRIBUTOR_REMOVE,
            from: self,
            name: person
        }]);


        assert.equal(state.state, MA.REQUEST_CONTRIBUTOR_REMOVE);
        assert.equal(state.contributorElection.length, 0, 'state.contributorElection.length');
        assert.equal(state.contributors.length, 3);
        assert.equal(machine.state.state, undefined);
    });

    it('can initialize => request contributor remove => reject removal of contributor => initial', function () {
        var machine = new MembershipStateMachine({
            contributors: [self, person, person2]
        });
        var state = machine.action([...[MA.INITIALIZE_STATE].map(t => { return { type: t } }), {
            type: MA.REQUEST_CONTRIBUTOR_REMOVE,
            // Need to have all the information required, to make a connection between clients
            name: person
        }, {
            type: MA.REJECT_CONTRIBUTOR_REMOVE,
            from: self,
            name: person
        }, {
            type: MA.REJECT_CONTRIBUTOR_REMOVE,
            from: person2,
            name: person
        }]);

        //the person getting removed doesnt get a vote that counts

        assert.equal(state.state, MA.REJECT_CONTRIBUTOR_REMOVE);
        assert.equal(state.contributorElection.length, 2);
        assert.equal(state.contributors.length, 3);
        assert.equal(machine.state.state, undefined);
    });


    it('can initialize => request contributor remove => reject removal of contributor => initial', function () {
        var machine = new MembershipStateMachine({
            contributors: [self, person, person2]
        });
        var state = machine.action([...[MA.INITIALIZE_STATE].map(t => { return { type: t } }), {
            type: MA.REQUEST_CONTRIBUTOR_REMOVE,
            name: person,
            thread: 'thread',
            threadType: 'EVENT_THREAD',
        }, {
            type: MA.ACCEPT_CONTRIBUTOR_REMOVE,
            from: self,
            name: person
        }, {
            type: MA.ACCEPT_CONTRIBUTOR_REMOVE,
            from: person2,
            name: person
        }]);

        //the person getting removed doesnt get a vote that counts

        assert.equal(state.state, MA.REMOVE_CONTRIBUTOR);
        console.log(state.contributorElection);
        assert.equal(state.contributorElection.length, 2);
        assert.ok(state.thread);
        assert.ok(state.threadType);
        assert.equal(state.contributors.length, 3);
        assert.equal(machine.state.state, undefined);
    });

    it('can initialize => request contributor remove => reject removal of contributor => initial', function () {
        var machine = new MembershipStateMachine({
            contributors: [self, person, person2]
        });
        var state = machine.action([...[MA.INITIALIZE_STATE].map(t => { return { type: t } }), {
            type: MA.REQUEST_CONTRIBUTOR_REMOVE,
            // Need to have all the information required, to make a connection between clients
            name: person
        }, {
            type: MA.REJECT_CONTRIBUTOR_REMOVE,
            from: self,
            name: person
        }, {
            type: MA.REJECT_CONTRIBUTOR_REMOVE,
            from: person,
            name: person
        }]);

        //the person getting removed doesnt get a vote that counts

        assert.equal(state.state, MA.REQUEST_CONTRIBUTOR_REMOVE);
        assert.equal(state.contributorElection.length, 1);
        assert.equal(state.contributors.length, 3);
        assert.equal(machine.state.state, undefined);
    });


    it('can initialize => request contributor remove => reject removal of contributor => initial', function () {
        var machine = new MembershipStateMachine({
            contributors: [self, person, person2]
        });
        var state = machine.action([...[MA.INITIALIZE_STATE].map(t => { return { type: t } }), {
            type: MA.REQUEST_CONTRIBUTOR_REMOVE,
            // Need to have all the information required, to make a connection between clients
            name: person
        }, {
            type: MA.REJECT_CONTRIBUTOR_REMOVE,
            from: self,
            name: person
        }, {
            type: MA.REJECT_CONTRIBUTOR_REMOVE,
            from: person2,
            name: person
        }, {
            type: MA.INITIALIZE_STATE
        }]);

        //the person getting removed doesnt get a vote that counts

        assert.equal(state.state, MA.INITIALIZE_STATE);
        assert.equal(state.contributorElection.length, 0);
        assert.equal(state.contributors.length, 3);
        assert.equal(machine.state.state, undefined);
    });


    it('can initialize => request contributor remove => wont go to wrong state', function () {
        var machine = new MembershipStateMachine({
            contributors: [self, person, person2]
        });
        var state = machine.action([...[MA.INITIALIZE_STATE].map(t => { return { type: t } }), {
            type: MA.REQUEST_CONTRIBUTOR_REMOVE,
            // Need to have all the information required, to make a connection between clients
            name: person
        }, {
            type: MA.REJECT_CONTRIBUTOR_REMOVE,
            from: self,
            name: person
        }, {
            type: MA.ACCEPT_CONTRIBUTOR_ADD,
            from: person2,
            name: person
        }, {
            type: MA.INITIALIZE_STATE,
            from: person2,
            name: person
        }]);

        //the person getting removed doesnt get a vote that counts

        assert.equal(state.state, MA.REQUEST_CONTRIBUTOR_REMOVE);
        assert.equal(state.contributorElection.length, 1);
        assert.equal(state.contributors.length, 3);
        assert.equal(machine.state.state, undefined);
    });

    it('can update/refresh/change threads.', function () {
        var machine = new MembershipStateMachine({
            contributors: [self]
        });
        var thread = 'thread';
        var state = machine.action([...[MA.INITIALIZE_STATE].map(t => { return { type: t } }), {
            type: MA.REQUEST_CONTRIBUTOR_ADD,
            // Need to have all the information required, to make a connection between clients
            connectionInfo: new IConnectionInfo(person, { thread })
        }, {
            type: MA.ACCEPT_CONTRIBUTOR_ADD,
            from: self,
            name: person
        }, {
            type: MA.ADD_CONTRIBUTOR,
            from: self,
            name: person
        }, {
            type: MA.UPDATE_THREAD,
            from: self,
            thread
        }, {
            type: MA.THREAD_CUT_OFF,
            from: self,
            time: 0,
            thread
        }, {
            type: MA.THREAD_CUT_APPROVAL,
            from: self,
            range: { minimum: 10, maximum: 1000 },
            thread,
            time: 0
        }]);

        assert.equal(state.state, MA.THREAD_CUT_APPROVED);
        assert.equal(state.contributorElection.length, 0);
        assert.equal(state.contributors.length, 1);
        assert.equal(machine.state.state, undefined);
    });

    it('can update/refresh/change threads.', function () {
        var machine = new MembershipStateMachine({
            contributors: [self, person]
        });
        var thread = 'thread';
        var state = machine.action([...[MA.INITIALIZE_STATE].map(t => { return { type: t } }), {
            type: MA.REQUEST_CONTRIBUTOR_ADD,
            // Need to have all the information required, to make a connection between clients
            connectionInfo: new IConnectionInfo(person2, { thread })
        }, {
            type: MA.ACCEPT_CONTRIBUTOR_ADD,
            from: self,
            name: person2
        }, {
            type: MA.ACCEPT_CONTRIBUTOR_ADD,
            from: person,
            name: person2
        }, {
            type: MA.ADD_CONTRIBUTOR,
            from: self,
            name: person2
        }, {
            type: MA.UPDATE_THREAD,
            from: self,
            thread
        }, {
            type: MA.THREAD_CUT_OFF,
            from: self,
            time: 0,
            thread
        }, {
            type: MA.THREAD_CUT_APPROVAL,
            from: self,
            time: 0,
            range: { minimum: 10, maximum: 1000 },
            thread
        }]);

        assert.equal(state.state, MA.THREAD_CUT_OFF);
        assert.equal(state.contributorElection.length, 0);
        assert.equal(state.contributors.length, 2);
        assert.equal(machine.state.state, undefined);
    });

    it('can update/refresh/change threads. [reject]', function () {
        var machine = new MembershipStateMachine({
            contributors: [self]
        });
        var thread = 'thread';
        var state = machine.action([...[MA.INITIALIZE_STATE].map(t => { return { type: t } }), {
            type: MA.REQUEST_CONTRIBUTOR_ADD,
            // Need to have all the information required, to make a connection between clients
            connectionInfo: new IConnectionInfo(person, { thread })
        }, {
            type: MA.ACCEPT_CONTRIBUTOR_ADD,
            from: self,
            name: person
        }, {
            type: MA.ADD_CONTRIBUTOR,
            from: self,
            name: person
        }, {
            type: MA.UPDATE_THREAD,
            from: self,
            thread
        }, {
            type: MA.THREAD_CUT_OFF,
            from: self,
            thread,
            time: 0
        }, {
            type: MA.THREAD_CUT_REJECT,
            from: self,
            thread,
            time: 0
        }]);

        assert.equal(state.state, MA.THREAD_CUT_REJECTED);
        assert.equal(state.contributorElection.length, 0);
        assert.equal(state.contributors.length, 1);
        assert.equal(machine.state.state, undefined);
    });

    it('can update/refresh/change threads. [rejeted]', function () {
        var machine = new MembershipStateMachine({
            contributors: [self, person]
        });
        var thread = 'thread';
        var state = machine.action([...[MA.INITIALIZE_STATE].map(t => { return { type: t } }), {
            type: MA.REQUEST_CONTRIBUTOR_ADD,
            // Need to have all the information required, to make a connection between clients
            connectionInfo: new IConnectionInfo(person2, { thread })
        }, {
            type: MA.ACCEPT_CONTRIBUTOR_ADD,
            from: self,
            name: person2
        }, {
            type: MA.ACCEPT_CONTRIBUTOR_ADD,
            from: person,
            name: person2
        }, {
            type: MA.ADD_CONTRIBUTOR,
            from: self,
            name: person2
        }, {
            type: MA.UPDATE_THREAD,
            from: self,
            thread
        }, {
            type: MA.THREAD_CUT_OFF,
            from: self,
            time: 0,
            thread
        }, {
            type: MA.THREAD_CUT_REJECT,
            from: self,
            time: 0,
            thread
        }]);

        assert.equal(state.state, MA.THREAD_CUT_OFF);
        assert.equal(state.contributorElection.length, 0);
        assert.equal(state.contributors.length, 2);
        assert.equal(machine.state.state, undefined);
    });
});