import CryptoJS from 'crypto-js';
import base58 from './base58';
import axlsign from './axlsign';

const iv = CryptoJS.enc.Hex.parse("101112131415161718191a1b1c1d1e1f");

function byteArrayToWordArrayEx(arr) {
  const len = arr.length
  const words = []
  for (let i = 0; i < len; i++) {
    words[i >>> 2] |= (arr[i] & 0xff) << (24 - (i % 4) * 8)
  }
  return CryptoJS.lib.WordArray.create(words)
}

function getSharedKey(secretKey, publicKey) {
	return CryptoJS.SHA256(byteArrayToWordArrayEx(axlsign.sharedKey(base58.decode(secretKey), base58.decode(publicKey))));
}

export function encryptMessage(message, privateKey, publicKey) {
	return CryptoJS.AES.encrypt(message, getSharedKey(privateKey, publicKey), {iv: iv}).toString();
}

export function decryptMessage(message, privateKey, publicKey) {
	const bytes = CryptoJS.AES.decrypt(message, getSharedKey(privateKey, publicKey), {iv: iv});
	return bytes.toString(CryptoJS.enc.Utf8);
}

export function  encrypt(message, recieverPublicKey, senderPrivateKey) {
    const privateKey = senderPrivateKey;
    return encryptMessage(message, privateKey, recieverPublicKey); 
}

export function  decrypt(message, senderPublicKey, recipientPrivateKey) {
    const privateKey = recipientPrivateKey;
    return decryptMessage(message, privateKey, senderPublicKey); 
}