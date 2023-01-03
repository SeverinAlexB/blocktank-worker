import {BigNumber} from 'bignumber.js';

module.exports = {
  namespace: 'satsConvert',
  toSatoshi: (amt: number): string => {
    return new BigNumber(amt).abs().times(100000000).dp(8, BigNumber.ROUND_FLOOR).toString()
  },
  toBtc: (amt: number): string => {
    return new BigNumber(amt).abs().div(100000000).dp(8, BigNumber.ROUND_FLOOR).toString()
  }
}
