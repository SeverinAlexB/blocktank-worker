'use strict'
import { get } from 'lodash'
import  { EventEmitter } from 'events'
import {GrenacheServerFactory} from './Grenache/Server'
import {GrenacheClient} from './Grenache/Client'
import { MongoDatabase } from './DB/DB'
import { GrapeServerConfig } from './Grenache/GrapeServerConfig'




class Controller extends EventEmitter {
  private gClient: GrenacheClient;
  private gServer: any;
  constructor (public config: GrapeServerConfig) {
    super()
    console.log('Starting Worker: ' + this.workerName)
    this.gClient = new GrenacheClient(config)
    this.gServer = GrenacheServerFactory(config)

    if (config.modules) {
      this._loadModules(config.modules)
    }

    // Starting Database
    Db({ db_url: config.db_url || 'mongodb://0.0.0.0:27017' }, async (err) => {
      if (err) throw err
      this.db = await Db()
      this.emit('db-ready')
    })

    if (this.gServer) {
      this.gServer.on('request', (rid, svc, payload, handler) => {
        const method = payload.method
        const args = payload.args
        if (!method || !this[method]) {
          payload.push(handler.reply)
          const fn = get(payload[1], 'endpoint.config.svc_fn', 'main')
          if (!this[fn]) {
            throw new Error(`Controller method ${fn} missing`)
          }
          return this[fn].apply(this, payload)
        }

        if (Array.isArray(args)) {
          args.push(handler.reply)
          this[method].apply(this, args)
        } else {
          const params = [args, handler.reply]
          this[method].apply(this, params)
        }
      })
    }


    this._sync_fn_running = new Map()
    this._sync_fn_main = new Map()

    // Throttle method calls
    const syncFnRunner = (args, options, cb) => {
      const name = get(options, 'endpoint.config.svc_fn', 'main')
      if (this._sync_fn_running.has(name)) {
        if (typeof cb === 'function') return cb(null, this.errRes('Rate limtied'))
        return this.errRes('Rate limited')
      }
      this._sync_fn_running.set(name, true)
      const mainFn = this._sync_fn_main.get(name)
      mainFn.call(this, args, options, (err, data) => {
        this._sync_fn_running.delete(name)
        cb(err, data)
      })
    }

    Object.getOwnPropertyNames(Object.getPrototypeOf(this))
      .forEach((n) => {
        if (!n.endsWith('Sync')) return
        this._sync_fn_main.set(n, this[n].bind(this))
        this[n] = syncFnRunner.bind(this)
      })
  }


  get workerName(): string {
      return this.config.name;
  }

  callWorker (name, method, args, cb) {
    return new Promise((resolve, reject) => {
      this.gClient.send(name, {
        method,
        args: Array.isArray(args) ? args : [args]
      }, (err, data) => {
        if (err) {
          return cb ? cb(err) : reject(err)
        }
        cb ? cb(null, data) : resolve(data)
      })
    })
  }

  _loadModules (modList) {
    modList.forEach((util) => {
      const module = require('./Utils/' + util.name + '.js')
      this[module.namespace] = module
    })
  }

  callLn (method, args, cb) {
    return this.callWorker('svc:ln', method, args, cb)
  }

  callBtc (method, args, cb) {
    return this.callWorker('svc:btc', method, args, cb)
  }

  callBtcBlocks (method, args, cb) {
    return this.callWorker('svc:btc:blocks', method, args, cb)
  }

  errRes (txt) {
    return { error: txt || 'Service not available' }
  }

  _getZeroConfQuote (amount) {
    return this.callWorker('svc:btc_zero_conf_orders', 'checkZeroConfAmount', { amount })
  }

  alertSlack (level, tag, msg) {
    if (arguments.length === 2) {
      msg = tag
      tag = this.worker_name.split(':').pop() || 'worker'
    }
    return new Promise((resolve, reject) => {
      this.gClient.send('svc:monitor:slack', [level, tag, msg], (err, data) => {
        if (err) {
          console.log('FAILED SLACK MESSAGE', err.message)
          return resolve()
        }
        resolve(data)
      })
    })
  }

  satsToBtc (args, cb) {
    return this.callWorker('svc:exchange_rate', 'getBtcUsd', args, cb)
  }


  async stopWorker(){
    this.gServer.unlisten()
  }
}

module.exports = Controller
