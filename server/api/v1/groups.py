from sanic import Sanic
import os
import time
from sanic import Blueprint
from sanic.views import HTTPMethodView
from sanic.response import json
import psycopg2
from .cdms import get_cdms
from .errors import bad_request
import configparser

groups = Blueprint('groups_v1', url_prefix='/groups')

config = configparser.ConfigParser()
config.read('config.ini')

dsn = {
    "user": os.environ['POSTGRES_USER'],
    "password": os.environ['POSTGRES_PASSWORD'],
    "database": os.environ['POSTGRES_DB'],
    "host": config['DB']['host'],
    "port": config['DB']['port'],
    "sslmode": config['DB']['sslmode'],
    "target_session_attrs": config['DB']['target_session_attrs']
}

class Groups(HTTPMethodView):
    @staticmethod
    def get(request, alice):
        last_tx_id = request.args['lastTxId'][0] if 'lastTxId' in request.args else None
        data = {
            'groups': get_groups(alice, last_tx_id)
        }
        return json(data, status=200)


def get_groups(alice, last_tx_id = None):
    conn = psycopg2.connect(**dsn)
    try:
        with conn:
            with conn.cursor() as cur:
                sql = """
                    SELECT DISTINCT
                        c.group_hash,
                        array(
                            SELECT recipient FROM cdms cc
                            WHERE c.group_hash = cc.group_hash
                            UNION
                            SELECT tt.sender_public_key FROM transactions tt
                            WHERE c.tx_id = tt.id
                        ),
                        c.timestamp
                    FROM cdms c
                    LEFT JOIN transactions t on c.tx_id = t.id
                    WHERE (c.recipient = '{alice}' OR t.sender_public_key = '{alice}')
                    AND c.timestamp IN (
                        SELECT max(timestamp)
                        FROM cdms
                        WHERE group_hash = c.group_hash
                    )
                """.format(
                    alice=alice
                )

                if last_tx_id:
                    sql += "AND c.timestamp > (SELECT timestamp FROM cdms WHERE tx_id='{0}')".format(last_tx_id)
                sql += "\nORDER BY c.timestamp ASC"

                cur.execute(sql)
                records = cur.fetchall()

                groups = []
                group_hashes = []
                for record in records:
                    group_hash = record[0]
                    if (group_hash in group_hashes):
                        continue
                    members = record[1]
                    cdms = get_cdms(alice, group_hash, limit=None)
                    group = {
                        'members': [member for member in members if member != alice],
                        'groupHash': group_hash,
                        'initCdm': None if len(cdms) == 0 else cdms[0],
                        'lastCdm': None if len(cdms) == 0 else cdms[-1]
                    }
                    groups.append(group)

                

    except Exception as error:
        return bad_request(error)
    
    return groups


groups.add_route(Groups.as_view(), '/<alice>')
