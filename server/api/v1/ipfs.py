from sanic import Blueprint
from sanic.views import HTTPMethodView
from sanic.response import json
import uuid
import os
import ipfshttpclient
from .errors import bad_request
import configparser
import requests

config = configparser.ConfigParser()
config.read('config.ini')

ipfs = Blueprint('ipfs_v1', url_prefix='/ipfs')


class Ipfs(HTTPMethodView):
    @staticmethod
    def post(request):
        data = request.form['data'][0]
        ipfs_data = create_ipfs_file(data)
        return json(ipfs_data, status=201)

    @staticmethod
    def get(request, ipfs_hash):
        return json({"data": read_ipfs_file(ipfs_hash)}, status=200)


def create_ipfs_file(data):
    client = ipfshttpclient.connect('/ip4/{0}/tcp/{1}'.format(config['ipfs']['host'], config['ipfs']['port']))
    if not client:
        return bad_request('IPFS server can not be reached')

    dir_id = str(uuid.uuid4())
    file_id = str(uuid.uuid4())
    dir_path = './files/' + dir_id
    os.mkdir(dir_path)
    file_name = file_id + '.txt'
    file_path = dir_path + '/' + file_name

    with open(file_path, 'w') as f:
        f.write(data)

    with client:
        ipfs_data = client.add(file_path)

    os.remove(file_path)
    os.rmdir(dir_path)

    return ipfs_data


def read_ipfs_file(ipfs_hash):
    data = requests.get('{0}/ipfs/{1}'.format(config['ipfs']['host'], ipfs_hash)).text
    return data


ipfs.add_route(Ipfs.as_view(), '/')
ipfs.add_route(Ipfs.as_view(), '/<ipfs_hash>')
