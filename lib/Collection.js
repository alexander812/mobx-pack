import _ from 'lodash';
import { observable, toJS, computed, action } from 'mobx';

/**
 *  Класс коллекции.
 *
 */

class Collection {

    idsHash = {};
    sortBy = [];
    options = null;
    @observable models = [];

    @computed get count() {
        return this.models.length;
    }

    constructor(data, options) {
        const added = [];
        this.map = _.map.bind(this, this.models);

        this.options = options;


        if (data && data.length) {
            data.forEach((m) => {
                this.models.push(Object.assign({}, m));
                added.push(Object.assign({}, m));
            });
        }

        if(added.length){
            this.onAdd(added);
        }

        this.sort();
    }

    sort() {
        const options = this.options;

        if (options && options.sort) {
            this.models = _.orderBy(this.models, options.sort, options.order);
        }

        this.updateHash();
    }

    updateHash(removed) {
        this.idsHash = {};

        if (this.models.length && (this.sortBy.length || typeof this.sortBy === 'function')) {
            this.models = _.sortBy(this.models, this.sortBy);
        }

        if (!this.models.length || typeof this.models[0].id === 'undefined') {
            return;
        }

        this.models.forEach((model, i) => {
            this.idsHash[model.id] = i;
        });
    }



    getById(id, raw) {
        if (raw) {
            return this.models.length > this.idsHash[id] ? this.models[this.idsHash[id]] : undefined;
        }
        return this.models.length > this.idsHash[id] ? toJS(this.models[this.idsHash[id]]) : undefined;
    }

    indexOf(id){
        return this.idsHash[id];
    }

    getFirst(cond, raw){
        return this.get(cond, raw)[0];
    }

    get(cond, raw) {
        if (raw) {
            return typeof cond === 'number' || typeof cond === 'string' ? this.getById(cond, true) : _.filter(this.models, cond);
        }
        return typeof cond === 'number' || typeof cond === 'string' ? this.getById(cond) : toJS(_.filter(this.models, cond));
    }

    onRemove() {
    }

    onAdd(){
    }

    @action reset(data) {

        this.models = _.clone(data);
        this.sort();
    }

    @action update(data, options) {
        let removed;
        const added = [];
        const hash = {};

        data.forEach((model) => {
            var origin = this.getById(model.id, true);

            hash[model.id] = 1;

            if (origin) {
                Object.assign(origin, model);
            } else if (!options || typeof options.add === 'undefined' || options.add) {
                this.models.push(this.model ? Object.assign({}, this.model, model) : model);
                added.push(Object.assign({}, model));
                this.onAdd();
                this.sort();
            }
        });

        if(added.length){
            this.onAdd(added);
        }

        if (!options || typeof options.remove === 'undefined' || options.remove) {
            removed = _.remove(this.models, m => !hash[m.id]);
        }

        if (removed && removed.length) {

            this.updateHash();
            this.onRemove(toJS(removed));
        }
    }

    @action remove(data) {
        let removed = [];

        if(Array.isArray(data)){
            data.forEach(model => {
                removed = removed.concat(_.remove(this.models, m => model.id === m.id));
            });
        } else {
            removed = _.remove(this.models, m => data === m.id);
        }

        if (removed && removed.length > 0) {
            this.updateHash(removed);
            this.onRemove(toJS(removed));
        }
    }
}

export default Collection;
