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
    when(test, action) {
        var me = this;
        if (!test) {
            throw 'test is required';
        }
        this.promise = this.promise.then(() => {
            return new Promise((resolve, fail) => {
                me.applyId = me.machine.onApply(() => {
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
            });
        });

        return this;
    }
}