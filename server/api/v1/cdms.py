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

def get_cdms(alice, thread_hash=None, limit=None, last_tx_id=None):
    conn = psycopg2.connect(**dsn)
    try:
        with conn:
            with conn.cursor() as cur:
                sql = """
                    SELECT DISTINCT ON (c.thread_hash, c.message_hash, min_ts)
                        c.message,
                        c.message_hash,
                        t.id,
                        c.id,
                        t.attachment_hash,
                        t.timestamp,
                        t.sender_public_key,
                        c.recipient,
                        c.thread_hash,
                        s.sender,
                        c.timestamp,
                        (
                            SELECT min(tt.timestamp)
                            FROM cdms cc
                            LEFT JOIN transactions tt on cc.tx_id = tt.id
                            WHERE cc.message_hash = c.message_hash
                        ) as min_ts,
                        c.subject,
                        c.subject_hash,
                        c.type,
                        t.attachment,
                        s.signature,
                        array(
                            SELECT p.proof
                            FROM proofs p
                            WHERE p.tx_id = t.id
                        ) as proofs,
                        c.re_subject_hash,
                        c.re_message_hash,
                        c.fwd_subject_hash,
                        c.fwd_message_hash
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

                # if thread_hash not in ['None', None]:
                #     sql += "\nAND c.thread_hash='{0}'".format(thread_hash)

                # if last_tx_id:
                #     sql += "\nAND c.timestamp > (SELECT timestamp FROM cdms WHERE tx_id='{0}')".format(last_tx_id)

                # if limit:
                #     sql += '\nORDER BY min_ts DESC'
                #     sql += '\nLIMIT ' + str(limit)
                # else:
                #     sql += 'ORDER BY min_ts DESC'
                
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
                        "message": record[0],
                        "messageHash": record[1],
                        "txId": record[2],
                        "id": record[3],
                        "attachmentHash": record[4],
                        "timestamp": record[5],
                        "realSender": record[6],
                        "logicalSender": record[9] or record[6],
                        "recipient": record[7],
                        "threadHash": record[8],
                        "subject": record[12],
                        "subjectHash": record[13],
                        "type": record[14],
                        "sharedWith": shared_with,
                        "ipfsHash": base58.b58decode(record[15]).decode('utf-8'),
                        "signature": record[16] or record[17][0],
                        "reSubjectHash": record[18],
                        "reMessageHash": record[19],
                        "fwdSubjectHash": record[20],
                        "fwdMessageHash": record[21],
                    }

                    sender = record[9] or record[6]
                    if alice == sender:
                        data['direction'] = 'outgoing'
                    else:
                        data['direction'] = 'incoming'
                        
                    cdms.append(data)


    except Exception as error:
        return bad_request(error)
    
    return cdms