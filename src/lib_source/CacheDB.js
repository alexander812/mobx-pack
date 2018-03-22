import { setCookie, getCookie } from './util';

class CacheDB {

    options = {};

    store = {};

    constructor({ target = 'cookie' }) {
        this.options.target = target;
    }

    /**
     * Сохраняет переменную в кэш
     * @public
     * @param {string} key
     * @param {*|string} value
     */
    set(key, value, options) {
        var o = this.options;
        var expired = options && options.expired;

        this.store[key] = value;

        if (o.target === 'cookie') {
            setCookie(`props[${key}]`, value, expired);
        }

        return true;
    }

    /**
     * получает переменную из кэша
     * @public
     * @param {string} key
     * @param {*|string} def
     * @return {*}
     */
    get(key, def) {
        var o = this.options;
        var value;

        if(typeof this.store[key] !== 'undefined'){
            value = this.store[key];
        } else if (o.target === 'cookie') {
            try{
                value = JSON.parse(getCookie(`props[${key}]`));
            }catch(err){
                console.log(err);
            }
        }

        return value !== undefined && value !== null ? value : def;
    }
}

export default CacheDB;
