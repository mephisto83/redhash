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
                // console.log('or bits')
                return _bits_ | bit_number;
            }
            return t;
        })]
    }
    static consensus(meta, size) {
        var remainder = meta.length * intsize - size * size;
        var mask = [].interpolate(0, intsize, () => 1).join('');
        var rmask = [].interpolate(0, intsize - remainder, () => 1).join('');
        var maskint = parseInt(mask, 10);
        var rmaskint = parseInt(rmask, 10);
        return meta.all((t, i) => {
            console.log(t);
            if (i === meta.length - 1) {
                console.log('use rmask')
                console.log(rmaskint);
                return (t ^ rmaskint) === 0;
            }
            return (maskint ^ t) === 0;
        });
    }
    static getBitIndexString(bit_index) {
        var numstring = [].interpolate(0, 32, (t, i) => {

            if (intsize - i - 1 === bit_index) {
                return 1;
            }
            return 0;
        }).join('')
        // console.log(`numstring ${numstring} ${ parseInt(numstring, 2)}`)
        return parseInt(numstring, 2);
    }
}