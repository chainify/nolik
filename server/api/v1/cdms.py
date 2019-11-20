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
                    SELECT c.recipient_hash, c.thread_hash FROM cdms c
                    WHERE id='{cdm_id}'
                """.format(
                    cdm_id=cdm_id
                )
                cur.execute(sql)
                alice_hash, thread_hash = cur.fetchone()
                cdms = get_cdms(alice_hash, thread_hash)

                cdm_data = None
                for cdm in cdms:
                    if cdm['id'] == cdm_id:
                        cdm_data = cdm
                        break
    except Exception as error:
        return bad_request(error)
    
    return cdm_data

def get_cdms(alice_hash, thread_hash):
    conn = psycopg2.connect(**dsn)
    try:
        with conn:
            with conn.cursor() as cur:
                sql = """
                    SELECT DISTINCT ON (c.thread_hash, c.message_hash, c.timestamp, init_cdm_timestamp)
                        c.recipient,
                        s.sender,
                        t.sender_public_key,
                        c.recipient_hash,
                        s.sender_hash,
                        t.sender_public_key_hash,
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
                        c.version,
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
                        c.recipient_hash = '{alice_hash}' OR
                        t.sender_public_key_hash = '{alice_hash}' OR
                        s.sender_hash = '{alice_hash}'
                        )
                    AND c.thread_hash='{thread_hash}'
                    ORDER BY c.timestamp DESC, init_cdm_timestamp DESC
                    """.format(
                        alice_hash=alice_hash,
                        thread_hash=thread_hash
                    )
                
                cur.execute(sql)
                records = cur.fetchall()

                cdms = []
                for record in records:
                    # cur.execute("""
                    #     SELECT DISTINCT c.recipient, c.recipient_hash, c.tx_id, c.timestamp, c.type
                    #     FROM cdms c
                    #     WHERE c.message_hash='{hash}'
                    # """.format(
                    #     hash=record[9]
                    # ))
                    cur.execute("""
                        SELECT DISTINCT
                            c.recipient,
                            s.sender,
                            c.recipient_hash,
                            s.sender_hash
                        FROM cdms c
                        LEFT JOIN senders s ON s.cdm_id = c.id
                        WHERE c.message_hash='{hash}'
                    """.format(
                        hash=record[9]
                    ))
                    members = cur.fetchall()
                    shared_with = []
                    for member in members:
                        if alice_hash != member[2] and member[0] not in shared_with:
                            shared_with.append(member[0])
                        if alice_hash != member[3] and member[1] not in shared_with:
                            shared_with.append(member[1])
                    
                    shared_with = list(set(shared_with))
                    data = {
                        "recipient": record[0],
                        "logicalSender": record[1],
                        "realSender": record[2],
                        "recipientHash": record[3],
                        "logicalSenderHash": record[4],
                        "realSenderHash": record[5],
                        "subject": record[6],
                        "message": record[7],
                        "subjectHash": record[8],
                        "messageHash": record[9],
                        "reSubjectHash": record[10],
                        "reMessageHash": record[11],
                        "fwdSubjectHash": record[12],
                        "fwdMessageHash": record[13],
                        "type": record[14],
                        "threadHash": record[15],
                        "timestamp": record[16],
                        "version": record[17],
                        "txId": record[18],
                        "ipfsHash": base58.b58decode(record[19]).decode('utf-8'),
                        "attachmentHash": record[20],
                        "signature": record[21] or record[22][0],
                        "id": record[23],
                        "sharedWith": shared_with
                    }

                    sender, recipient = record[4], record[3]
                    if alice_hash == sender:
                        data['direction'] = 'self' if sender == recipient else 'outgoing'
                    else:
                        data['direction'] = 'incoming'
                        
                    cdms.append(data)


    except Exception as error:
        return bad_request(error)
    
    return cdms

cdms.add_route(Cdms.as_view(), '/<cdm_id>')