import _ from 'lodash';

export default class Model{

    parse(data) {

        return this.generate(data);
    }

    parseUpdate(data){
        return this.generate(data);
    }

    parseAll(data, a1, a2, a3){
        if(Array.isArray(data)){

            return data.map((item)=>{
                return this.parse(item, a1, a2, a3);
            });
        }
    }

    parseUpdateAll(data, a1, a2, a3){
        if(Array.isArray(data)){
            return data.map((item)=>{
                return this.parseUpdate(item, a1, a2, a3);
            });
        }
    }

    generate(data){
        const result = {};

        _.each(this.attributes, (opt, key) => {
            result[key] = data && typeof data[key] !== 'undefined' ? data[key] : opt.value;
        });

        return result;
    }

    getDefault(attrName){
        return this.attributes && this.attributes[attrName] && this.attributes[attrName].value;
    }

    toBoolean(v){
        return typeof v === 'string' && (v === 'false' || v === 'true' || v === '0' || v === '1') ? v ==='true' || v ==='1' : Boolean(v);
    }

    /**
     *
     * @param extensionOfRules
     */
    getConstraints(extensionOfRules) {
        return _.reduce(this.attributes, (result, item) => {
            if (item.hasOwnProperty('constraints')) {
                if (extensionOfRules) {
                    result = _.merge(result, _.merge(item.constraints, extensionOfRules));
                } else {
                    result = _.merge(result, item.constraints);
                }
            }
            return result;
        }, {});
    }

}