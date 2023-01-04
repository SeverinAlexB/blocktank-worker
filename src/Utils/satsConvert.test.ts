import { SatsConvert } from './satsConvert';

describe('satsConvert', () => {
    test('toSatoshi', async () => {
        expect(SatsConvert.toSatoshi(0.12)).toBe('12000000')
        expect(SatsConvert.toSatoshi('0.12')).toBe('12000000')
    });

    test('toBtc', async () => {
        expect(SatsConvert.toBtc(1000000)).toBe('0.01')
        expect(SatsConvert.toBtc('1000000')).toBe('0.01')
    });
});


