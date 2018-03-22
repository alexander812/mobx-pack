
import _ from 'lodash';
import { protoName } from './util';
import { observable } from 'mobx';

export const STATUS_SERVICE_SLEEP = 'sleep';
export const STATUS_SERVICE_STARTING = 'starting';
export const STATUS_SERVICE_STARTED = 'started';
export const STATUS_SERVICE_STOPPING = 'stopping';
export const STATUS_SERVICE_STOPPED = 'stopped';
export const STATUS_SERVICE_FAIL = 'fail';

export default function (BaseStore, serviceStarter) {
  return class BaseService extends BaseStore {
        /**
         * serviceStatus = sleep | starting | started | stopping | stopped | fail
         * @type {string}
         */
        @observable serviceStatus = STATUS_SERVICE_SLEEP;
        @observable serviceReady = false;
        @observable serviceWasStarted = false;
        serviceFail = null;
        alreadyStarting = false;
        alreadyStopping = false;
        initiators = [];

        start(initiatorId) {
          const waitFor = serviceStarter.waitFor(this);

          return waitFor
            ?
            waitFor.then(() => {
              this.startDo(initiatorId, serviceStarter);
            })
            :
            this.startDo(initiatorId, serviceStarter);
        }

        startDo(initiatorId) {
          const starting = this.alreadyStarting;

          this.alreadyStarting = true;

          return starting ?
            new Promise((resolve) => {
              this.initiators.push(initiatorId);
              this.startOk(resolve);
            })
            :
            new Promise((resolve, reject) => {
              if (!initiatorId) {
                reject(`Start service "${protoName(this)}" error. No initiator id.`);
              } else if (this.serviceStatus !== STATUS_SERVICE_SLEEP && this.serviceStatus !== STATUS_SERVICE_STOPPED) {
                reject(`Start service "${protoName(this)}" error. Wrong status "${this.serviceStatus}". Initiator - "${initiatorId}"`);
              } else {
                resolve();
              }
            }).then(() => this.proceedService(initiatorId, 'onStart', STATUS_SERVICE_STARTING, STATUS_SERVICE_STARTED)).then(() => {
              this.initiators.push(initiatorId);
              return new Promise((resolve) => {
                this.startOk(resolve);
              });
            }).catch(err => new Promise((resolve, reject) => { reject(err); }));
        }

        startOk(resolve) {
          if (serviceStarter) {
            serviceStarter.register(this);
          }

          resolve();
        }

        stop(initiatorId) {
          const stopping = this.alreadyStopping;

          return stopping
            ?
            new Promise((resolve) => {
              resolve();
            })
            :
            new Promise((resolve, reject) => {
              if (!initiatorId) {
                resolve();
              } else if (_.indexOf(this.initiators, initiatorId) === -1) {
                reject(`Stop service "${protoName(this)}" error. Initiator with id "${initiatorId}" not found.`);
              } else if (this.serviceStatus === STATUS_SERVICE_STARTED || this.serviceStatus === STATUS_SERVICE_STARTING || this.serviceStatus === STATUS_SERVICE_FAIL) {
                _.remove(this.initiators, n => n === initiatorId);

                resolve();
              } else {
                resolve(true);
              }
            }).then((alreadyStopped) => {
              let result = false;

              if (alreadyStopped || this.initiators.length) {
                result = new Promise((resolve) => {
                  resolve(this.initiators.length);
                });
              } else {
                this.alreadyStopping = true;
                result = this.proceedService(initiatorId, 'onStop', STATUS_SERVICE_STOPPING, STATUS_SERVICE_STOPPED);
              }

              return result;
            });
        }

        proceedService(id, fn, state1, state2) {
          const initiator = id || 'unknown';
          const conf = this.getConfig();
          return new Promise((resolve, reject) => {
            if(conf && conf.bindAs && !(conf.autoBind === false)){
              this.bindApp();
            }
            const result = this[fn]();

            if (result instanceof Promise) {
              this.setServiceStatus(state1);

              result.then(() => {
                this.setServiceStatus(state2);
                resolve();
              }).catch((e) => {
                this.setServiceStatus(STATUS_SERVICE_FAIL, `${state1}_fail`);
                reject(`Service:"${protoName(this)}", initing by "${initiator}" has status "${this.serviceFail}"\nErrorMessage: ${e}`);
              });
            } else if (result) {
              this.setServiceStatus(state2);
              resolve();
            } else {
              this.setServiceStatus(STATUS_SERVICE_FAIL, `${state1}_fail`);
              reject(`Service:"${protoName(this)}", initing by "${initiator}" has status "${this.serviceFail}"`);
            }
          });
        }

        setServiceFail(msg) {
          this.setServiceStatus(STATUS_SERVICE_FAIL, `${msg}_fail`);
        }

        setServiceStarted() {
          this.setServiceStatus(STATUS_SERVICE_STARTED);
        }

        setServiceStatus(status, failDesc) {
          this.alreadyStarting = status === STATUS_SERVICE_STARTING || status === STATUS_SERVICE_STARTED;
          this.serviceStatus = status;
          this.serviceReady = status === STATUS_SERVICE_STARTED;

          if (status === STATUS_SERVICE_STARTED) {
            this.serviceWasStarted = true;
            this.alreadyStopping = false;
          }

          if (failDesc) {
            this.serviceFail = failDesc;
          }
        }

        onStart() {
          return true;
        }

        onStop() {
          return true;
        }
  }
}

