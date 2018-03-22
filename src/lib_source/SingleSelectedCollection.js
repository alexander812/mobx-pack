import _ from 'lodash';
import { observable, action, toJS } from 'mobx';
import Collection from './Collection';

/**
 *  Класс коллекции где выбрана 1 модель.
 *
 */

class SingleSelectedCollection extends Collection {

    @observable selected = null;

    constructor(data, options) {
        super(data, options);

        const selected = _.find(this.models, { selected: true });

        if (selected) {
            this.selected = selected;
        }
    }

    onRemove(removed) {
        removed.some(model => {
            if (model.id === this.selected.id) {
                const lastModel = _.last(this.models);
                if (typeof lastModel === 'object') {
                    lastModel.selected = true;
                    this.selected = lastModel;
                } else {
                    this.selected = null;
                }
            }
            return true;
        });
    }

    @action update(data, options, ...parseArgs) {
        let removed;
        const added = [];
        const hash = {};

        if (data && !Array.isArray(data)) {
            data = [data];
        }

        data.forEach((model) => {
            if (this.options && this.options.dataParseModel) {
                model = this.options.dataParseModel.parse(model, ...parseArgs);
            }

            const origin = this.getById(model.id, true);

            hash[model.id] = 1;

            if (origin) {
                if (this.selected && this.selected.id === model.id) {
                    model.selected = true;
                }
                Object.assign(origin, model);
            } else if (!options || typeof options.add === 'undefined' || options.add) {
                model.selected = true;
                this.models.push(this.model ? Object.assign({}, this.model, model) : model);
                added.push(Object.assign({}, model));

                this.selected = _.find(this.models, { id: model.id });

                const toUnSelect = _.find(this.models, { selected: true });
                if (typeof toUnSelect !== 'undefined' && toUnSelect !== null) {
                    if (toUnSelect.id !== this.selected.id) {
                        toUnSelect.selected = false;
                    }
                }

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

    @action select(id) {
        var filter = (typeof id !== 'object') ? { id } : id;
        var toSelect = _.find(this.models, filter);
        var toUnSelect = this.selected || _.find(this.models, { selected: true });

        if (toSelect) {
            if (typeof toUnSelect !== 'undefined' && toUnSelect !== null) {
                toUnSelect.selected = false;
            }

            toSelect.selected = true;
            this.selected = toSelect;
        }
        return toSelect;
    }
}

export default SingleSelectedCollection;
