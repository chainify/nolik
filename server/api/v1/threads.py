import os
import time
import psycopg2
from .cdms import get_cdms
from .errors import bad_request
import configparser


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

def get_threads(alice, last_tx_id = None):
    conn = psycopg2.connect(**dsn)
    try:
        with conn:
            with conn.cursor() as cur:
                sql = """
                    SELECT DISTINCT
                        c.thread_hash,
                        array(
                            SELECT recipient FROM cdms cc
                            WHERE c.thread_hash = cc.thread_hash
                            UNION
                            SELECT tt.sender_public_key FROM transactions tt
                            WHERE c.tx_id = tt.id
                            UNION
                            SELECT ss.sender FROM senders ss
                            LEFT JOIN cdms cc ON cc.id = ss.cdm_id
                            WHERE c.thread_hash = cc.thread_hash
                        ),
                        c.timestamp
                    FROM cdms c
                    LEFT JOIN transactions t on c.tx_id = t.id
                    LEFT JOIN senders s on c.id = s.cdm_id
                    WHERE (
                        c.recipient = '{alice}' OR 
                        t.sender_public_key = '{alice}' OR
                        s.sender = '{alice}'
                        )
                    AND c.timestamp IN (
                        SELECT max(timestamp)
                        FROM cdms
                        WHERE thread_hash = c.thread_hash
                    )
                """.format(
                    alice=alice
                )

                if last_tx_id:
                    sql += "AND c.timestamp > (SELECT DISTINCT timestamp FROM cdms WHERE tx_id='{0}')".format(last_tx_id)
                sql += "\nORDER BY c.timestamp ASC"

                cur.execute(sql)
                records = cur.fetchall()

                sponsor = os.environ['SPONSOR_PUBLIC_KEY']
                threads = []
                thread_hashes = []
                for record in records:
                    thread_hash = record[0]
                    if (thread_hash in thread_hashes):
                        continue
                    members = record[1]
                    cdms = get_cdms(alice, thread_hash)
                    thread = {
                        'members': [member for member in members if member not in [alice, sponsor]],
                        'threadHash': thread_hash,
                        'cdms': cdms
                    }
                    threads.append(thread)

                

    except Exception as error:
        return bad_request(error)
    
    return threads
