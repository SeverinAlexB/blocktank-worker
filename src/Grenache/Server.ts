import { GrapeServerConfig } from "./GrapeServerConfig"

const Link = require('grenache-nodejs-link')
const { PeerRPCServer } = require('grenache-nodejs-http')


export default function GrenacheServerFactory (config: GrapeServerConfig) {
    if (config.test_env) return
    const link = new Link({
      grape: config.grape || 'http://127.0.0.1:30001'
    })
    link.start()
  
    const peer = new PeerRPCServer(link, {
      timeout: 300000
    })
    peer.init()
    const service = peer.transport('server')
    service.listen(config.port || 8999)
    setInterval(function () {
      link.announce(config.name, service.port, {})
    }, 3000)
    return service
}
