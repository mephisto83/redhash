let intsize = 32;
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
        var index = (x + y * size);
        var arrayIndex = Math.floor(index / intsize);
        var _bits_ = array[arrayIndex];
        var bit_index = (index - (arrayIndex * intsize));
        var bit_number = HashMeta.getBitIndexString(bit_index);

        return [...array.map((t, i) => {
            if (i === arrayIndex) {
                return _bits_ | bit_number;
            }
            return t;
        })];
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
            var num = HashMeta.getBitIndexString(index);
            return _bits_ & num ? 1 : 0;
        });
    }
    static rowOr(array, r1, r2, size) {
        var row1 = HashMeta.row(array, r1, size);
        var row2 = HashMeta.row(array, r2, size);
        console.log('row 1 ')
        console.log(row1)
        console.log('row 2 ')
        console.log(row2)
        var res = row1.map((val, i) => {
            return val | row2[i];
        });
        console.log('res ');
        console.log(res);
        res.map((t, i) => {
            console.log('set value ' + t)
            array = HashMeta.setValue(array, i, r1, t, size);
        });

        return array;
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
        var maskint = parseInt(mask, 10);
        var rmaskint = parseInt(rmask, 10);
        return meta.all((t, i) => {
            if (i === meta.length - 1) {
                return (t ^ rmaskint) === 0;
            }
            return (maskint ^ t) === 0;
        });
    }

    static getBitIndexString(bit_index) {
        if (bitIndexCache[bit_index] !== undefined) {
            return bitIndexCache[bit_index];
        }
        var numstring = [].interpolate(0, 32, (t, i) => {

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