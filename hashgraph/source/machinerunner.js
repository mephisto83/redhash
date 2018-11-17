export default class MachineRunner {
    constructor() {
        this.promise = Promise.resolve();
        this.machine = null;
    }
    static whenReady(call) {

    }
    static machine(machine) {
        var result = new MachineRunner();

        result.machine = machine;

        return result;
    }
    kickOff() {
        this.doKickOff = true;
        
        console.log('kick off');
        return this;
    }
    when(test, action) {
        var me = this;
        if (!test) {
            throw 'test is required';
        }
        console.log('machine runner when ----- ')
        this.promise = this.promise.then(() => {
            return new Promise((resolve, fail) => {
                console.log('adding on apply');
               
                me.applyId = me.machine.onApply(() => {
                    console.log('applied')
                    if (test(me.machine)) {
                        Promise.resolve().then(() => {
                            return action();
                        }).then((res) => {
                            me.machine.removeApply(me.applyId);
                            resolve(res);
                        }).catch(() => {
                            fail();
                        });
                    }
                });
                if (me.doKickOff) {
                    if (me.machine) {
                        me.machine.raiseApply();
                    }
                }
                console.log(me.applyId);
            });
        });

        return this;
    }
}