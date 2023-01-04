'use strict'
const { default: axios } = require('axios')


export interface IpInfoResponse {
  ip: string,
  hostname: string,
  city: string,
  region: string,
  country: string,
  loc: string,
  org: string,
  postal: string,
  timezone: string,
}

async function callAPI(ip: string, token: string): Promise<IpInfoResponse> {
  try {
    const res = await axios.get(`https://ipinfo.io/${ip}?token=${token}`)
    return res.data
  } catch (err) {
    console.log('Failed to get ip: ', ip)
    console.log(err.message)
    return null
  }
}

export class GeoIp {
  public static async getInfo(ip: string, token: string): Promise<IpInfoResponse> {
    const end = ip.includes(':') ? ip.indexOf(':') : ip.length
    const formatted = ip.substr(0, end)
    return callAPI(formatted, token)
  }
}

