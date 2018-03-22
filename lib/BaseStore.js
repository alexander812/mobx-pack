'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.default = function (appBinder) {
  return function () {
    function BaseStore() {
      _classCallCheck(this, BaseStore);

      this.disposers = [];
      this.disposerKeys = {};
    }

    _createClass(BaseStore, [{
      key: 'addObserve',

      /**
       * Добавляет наблюдателя переменной, при необходимости именуется ключом
       * @public
       * @param {object} obsr
       * @param {string} key
       * @param {array} services
       * @returns {*|disposer}
       */

      value: function addObserve(obsr, key, services) {
        if (!services || !appBinder.addDisposer(this.getConfig().bindAs, services, obsr)) {
          this.disposers.push(obsr);

          if (this.disposerKeys[key]) {
            console.error('Observer with key "' + key + '" already exists in the store ' + (0, _util.protoName)(this));
            return false;
          }

          if (key) {
            this.disposerKeys[key] = this.disposers.length - 1;
          }

          return this.disposers[this.disposers.length - 1];
        }
      }
    }, {
      key: 'addObservers',
      value: function addObservers(obsrs, services) {
        var _this = this;

        obsrs.forEach(function (obsr) {
          _this.addObserve(obsr, null, services);
        });
      }
      /**
       * Удаляет именованный ключом наблюдатель переменной
       * @public
       * @param {string} key
       */

    }, {
      key: '_removeObserve',
      value: function _removeObserve(key) {
        if (typeof this.disposerKeys[key] === 'undefined') {
          console.error('Observer with key "' + key + '" not fount in the store ' + (0, _util.protoName)(this));
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

    }, {
      key: 'bindApp',
      value: function bindApp() {
        if (this.getConfig().hasOwnProperty('bindAs')) {
          appBinder.bind(this, this.getConfig().importData);
        }
      }
      /**
       * Отвязывает стор от глобального биндера
       * @public
       */

    }, {
      key: 'unbindApp',
      value: function unbindApp() {
        if (this.getConfig().bindAs) {
          appBinder.unbind(this);
        }
      }
    }, {
      key: 'callApi',
      value: function callApi(from, methodName) {
        for (var _len = arguments.length, arg = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
          arg[_key - 2] = arguments[_key];
        }

        return appBinder.callApi.apply(appBinder, [from, methodName, this.getConfig().bindAs].concat(arg));
      }
    }, {
      key: 'getConfig',
      value: function getConfig() {
        return this.config || {};
      }
    }, {
      key: 'importVar',
      value: function importVar(from, varName, raw) {
        return appBinder.importVar(from, varName, this.getConfig().bindAs, raw);
      }
      /**
       * Отвязывает стор от зависимостей перед удалением
       * @public
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.disposers.forEach(function (obsr) {
          obsr();
        });

        this.unbindApp();
      }
    }]);

    return BaseStore;
  }();
};

var _util = require('./util');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }