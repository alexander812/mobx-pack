import { protoName } from './util';


export default function (appBinder) {
  return class BaseStore {
        disposers = [];
        disposerKeys = {};
        /**
         * Добавляет наблюдателя переменной, при необходимости именуется ключом
         * @public
         * @param {object} obsr
         * @param {string} key
         * @param {array} services
         * @returns {*|disposer}
         */

        addObserve(obsr, key, services) {
          if (!services || !appBinder.addDisposer(this.getConfig().bindAs, services, obsr)) {
            this.disposers.push(obsr);

            if (this.disposerKeys[key]) {
              console.error(`Observer with key "${key}" already exists in the store ${protoName(this)}`);
              return false;
            }

            if (key) {
              this.disposerKeys[key] = this.disposers.length - 1;
            }

            return this.disposers[this.disposers.length - 1];
          }
        }

        addObservers(obsrs, services) {
          obsrs.forEach((obsr) => {
            this.addObserve(obsr, null, services);
          });
        }
        /**
         * Удаляет именованный ключом наблюдатель переменной
         * @public
         * @param {string} key
         */
        _removeObserve(key) {
          if (typeof this.disposerKeys[key] === 'undefined') {
            console.error(`Observer with key "${key}" not fount in the store ${protoName(this)}`);
            return false;
          }

          this.disposers[this.disposerKeys[key]]();
          this.disposers[this.disposerKeys[key]] = null;
          delete this.disposerKeys[key];
          return undefined;
        }

        /**
         * Привязывает стор к глобальному биндеру
         * @public
         * @param {object} bindData
         */
        bindApp() {
          if (this.getConfig().hasOwnProperty('bindAs')) {
            appBinder.bind(this, this.getConfig().importData);
          }
        }
        /**
         * Отвязывает стор от глобального биндера
         * @public
         */
        unbindApp() {
          if (this.getConfig().bindAs) {
            appBinder.unbind(this);
          }
        }
        callApi(from, methodName, ...arg) {
          return appBinder.callApi(from, methodName, this.getConfig().bindAs, ...arg);
        }

        getConfig() {
          return this.config || {};
        }

        importVar(from, varName, raw) {
          return appBinder.importVar(from, varName, this.getConfig().bindAs, raw);
        }
        /**
         * Отвязывает стор от зависимостей перед удалением
         * @public
         */
        destroy() {
          this.disposers.forEach((obsr) => {
            obsr();
          });

          this.unbindApp();
        }
  };
}

