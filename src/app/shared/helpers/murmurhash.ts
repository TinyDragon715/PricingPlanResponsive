export let murmurhash = (str: string, seed: number) => {
    let l = str.length,
    h = seed ^ l,
    i = 0,
    k;
  while (l >= 4) {
    k = ((str.charCodeAt(i) & 0xff)) |
      ((str.charCodeAt(++i) & 0xff) << 8) |
      ((str.charCodeAt(++i) & 0xff) << 16) |
      ((str.charCodeAt(++i) & 0xff) << 24);
    k = (((k & 0xffff) * 0x5bd1e995) + ((((k >>> 16) * 0x5bd1e995) & 0xffff) << 16));
    k ^= k >>> 24;
    k = (((k & 0xffff) * 0x5bd1e995) + ((((k >>> 16) * 0x5bd1e995) & 0xffff) << 16));
    h = (((h & 0xffff) * 0x5bd1e995) + ((((h >>> 16) * 0x5bd1e995) & 0xffff) << 16)) ^ k;
    l -= 4;
    ++i;
  }
  switch (l) {
    case 3:
      h ^= (str.charCodeAt(i + 2) & 0xff) << 16;
    break;
    case 2:
      h ^= (str.charCodeAt(i + 1) & 0xff) << 8;
    break;
    case 1:
      h ^= (str.charCodeAt(i) & 0xff);
      h = (((h & 0xffff) * 0x5bd1e995) + ((((h >>> 16) * 0x5bd1e995) & 0xffff) << 16));
    break;
    default:
  }
  h ^= h >>> 13;
  h = (((h & 0xffff) * 0x5bd1e995) + ((((h >>> 16) * 0x5bd1e995) & 0xffff) << 16));
  h ^= h >>> 15;
  return h >>> 0;
};
export let Radix64 = (function () {
    let digitsStr = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz^_';
    let digits = digitsStr.split('');
    let digitsMap = {};
    for (let i = 0; i < digits.length; i++) {
        digitsMap[digits[i]] = i;
    }
    return {
        fromInt: function(int32) {
            let result = '';
            while (true) {
                result = digits[int32 & 0x3f] + result;
                int32 >>>= 6;
                if (int32 === 0)
                    break;
            }
            return result;
        },
        toInt: function( digiStr ) {
            let result = 0;
            let currentdigits = digiStr.split('');
            for (let i = 0; i < currentdigits.length; i++) {
                result = (result << 6) + digitsMap[currentdigits[i]];
            }
            return result;
        }
    };
})();
