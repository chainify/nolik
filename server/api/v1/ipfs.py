from sanic import Blueprint
from sanic.views import HTTPMethodView
from sanic.response import json
from sanic.log import logger
import uuid
import os
import ipfsapi
from .errors import bad_request
import configparser
import base64
import requests
from Crypto.Cipher import AES

config = configparser.ConfigParser()
config.read('config.ini')

ipfs = Blueprint('ipfs_v1', url_prefix='/ipfs')


class CryptoAES():
    def __init__(self):
        self.iv = config['aes']['iv']
        self.key = config['aes']['key']

    def encrypt(self, raw):
        enc_s = AES.new(self.key, AES.MODE_CFB, self.iv)
        cipher_text = enc_s.encrypt(raw)
        return base64.b64encode(cipher_text)

    def decrypt(self, enc):
        cipher = AES.new(self.key, AES.MODE_CFB, self.iv)
        return cipher.decrypt(base64.b64decode(enc))


class IpfsInit():
    def __init__(self):
        self.enc_mothod = None

class IpfsCreate(HTTPMethodView):
    @staticmethod
    def post(request):
        data = request.form['data'][0]
        ipfs_data = create_ipfs_file(data)
        return json(ipfs_data, status=201)


class IpfsGet(HTTPMethodView):

    def __init__(self):
        self.host = '{0}:{1}'.format(config['ipfs']['host'], config['ipfs']['get_port'])

    def get(self, request, ipfs_hash):
        return json({"data": read_ipfs_file(ipfs_hash)}, status=200)


crypto_aes = CryptoAES()
ipfs_init = IpfsInit()
ipfs_create = IpfsCreate()
ipfs_get = IpfsGet()


def create_ipfs_file(data):
    ipfs = ipfsapi.Client(config['ipfs']['host'], config['ipfs']['post_port'])
    if not ipfs:
        return bad_request('IPFS server can not be reached')

    if ipfs_init.enc_mothod == 'AES':
        enc_data = crypto_aes.encrypt(data).decode("utf-8")
    else:
        enc_data = data

    dir_id = str(uuid.uuid4())
    file_id = str(uuid.uuid4())
    dir_path = './files/' + dir_id
    os.mkdir(dir_path)
    file_name = file_id + '.txt'
    file_path = dir_path + '/' + file_name

    with open(file_path, 'w') as f:
        f.write(enc_data)

    ipfs_data = ipfs.add(file_path)

    os.remove(file_path)
    os.rmdir(dir_path)

    return ipfs_data


def read_ipfs_file(ipfs_hash):
    enc_data = requests.get('{0}/ipfs/{1}'.format(ipfs_get.host, ipfs_hash)).text
    if ipfs_init.enc_mothod == 'AES':
        data = crypto_aes.decrypt(enc_data)
    else:
        data = enc_data
    
    return data


ipfs.add_route(IpfsCreate.as_view(), '/')
ipfs.add_route(IpfsGet.as_view(), '/<ipfs_hash>')
