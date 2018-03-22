var modules = {
  Binder: require('./lib/Binder').default,
  BaseStore: require('./lib/BaseStore').default,
};


exports.Binder = modules.Binder;
exports.BaseStore = modules.BaseStore;
module.exports = modules;
