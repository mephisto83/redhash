let intsize = 32;
export const _documentation = {
    create: {
        type: 'function',
        description: 'Create hashmeta data'
    },
    getSize: {
        type: 'function',
        description: 'Gets the size of the array used to represent the N x N array'
    },
    copy: {
        type: 'function',
        description: 'Creates a copy of the hash meta '
    },
    set: {
        type: 'function',
        description: 'Sets the (x,y) position of the hashmeta to the value'
    },
    setValue: {
        type: 'function',
        description: 'Sets the (x,y) position of the hashmeta to the value'
    },
    row: {
        type: 'function',
        description: 'Gets the nth row of the hashmeta data '
    },
    rows: {
        type: 'function',
        description: 'Gets the rows from the hashmeta'
    },
    column: {
        type: 'function',
        description: 'Gets the nth column from the hashmeta '
    },
    rowOr: {
        type: 'function',
        description: 'Performs an OR operation on two rows'
    },
    or: {
        type: 'function',
        description: 'Performs an OR operation on each corresponding index in the arrays passed'
    },
    getDiagonal: {
        type: 'function',
        description: 'Gets the diagonal of the hashmeta matrix'
    },
    consensus: {
        type: 'function',
        description: 'Returns true if all hashmeta has reaached consensus'
    },
    print: {
        type: 'function',
        description: 'Prints the hashmeta data to the console'
    },
    getBitIndexString: {
        type: 'function',
        description : 'Returns a string representing a binary number with the nth bit set to 1.'
    }
}
export default class HashMeta {
    static create(size) {
        var arraylength = Math.ceil(HashMeta.getSize(size));
        return [].interpolate(0, arraylength, () => 0);

    }
    static getSize(size) {
        return (size * size) / intsize;
    }
    static copy(meta) {
        if (meta)
            return [...meta];
        return meta;
    }
    /*
        Set the contributors to seen;
    */
    static set(array, x, y, val, size) {
        if (array) {
            var index = (x + y * size);
            var arrayIndex = Math.floor(index / (intsize));
            var _bits_ = array[arrayIndex];
            var bit_index = (index - (arrayIndex * intsize));

            var bit_number = HashMeta.getBitIndexString(bit_index);
            mconsole.log(`x:${x}, y:${y} => ${val}, index = ${index},  arrayIndex = ${arrayIndex}, bit_index = ${bit_index}`)
            mconsole.log(`${bit_number.toString(2).split('').join(' ')}`)
            return [...array.map((t, i) => {
                if (i === arrayIndex) {
                    mconsole.log(`${bit_number.toString(2).split('').join(' ')}`)
                    mconsole.log(`${_bits_.toString(2).split('').join(' ')}`)
                    mconsole.log(`${(_bits_ | bit_number).toString(2).split('-').join('').split('').join(' ')}`)
                    return _bits_ | bit_number;
                }
                return t;
            })];
        }
        return null;
    }
    static setValue(array, x, y, val, size) {
        var index = (x + y * size);
        var arrayIndex = Math.floor(index / intsize);
        var _bits_ = array[arrayIndex];
        var bit_index = (index - (arrayIndex * intsize));
        var bit_number = HashMeta.getBitIndexString(bit_index);

        return [...array.map((t, i) => {
            if (i === arrayIndex) {
                if (val) {
                    return _bits_ & bit_number ? _bits_ : (_bits_ | bit_number);
                }
                else {
                    return _bits_ & bit_number ? _bits_ ^ bit_number : _bits_;
                }
            }
            return t;
        })];
    }

    static row(array, row, size) {
        return [].interpolate(0, size, (i) => {
            var index = (i + row * size);
            var arrayIndex = Math.floor(index / intsize);
            var _bits_ = array[arrayIndex];
            var bit_index = (index - (arrayIndex * intsize));
            var num = HashMeta.getBitIndexString(bit_index);
            return _bits_ & num ? 1 : 0;
        });
    }
    static rows(array, row, size) {
        return [].interpolate(0, size, (i) => {
            return HashMeta.row(array, i, size);
        })
    }
    static column(array, col, size) {
        return [].interpolate(0, size, (i) => {
            var index = (col + i * size);
            var arrayIndex = Math.floor(index / intsize);
            var _bits_ = array[arrayIndex];
            var bit_index = (index - (arrayIndex * intsize));
            var num = HashMeta.getBitIndexString(bit_index);
            return _bits_ & num ? 1 : 0;
        });
    }
    static rowOr(array, r1, r2, size) {
        if (array) {
            var row1 = HashMeta.row(array, r1, size);
            var row2 = HashMeta.row(array, r2, size);
            mconsole.log('row 1 ')
            mconsole.log(row1)
            mconsole.log('row 2 ')
            mconsole.log(row2)
            var res = row1.map((val, i) => {
                return val | row2[i];
            });
            mconsole.log('res ');
            mconsole.log(res);
            res.map((t, i) => {
                mconsole.log('set value ' + t)
                array = HashMeta.setValue(array, i, r1, t, size);
            });

            return array;
        }
        return null;
    }
    static or(array1, array2) {
        return [].interpolate(0, array1.length, (i) => {
            return array1[i] | array2[i];
        })
    }
    static getDiagonal(array, size) {
        return [].interpolate(0, size, function (i) {
            var index = (i + i * size);
            var arrayIndex = Math.floor(index / intsize);
            var _bits_ = array[arrayIndex];
            var bit_index = (index - (arrayIndex * intsize));
            var num = HashMeta.getBitIndexString(index);
            return _bits_ & num;
        });
    }

    static consensus(meta, size) {
        var remainder = meta.length * intsize - size * size;
        var mask = [].interpolate(0, intsize, () => 1).join('');
        var rmask = [].interpolate(0, intsize - remainder, () => 1).join('');
        var maskint = parseInt(mask, 2);
        var rmaskint = parseInt(rmask, 2);

        return meta.all((t, i) => {
            if (i === meta.length - 1) {
                return (t ^ rmaskint) === 0;
            }
            return (maskint ^ t) === 0;
        });
    }
    static print(meta, size, showIndices) {
        if (!meta || !meta.map || !size) {
            return;
        }
        console.log('------------------------')
        for (var i = 0; i < size; i++) {
            console.log(`row ${i} - ${HashMeta.row(meta, i, size).join('  ')}`);
        }
        console.log('------------------------')

        if (showIndices) {
            console.log('------------------------')
            for (var i = 0; i < size; i++) {
                console.log(`row ${i} - ${HashMeta.row(meta, i, size).map((t, tt) => {
                    return (i * size) + tt;
                }).join('  ')}`);
            }
            console.log('------------------------');
        }
    }

    static getBitIndexString(bit_index) {
        if (bit_index > intsize) {
            throw 'out of bounds'
        }
        if (bitIndexCache[bit_index] !== undefined) {
            return bitIndexCache[bit_index];
        }
        var numstring = [].interpolate(0, intsize, (t, i) => {

            if (intsize - i - 1 === bit_index) {
                return 1;
            }
            return 0;
        }).join('')
        bitIndexCache[bit_index] = parseInt(numstring, 2);
        return bitIndexCache[bit_index]
    }
}
const bitIndexCache = {}

const debug = false;
const mconsole = {
    log: (m) => {
        if (debug)
            console.log(m);
    }
}