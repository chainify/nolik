import os
import psycopg2
from sanic import Blueprint
from sanic.views import HTTPMethodView
from sanic.response import json
from .errors import bad_request
import configparser
import base58

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

cdms = Blueprint('cdms_v1', url_prefix='/cdms')

class Cdms(HTTPMethodView):
    @staticmethod
    def get(request, cdm_id):
        data = get_cdm(cdm_id)
        return json(data, status=200)

def get_cdm(cdm_id):
    conn = psycopg2.connect(**dsn)
    try:
        with conn:
            with conn.cursor() as cur:
                sql = """
                    SELECT c.recipient, c.thread_hash FROM cdms c
                    WHERE id='{cdm_id}'
                """.format(
                    cdm_id=cdm_id
                )
                cur.execute(sql)
                alice, thread_hash = cur.fetchone()
                cdms = get_cdms(alice, thread_hash)

                cdm_data = None
                for cdm in cdms:
                    if cdm['id'] == cdm_id:
                        cdm_data = cdm
                        break
    except Exception as error:
        return bad_request(error)
    
    return cdm_data

def get_cdms(alice, thread_hash):
    conn = psycopg2.connect(**dsn)
    try:
        with conn:
            with conn.cursor() as cur:
                sql = """
                    SELECT DISTINCT ON (c.thread_hash, c.message_hash, c.timestamp, init_cdm_timestamp)
                        c.recipient,
                        s.sender,
                        t.sender_public_key,
                        c.subject,
                        c.message,
                        c.subject_hash,
                        c.message_hash,
                        c.re_subject_hash,
                        c.re_message_hash,
                        c.fwd_subject_hash,
                        c.fwd_message_hash,
                        c.type,
                        c.thread_hash,
                        c.timestamp,
                        t.id,
                        t.attachment,
                        t.attachment_hash,
                        s.signature,
                        array(
                            SELECT p.proof
                            FROM proofs p
                            WHERE p.tx_id = t.id
                        ) as proofs,
                        c.id,
                        (
                            SELECT min(cc.timestamp)
                            FROM cdms cc
                            WHERE cc.message_hash = c.fwd_message_hash
                        ) as init_cdm_timestamp
                    FROM cdms c
                    LEFT JOIN transactions t ON c.tx_id = t.id
                    LEFT JOIN senders s ON c.id = s.cdm_id
                    WHERE (
                        c.recipient = '{alice}' OR
                        t.sender_public_key = '{alice}' OR
                        s.sender = '{alice}'
                        )
                    AND c.thread_hash='{thread_hash}'
                    ORDER BY c.timestamp DESC, init_cdm_timestamp DESC
                    """.format(
                        alice=alice,
                        thread_hash=thread_hash
                    )
                
                cur.execute(sql)
                records = cur.fetchall()

                cdms = []
                for record in records:
                    cur.execute("""
                        SELECT DISTINCT c.recipient, c.tx_id, c.timestamp, c.type
                        FROM cdms c
                        WHERE c.message_hash='{hash}'
                    """.format(
                        hash=record[6]
                    ))
                    recipients = cur.fetchall()
                    shared_with = []
                    for recipient in recipients:
                        shared_with.append({
                            'publicKey': recipient[0],
                            'txId': recipient[1],
                            'timestamp': recipient[2],
                            'type': recipient[3]
                        })

                    data = {
                        "recipient": record[0],
                        "logicalSender": record[1] or record[2],
                        "realSender": record[2],
                        "subject": record[3],
                        "message": record[4],
                        "subjectHash": record[5],
                        "messageHash": record[6],
                        "reSubjectHash": record[7],
                        "reMessageHash": record[8],
                        "fwdSubjectHash": record[9],
                        "fwdMessageHash": record[10],
                        "type": record[11],
                        "threadHash": record[12],
                        "timestamp": record[13],
                        "txId": record[14],
                        "ipfsHash": base58.b58decode(record[15]).decode('utf-8'),
                        "attachmentHash": record[16],
                        "signature": record[17] or record[18][0],
                        "id": record[19],
                        "sharedWith": shared_with
                    }

                    sender, recipient = record[1] or record[2], record[0]
                    if alice == sender:
                        data['direction'] = 'self' if sender == recipient else 'outgoing'
                    else:
                        data['direction'] = 'incoming'
                        
                    cdms.append(data)


    except Exception as error:
        return bad_request(error)
    
    return cdms

cdms.add_route(Cdms.as_view(), '/<cdm_id>')