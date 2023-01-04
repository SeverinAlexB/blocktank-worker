import axios from 'axios';


export interface GeoIpInfoResponse {
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


export class GeoIp {

  private static async callApi(ip: string, token: string): Promise<GeoIpInfoResponse> {
    try {
      const res = await axios.get(`https://ipinfo.io/${ip}?token=${token}`)
      return res.data
    } catch (err) {
      console.log('Failed to get ip: ', ip)
      console.log(err.message)
      return null
    }
  }

  public static async getInfo(ip: string, token: string): Promise<GeoIpInfoResponse> {
    const end = ip.includes(':') ? ip.indexOf(':') : ip.length
    const formatted = ip.substr(0, end)
    return this.callApi(formatted, token)
  }
}

