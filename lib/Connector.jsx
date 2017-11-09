import React from 'react';
import { observer } from 'mobx-react';
import { toJS } from 'mobx';
import _ from 'lodash';
import { getUid, protoName } from './util';
import PropTypes from 'prop-types';


function ConnectorF(Component, opt = {}) {
  const options = Object.assign({
    wairForServices: true,
    services: [],
    test: 0,
  }, opt);


@observer class Connector extends React.Component {
    static displayName = (Component.displayName && `${Component.displayName}Connector`) || `${Component.name}Connector`;
  // static defaultProps = Component.defaultProps || {};

    static childContextTypes = {
      store: PropTypes.object,
    };

    static contextTypes = {
      store: PropTypes.object,
    };

    getChildContext() {
      return {
        store: this.store,
      };
    }

    componentWillMount() {
      this.servicesLoaded = false;
      this.options = options;
      this.componentId = `${Component.name}_${getUid()}`;

      // console.log(['componentId', this.componentId]);

      if (this.options.services.length) {
        Promise.all(
          this.options.services.map((service) => {
            if (this.options.test) {
              console.log(['service', service]);
            }
            if (!service) {
              console.log(['this.componentId', this.options.services, this.componentId]);
            }
            return service.start(this.componentId);
          }),
        ).then(() => {
          this.initComponent();

          if (this.options.wairForServices) {
            this.forceUpdate();
          }
        });
      }

      if (!this.options.services.length || !this.options.wairForServices) {
        this.initComponent();
      }
    }

    initComponent() {
      this.servicesLoaded = true;
      // TODO remove options, stores
      this.toDestroy = [];
      this.storesResolved = [];
      this.apiResolved = null;

      this.resolveStores(options.store || this.props.store);
      this.resolveApi();

      this.store = this.storesResolved[0];
    }

    shouldComponentUpdate(...arg) {
      let pass = false;

      if (this.options && this.options.shouldComponentUpdate) {
        pass = this.options.shouldComponentUpdate.apply(this, arg);
      }

      return pass;
    }

    componentWillUnmount() {
      this.toDestroy.forEach((resolved) => {
        if (resolved.destroy) {
          resolved.destroy();
        }
      });

      if (this.options.services) {
        this.options.services.forEach((service) => {
          service.stop(this.componentId);
        });
      }
    }

    resolveStore(store) {
      const resolved = typeof store === 'function' ? store.call(this) : store;

      if (typeof store === 'function') {
        if (resolved) {
          this.toDestroy.push(resolved);
        } else {
          console.warn(`In connector for "${Component.name}" store not resolved"`);
        }
      }

      this.storesResolved.push(resolved);
    }

    resolveStores(stores) {
      if (Array.isArray(stores)) {
        stores.forEach((item) => {
          this.resolveStore(item);
        });
      } else {
        this.resolveStore(stores || this.context.store);
      }
    }

    resolveApi() {
      const store = this.storesResolved.length ? this.storesResolved[0] : null;
      const api = {};

      if (store && store.api) {
        _.each(store.api, (value, key) => {
          if (typeof value === 'function') {
            api[key] = value.bind(store);
          } else {
            console.warn(`In connector for "${Component.name}" api function "${key}" not found in store "${protoName(store)}"`);
          }
        });
        this.apiResolved = api;
      }
    }

    composeProps() {
      let composed;
      let helper;
      const result = {};
      const o = this.options;

      if (typeof o !== 'undefined') {
        helper = typeof o === 'function' ? o : o.helper;
      }

      _.each(this.props, (value, key) => {
        if (key !== 'store') {
          result[key] = value;
        }
      });

      if (helper) {
        composed = helper.apply(this, this.storesResolved);
        _.forIn(composed, (item, key) => {
          if (result[key]) {
            console.warn(`In connector for "${Component.name}" variable name "${key}" exists in the helper and props.`);
          }
          result[key] = item;
        });

        return composed !== undefined ? result : undefined;
      }

      // return this.storesResolved;
      return result;
    }

    render() {
      if (this.options.wairForServices && !this.servicesLoaded) {
        return null;
      }

      const props = this.composeProps();
      let comp = null;

      if (props !== undefined) {
        if (this.apiResolved) {
          props.api = this.apiResolved;
        }
        comp = <Component{...props} />;
      }

      return comp;
    }
}

return Connector;
}

export default ConnectorF;

