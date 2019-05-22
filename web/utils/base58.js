"use strict";

var ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
var ALPHABET_MAP = ALPHABET.split('').reduce(function (map, c, i) {
    map[c] = i;
    return map;
}, {});

export default {
    encode: function (buffer) {
        if (!buffer.length)
            return '';
        var digits = [0];
        for (var i = 0; i < buffer.length; i++) {
            for (var j = 0; j < digits.length; j++) {
                digits[j] <<= 8;
            }
            digits[0] += buffer[i];
            var carry = 0;
            for (var k = 0; k < digits.length; k++) {
                digits[k] += carry;
                carry = (digits[k] / 58) | 0;
                digits[k] %= 58;
            }
            while (carry) {
                digits.push(carry % 58);
                carry = (carry / 58) | 0;
            }
        }
        for (var i = 0; buffer[i] === 0 && i < buffer.length - 1; i++) {
            digits.push(0);
        }
        return digits.reverse().map(function (digit) {
            return ALPHABET[digit];
        }).join('');
    },
    decode: function (string) {
        if (!string.length)
            return new Uint8Array(0);
        var bytes = [0];
        for (var i = 0; i < string.length; i++) {
            var c = string[i];
            if (!(c in ALPHABET_MAP)) {
                throw "There is no character \"" + c + "\" in the Base58 sequence!";
            }
            for (var j = 0; j < bytes.length; j++) {
                bytes[j] *= 58;
            }
            bytes[0] += ALPHABET_MAP[c];
            var carry = 0;
            for (var j = 0; j < bytes.length; j++) {
                bytes[j] += carry;
                carry = bytes[j] >> 8;
                bytes[j] &= 0xff;
            }
            while (carry) {
                bytes.push(carry & 0xff);
                carry >>= 8;
            }
        }
        for (var i = 0; string[i] === '1' && i < string.length - 1; i++) {
            bytes.push(0);
        }
        return new Uint8Array(bytes.reverse());
    }
};