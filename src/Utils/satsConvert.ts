import {BigNumber} from 'bignumber.js';

export class SatsConvert {
  public static toSatoshi(amt: number | string): string {
    return new BigNumber(amt).abs().times(100000000).dp(8, BigNumber.ROUND_FLOOR).toString()
  }
  public static toBtc(amt: number | string): string {
    return new BigNumber(amt).abs().div(100000000).dp(8, BigNumber.ROUND_FLOOR).toString()
  }
}

