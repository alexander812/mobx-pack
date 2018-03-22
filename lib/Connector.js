'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _mobxReact = require('mobx-react');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _util = require('./util');

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function ConnectorF(Component) {
  var _class, _class2, _temp;

  var opt = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var options = Object.assign({
    wairForServices: true,
    services: [],
    test: 0
  }, opt);

  var Connector = (0, _mobxReact.observer)(_class = (_temp = _class2 = function (_React$Component) {
    _inherits(Connector, _React$Component);

    function Connector() {
      _classCallCheck(this, Connector);

      return _possibleConstructorReturn(this, (Connector.__proto__ || Object.getPrototypeOf(Connector)).apply(this, arguments));
    }

    _createClass(Connector, [{
      key: 'getChildContext',

      // static defaultProps = Component.defaultProps || {};

      value: function getChildContext() {
        return {
          store: this.store
        };
      }
    }, {
      key: 'componentWillMount',
      value: function componentWillMount() {
        var _this2 = this;

        this.servicesLoaded = false;
        this.options = options;
        this.componentId = Component.name + '_' + (0, _util.getUid)();

        // console.log(['componentId', this.componentId]);

        if (this.options.services.length) {
          Promise.all(this.options.services.map(function (service) {
            if (_this2.options.test) {
              console.log(['service', service]);
            }
            if (!service) {
              console.log(['this.componentId', _this2.options.services, _this2.componentId]);
            }
            return service.start(_this2.componentId);
          })).then(function () {
            _this2.initComponent();

            if (_this2.options.wairForServices) {
              _this2.forceUpdate();
            }
          });
        }

        if (!this.options.services.length || !this.options.wairForServices) {
          this.initComponent();
        }
      }
    }, {
      key: 'initComponent',
      value: function initComponent() {
        this.servicesLoaded = true;
        // TODO remove options, stores
        this.toDestroy = [];
        this.storesResolved = [];
        this.apiResolved = null;

        this.resolveStores(options.store || this.props.store);
        this.resolveApi();

        this.store = this.storesResolved[0];
      }
    }, {
      key: 'shouldComponentUpdate',
      value: function shouldComponentUpdate() {
        var pass = false;

        if (this.options && this.options.shouldComponentUpdate) {
          for (var _len = arguments.length, arg = Array(_len), _key = 0; _key < _len; _key++) {
            arg[_key] = arguments[_key];
          }

          pass = this.options.shouldComponentUpdate.apply(this, arg);
        }

        return pass;
      }
    }, {
      key: 'componentWillUnmount',
      value: function componentWillUnmount() {
        var _this3 = this;

        this.toDestroy.forEach(function (resolved) {
          if (resolved.destroy) {
            resolved.destroy();
          }
        });

        if (this.options.services) {
          this.options.services.forEach(function (service) {
            service.stop(_this3.componentId);
          });
        }
      }
    }, {
      key: 'resolveStore',
      value: function resolveStore(store) {
        var resolved = typeof store === 'function' ? store.call(this) : store;

        if (typeof store === 'function') {
          if (resolved) {
            this.toDestroy.push(resolved);
          } else {
            console.warn('In connector for "' + Component.name + '" store not resolved"');
          }
        }

        this.storesResolved.push(resolved);
      }
    }, {
      key: 'resolveStores',
      value: function resolveStores(stores) {
        var _this4 = this;

        if (Array.isArray(stores)) {
          stores.forEach(function (item) {
            _this4.resolveStore(item);
          });
        } else {
          this.resolveStore(stores || this.context.store);
        }
      }
    }, {
      key: 'resolveApi',
      value: function resolveApi() {
        var store = this.storesResolved.length ? this.storesResolved[0] : null;
        var api = {};

        if (store && store.api) {
          _lodash2.default.each(store.api, function (value, key) {
            if (typeof value === 'function') {
              api[key] = value.bind(store);
            } else {
              console.warn('In connector for "' + Component.name + '" api function "' + key + '" not found in store "' + (0, _util.protoName)(store) + '"');
            }
          });
          this.apiResolved = api;
        }
      }
    }, {
      key: 'composeProps',
      value: function composeProps() {
        var composed = void 0;
        var helper = void 0;
        var result = {};
        var o = this.options;

        if (typeof o !== 'undefined') {
          helper = typeof o === 'function' ? o : o.helper;
        }

        _lodash2.default.each(this.props, function (value, key) {
          if (key !== 'store') {
            result[key] = value;
          }
        });

        if (helper) {
          composed = helper.apply(this, this.storesResolved);
          _lodash2.default.forIn(composed, function (item, key) {
            if (result[key]) {
              console.warn('In connector for "' + Component.name + '" variable name "' + key + '" exists in the helper and props.');
            }
            result[key] = item;
          });

          return composed !== undefined ? result : undefined;
        }

        // return this.storesResolved;
        return result;
      }
    }, {
      key: 'render',
      value: function render() {
        if (this.options.wairForServices && !this.servicesLoaded) {
          return null;
        }

        var props = this.composeProps();
        var comp = null;

        if (props !== undefined) {
          if (this.apiResolved) {
            props.api = this.apiResolved;
          }
          comp = _react2.default.createElement(Component, props);
        }

        return comp;
      }
    }]);

    return Connector;
  }(_react2.default.Component), _class2.displayName = Component.displayName && Component.displayName + 'Connector' || Component.name + 'Connector', _class2.childContextTypes = {
    store: _propTypes2.default.object
  }, _class2.contextTypes = {
    store: _propTypes2.default.object
  }, _temp)) || _class;

  return Connector;
}

exports.default = ConnectorF;