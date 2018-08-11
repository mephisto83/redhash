import { bindActionCreators } from 'redux';
import * as Actions from './actions';
export const mapStateToProps = (state, ownProps) => {
    return {
        state: state
    }
}

export const mapDispatchToProps = (dispatch) => {

    var result = bindActionCreators(Actions, dispatch);
    result.dispatch = dispatch;
    return result;
}

export function GUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

(function (array) {
    if (!array.interpolate) {
        Object.defineProperty(array, 'interpolate', {
            enumerable: false,
            writable: true,
            configurable: true,
            value: function (start, stop, func) {
                var collection = this;
                func = func || function (x) { return x; };
                for (var i = start; i < stop; i++) {
                    if (collection instanceof Float32Array) {
                        collection[i - start] = (func(i));
                    }
                    else
                        collection.push(func(i, i - start));
                }
                return collection;
            }
        });
    }
    if (!array.all) {
        Object.defineProperty(array, 'all', {
            enumerable: false,
            writable: true,
            configurable: true,
            value: function (func) {
                var collection = this;
                for (var i = 0; i < collection.length; i++) {
                    if (!func(collection[i], i)) {
                        return false;
                    }
                }
                return true;
            }
        });
    }

    if (!array.subset) {
        Object.defineProperty(array, 'subset', {
            enumerable: false,
            writable: true,
            configurable: true,
            value: function (start, stop) {
                var collection = this;
                stop = Math.min(collection.length, stop === undefined || stop === null ? collection.length : stop);
                start = Math.min(collection.length, start === undefined || start === null ? collection.length : start);
                start = start < 0 ? 0 : start;
                stop = stop < 0 ? 0 : stop;
                var result = this instanceof Float32Array ? new Float32Array(stop - start) : [];
                for (var i = start; i < stop; i++) {
                    if (this instanceof Float32Array) {
                        result[i - start] = collection[i];
                    }
                    else {
                        result.push(collection[i]);
                    }

                }
                return (result);
            }
        });
    }

    if (!array.random) {
        Object.defineProperty(array, 'random', {
            enumerable: false,
            writable: true,
            configurable: true,
            value: function () {
                var result = [...this];
                shuffle(result);
                return result;
            }
        });
        function shuffle(array) {
            var currentIndex = array.length, temporaryValue, randomIndex;

            // While there remain elements to shuffle...
            while (0 !== currentIndex) {

                // Pick a remaining element...
                randomIndex = Math.floor(Math.random() * currentIndex);
                currentIndex -= 1;

                // And swap it with the current element.
                temporaryValue = array[currentIndex];
                array[currentIndex] = array[randomIndex];
                array[randomIndex] = temporaryValue;
            }

            return array;
        }
    }

})(Array.prototype);