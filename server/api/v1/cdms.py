import os
import psycopg2
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

def get_cdms(alice, thread_hash):
    conn = psycopg2.connect(**dsn)
    try:
        with conn:
            with conn.cursor() as cur:
                sql = """
                    SELECT DISTINCT ON (c.thread_hash, c.message_hash, min_ts)
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
                        t.id,
                        t.attachment,
                        t.attachment_hash,
                        s.signature,
                        array(
                            SELECT p.proof
                            FROM proofs p
                            WHERE p.tx_id = t.id
                        ) as proofs,
                        (
                            SELECT min(tt.timestamp)
                            FROM cdms cc
                            LEFT JOIN transactions tt on cc.tx_id = tt.id
                            WHERE cc.message_hash = c.message_hash
                        ) as min_ts
                    FROM cdms c
                    LEFT JOIN transactions t on c.tx_id = t.id
                    LEFT JOIN senders s on c.id = s.cdm_id
                    WHERE (c.recipient = '{alice}' or t.sender_public_key = '{alice}')
                    AND c.thread_hash='{thread_hash}'
                    ORDER BY min_ts DESC
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
                        hash=record[1]
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
                        "txId": record[13],
                        "ipfsHash": base58.b58decode(record[14]).decode('utf-8'),
                        "attachmentHash": record[15],
                        "signature": record[16] or record[17][0],
                        "sharedWith": shared_with
                    }

                    sender = record[1] or record[2]
                    if alice == sender:
                        data['direction'] = 'outgoing'
                    else:
                        data['direction'] = 'incoming'
                        
                    cdms.append(data)


    except Exception as error:
        return bad_request(error)
    
    return cdms
