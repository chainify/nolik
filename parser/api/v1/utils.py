import base58
import base64
import os
import pywaves.crypto as crypto
import axolotl_curve25519 as curve

def str_with_length(string_data):
    string_length_bytes = len(string_data).to_bytes(2, byteorder='big')
    string_bytes = string_data.encode('utf-8')
    return string_length_bytes + string_bytes


def signed_data(data):
    prefix = 'chainify'
    return str_with_length(prefix) + str_with_length(data)


def verify_signature(m_public_key, signature, message):
    public_key_bytes = base58.b58decode(m_public_key)
    signature_bytes = base58.b58decode(signature)
    message_bytes = signed_data(message)
    
    verified = curve.verifySignature(public_key_bytes, message.encode(), signature_bytes) == 0

    return  verified