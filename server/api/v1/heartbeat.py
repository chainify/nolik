from sanic import Sanic
import os
from sanic import Blueprint
from sanic.views import HTTPMethodView
from sanic.response import json
import psycopg2
import configparser
from .threads import get_threads
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
            'threads': get_threads(public_key, last_tx_id),
            'cdmVersion': str(os.environ['CDM_VERSION']),
            'apiVersion': str(os.environ['API_VERSION'])
        }
        return json(data, status=201)
        

heartbeat.add_route(HeartBeat.as_view(), '/')
