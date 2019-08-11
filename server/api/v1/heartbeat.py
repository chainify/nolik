from sanic import Sanic
import os
from sanic import Blueprint
from sanic.views import HTTPMethodView
from sanic.response import json
import psycopg2
import configparser
from .groups import get_groups
from .cdms import get_cdms
import redis

config = configparser.ConfigParser()
config.read('config.ini')

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
