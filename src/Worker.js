'use strict'
const { get } = require('lodash')
const { EventEmitter } = require('events')
const GrenacheServer = require('./Grenache/Server')
const GrenacheClient = require('./Grenache/Client')
const Db = require('./DB/DB')

class Controller extends EventEmitter {
  constructor (config) {
    super()
    console.log('Starting Worker: ' + config.name)
    this.worker_name = config.name
    this.gClient = new GrenacheClient(config)
    this.gServer = GrenacheServer(config)

    // Starting Database
    Db({ db_url: config.db_url || 'mongodb://localhost:27017' }, async (err) => {
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
          console.log('FAILED SLACK MESSAGE', err)
          return resolve()
        }
        resolve(data)
      })
    })
  }
}

module.exports = Controller
