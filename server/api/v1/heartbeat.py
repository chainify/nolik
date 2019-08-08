from sanic import Sanic
import os
from sanic import Blueprint
from sanic.views import HTTPMethodView
from sanic.log import logger
from sanic.response import json
import requests
import psycopg2
from .errors import bad_request
import configparser
import base58
from .ipfs import create_ipfs_file, read_ipfs_file
import time
import websockets
import contextvars
import collections
import pywaves as pw
from datetime import datetime
from .groups import get_groups
from .cdms import get_cdms
import redis

config = configparser.ConfigParser()
config.read('config.ini')

dsn = {
    "user": config['DB']['user'],
    "password": config['DB']['password'],
    "database": config['DB']['database'],
    "host": config['DB']['host'],
    "port": config['DB']['port'],
    "sslmode": config['DB']['sslmode'],
    "target_session_attrs": config['DB']['target_session_attrs']
}

heartbeat = Blueprint('heartbeat_v1', url_prefix='/heartbeat')


class HeartBeat(HTTPMethodView):

    @staticmethod
    def post(request):
        public_key = request.form['publicKey'][0]
        last_tx_id = request.form['lastTxId'][0] if 'lastTxId' in request.form else None
        
        pool = redis.ConnectionPool(host='redis', port=6379, db=0)
        r = redis.Redis(connection_pool=pool)

        pipe = r.pipeline()
        pipe.set(public_key, last_tx_id or 'NULL').expire(public_key, 2).execute()

        data = {
            'groups': get_groups(public_key, last_tx_id),
            'cdms': get_cdms(public_key, group_hash=None, limit=None, last_tx_id=last_tx_id)
        }
        return json(data, status=201)
        

heartbeat.add_route(HeartBeat.as_view(), '/')
