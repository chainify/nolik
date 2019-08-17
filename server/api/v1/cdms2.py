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

def get_cdms(alice, subject_hash, message_hash, last_tx_id=None):
    conn = psycopg2.connect(**dsn)
    try:
        with conn:
            with conn.cursor() as cur:
                sql = """
                    SELECT
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
                        t.id,
                        t.attachment,
                        t.attachment_hash,
                        s.signature,
                        array(
                            SELECT p.proof
                            FROM proofs p
                            WHERE p.tx_id = t.id
                        ) as proofs
                    FROM cdms c
                    LEFT JOIN transactions t ON t.id =  c.tx_id
                    LEFT JOIN senders s ON s.cdm_id = c.id
                    WHERE ((subject_hash='{1}' AND message_hash='{2}') OR (re_subject_hash='{1}' AND re_message_hash='{2}'))
                    AND (c.recipient='{0}' OR t.sender_public_key='{0}')
                """.format(alice, subject_hash, message_hash)
                # if last_tx_id:
                #     sql += "\nAND c.timestamp > (SELECT DISTINCT timestamp FROM cdms WHERE tx_id='{0}')".format(last_tx_id)
                sql += "\nORDER BY c.timestamp DESC;"

                cur.execute(sql)
                records = cur.fetchall()

                sql = """
                    SELECT DISTINCT c.recipient, c.tx_id, c.timestamp, c.type
                    FROM cdms c
                    WHERE (c.subject_hash='{0}' AND c.message_hash='{1}')
                """.format(subject_hash, message_hash)
                cur.execute(sql)

                shared_with = [{
                    'publicKey': row[0],
                    'txId': row[1],
                    'timestamp': row[2],
                    'type': row[3]
                } for row in cur.fetchall()]

                cdms = []
                for record in records:
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
                        "txId": record[12],
                        "ipfsHash": base58.b58decode(record[13]).decode('utf-8'),
                        "attachmentHash": record[14],
                        "signature": record[15] or record[16][0],
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