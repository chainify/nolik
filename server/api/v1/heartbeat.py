import os
from sanic import Blueprint
from sanic.views import HTTPMethodView
from sanic.response import json
import psycopg2
import configparser
from .threads import get_threads
from .cdms import get_cdms

import redis
# from redis.connection import ConnectionPool

config = configparser.ConfigParser()
config.read('config.ini')

heartbeat = Blueprint('heartbeat_v1', url_prefix='/heartbeat')


class HeartBeat(HTTPMethodView):
    @staticmethod
    def post(request):
        public_key = request.form['publicKey'][0]
        thread_members = request.form['threadMembers'][0].split(',') if 'threadMembers' in request.form else None
        last_tx_id = request.form['lastTxId'][0] if 'lastTxId' in request.form else None

        client = redis.Redis.from_url(os.environ['REDIS_URL'])
        r = redis.Redis(connection_pool=client.connection_pool)
        pipe = r.pipeline()
        pipe.set(public_key, 'True').expire(public_key, 4).execute()

        online_members = []
        if thread_members:
            for member in thread_members:
                online_member = pipe.get(member).execute()
                if online_member[0]:
                    online_members.append(member)
    
        data = {
            'threads': get_threads(public_key, last_tx_id),
            'cdmVersion': str(os.environ['CDM_VERSION']),
            'apiVersion': str(os.environ['API_VERSION']),
            'onlineMembers': online_members
        }
        return json(data, status=201)
        

heartbeat.add_route(HeartBeat.as_view(), '/')
