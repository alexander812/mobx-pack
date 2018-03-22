import _ from 'lodash';
import { observable, computed, action, transaction } from 'mobx';

class MessageCollection {
    @observable data = [];

    @computed get messages() {
        return _.reduce(this.data, (acc, item) => {
            acc[item.name] = {
                msg: item.message,
                type: item.type,
                name: item.name,
            };
            return acc;
        }, {});
    }

    @action clear() {
        this.data = [];
    }

    /**
     * @param names string | array
     */
    @action remove(names) {
        const fieldNames = _.isArray(names) ? names : names.split(',');
        this.data = this.data.filter(item => {
            return !fieldNames.includes(item.name);
        });
    }

    /**
     * @param data object
     */
    @action replace(data, type) {
        transaction(() => {
            this.clear();
            this.add(data, type);
        });
    }

    /**
     * @param data данные полученные
     */
    @action add(data, type) {
        _.reduce(data, (acc, item, key) => {
            acc.push({
                message: item[0],
                type: type,
                name: key,
            });
            return acc;
        }, this.data);
    }
}

export default MessageCollection;