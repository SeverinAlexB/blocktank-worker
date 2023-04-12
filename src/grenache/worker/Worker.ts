import { GrenacheServer } from '../server/Server'
import { GrenacheClient } from '../client/Client'

import { GrenacheServerConfig, defaultGrenacheServerConfig } from '../server/Config'
import { SyncRunner } from '../../utils/SyncRunner'
import { MethodCallOptions } from '../server/MethodCallOptions'
import { sleep } from '../../utils'
import { WorkerImplementation } from './WorkerImplementation'
import { SubscriptionManager } from './events/SubscriptionManager'


// Todo: Sync runner check all implementations

/**
 * Combines the server and client to run a worker.
 */
export class Worker {
  public gClient: GrenacheClient;
  public gServer: GrenacheServer;
  public syncRunner = new SyncRunner();
  public config: GrenacheServerConfig;
  constructor(public implementation: WorkerImplementation, config: Partial<GrenacheServerConfig> = {}) {
    this.config = Object.assign({}, defaultGrenacheServerConfig(), config)
    this.implementation.runner = this;
    this.implementation.subscriptions = new SubscriptionManager()

    this.gClient = new GrenacheClient(this.config.grapeUrl)
    this.gServer = new GrenacheServer(this.config)
  }

  /**
   * Start listening for requests
   */
  public async start() {
    this.gClient.start()
    await this.initServer();
    this.implementation.subscriptions.init(this)

    this._syncThrottleNotImplementedWarn();
    await sleep(100); // Wait until the server is announced on Grape
    await this.implementation.subscriptions.initializeSubscriptions()
  }

  private async initServer() {

    this.gServer.init();
    this.gServer.service.on('request', async (peerId: any, service: any, payload: any, handler: any) => {
      try {
        const result = await this.callMethod(payload);
        handler.reply(null, result);
      } catch (e) {
        handler.reply(e, null);
      }
    })
  }

  /**
 * Calls the method in this worker. Supports sync, async, and callback methods.
 * @param request 
 * @returns Method result
 */
  private async callMethod(request: MethodCallOptions): Promise<any> {
    const method = request.method || 'main';

    const func = (this.implementation as any)[method];
    if (!func) {
      throw new Error(`Worker method ${method} not found.`);
    }

    const args = request.args || [];

    if (!this.config.callbackSupport && args.length !== func.length) {
      throw new Error(`Worker method ${method} expects ${func.length} arguments, but ${args.length} were provided.`)
    }

    return new Promise(async (resolve, reject) => {
      const methodArgs = [...args]
      if (this.config.callbackSupport) {
        // Callback support
        const callback = (error: any, data: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(data);
          }
        }
        methodArgs.push(callback)
      }

      try {
        const result = await func.bind(this.implementation).apply(this, methodArgs);
        if (this.config.callbackSupport && result === undefined) {
          // No result. Wait on callback;
          return;
        }
        return resolve(result);
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

  /**
   * Shut down the worker gracefully.
   */
  async stop() {
    this.gClient.stop();
    this.gServer.stop();
  }
}
