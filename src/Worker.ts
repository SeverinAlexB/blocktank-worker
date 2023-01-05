import { get } from 'lodash'
import  { EventEmitter } from 'events'
import {GranacheServer} from './grenache/Server'
import {GrenacheClient} from './grenache/Client'
import { MongoDatabase } from './db/MongoDatabase'
import { GrapeServerConfig } from './grenache/GrapeServerConfig'
import { IDatabaseModel } from './db/DatabaseModel'
import { SyncRunner } from './utils/SyncRunner'
import { ServerCallRequest } from './grenache/SeverCallRequest'
import { BlocktankCallback } from './callback'


// Todo: Sync runner check all implementations
export class Worker extends EventEmitter {
  private gClient: GrenacheClient;
  private gServer: GranacheServer;
  public syncRunner = new SyncRunner();
  constructor (public config: GrapeServerConfig) {
    super()
  }

  public async init() {
    await MongoDatabase.getDb(this.config.db_url || 'mongodb://0.0.0.0:27017')
    this.emit('db-ready');

    this.gClient = new GrenacheClient(this.config)
    await this.initServer();

    this._syncThrottleNotImplementedWarn();
  }

  private async initServer() {
    this.gServer = new GranacheServer(this.config)
    this.gServer.init();
    this.gServer.service.on('request', async (peerId: any, service: any, payload: any, handler: any) => {
      try {
        const result = await this.callMethod(payload);
        handler.reply(null, result);
      } catch(e) {
        handler.reply(e, null);
      }
    })
  }

  /**
   * Calls the method in this worker. Supports sync, async, and callback methods.
   * @param request 
   * @returns Method result
   */
  private async callMethod(request: ServerCallRequest): Promise<any> {
    const method = request.method || 'main';

    const func = (this as any)[method];
    if (!func) {
      throw new Error(`Controller method ${method} missing`);
    }

    const args = request.args || [];

    return new Promise(async (resolve, reject) => {
      // Callback support
      const callback = (error: any, data: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      }

      try {
        const result = func.apply(this, [...args, callback]);
        if (result === undefined) {
          // No result. Wait on callback;
          return;
        } else if (result instanceof Promise) {
          // Handle promise return
          try {
            return resolve(result);
          } catch (e) {
            return reject(e);
          }
        } else {
          // Regular sync function.
          return resolve(result);
        }
      } catch (e) {
        // Regular function error
        return reject(e);
      }
    })
  }

  private _syncThrottleNotImplementedWarn() {
    Object.getOwnPropertyNames(Object.getPrototypeOf(this))
    .forEach((n) => {
      if (!n.endsWith('Sync')) return
      console.warn(n, "Sync throttle rate limited not implemented in this worker version. Use this.syncRunner.");
    })
  }

  get workerName(): string {
      return this.config.name;
  }

  async callWorker (request: ServerCallRequest, callback?: BlocktankCallback) {
    if (callback) {
      this.gClient.send(request, callback);
    } else {
      return await this.gClient.send(request);
    }
  }


  // callLn (method, args, callback) {
  //   return this.callWorker('svc:ln', method, args, callback)
  // }

  // callBtc (method, args, callback) {
  //   return this.callWorker('svc:btc', method, args, callback)
  // }

  // callBtcBlocks (method, args, callback) {
  //   return this.callWorker('svc:btc:blocks', method, args, callback)
  // }

  // errRes (txt) {
  //   return { error: txt || 'Service not available' }
  // }

  // _getZeroConfQuote (amount) {
  //   return this.callWorker('svc:btc_zero_conf_orders', 'checkZeroConfAmount', { amount })
  // }

  async alertSlack (level: any, tag: any, message?: any) {
    if (arguments.length === 2) {
      message = tag
      tag = this.workerName.split(':').pop() || 'worker'
    }
    try {
      return await this.gClient.send({
        service: 'monitor',
        'method': 'slack',
        args: [level, tag, message]
      });
    } catch (e) {
      console.log('FAILED SLACK MESSAGE', e.message);
    }

  }

  // satsToBtc (args, cb) {
  //   return this.callWorker('svc:exchange_rate', 'getBtcUsd', args, cb)
  // }


  async stop(){
    this.gClient.stop();
    this.gServer.stop();

    await MongoDatabase.close();
  }
}

