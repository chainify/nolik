import os
import time
import psycopg2
import hashlib
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

def asd(records, threads = None, fwd_thread_hash = None):
    if not threads:
        threads = [None] * len(records)
    
    i = 0
    for thread in threads:
        if thread:
            i += 1
    
    if i == len(records):
        return threads

    for index, record in enumerate(records):
        if (threads[index]):
            continue

        subject_hash = record[0]
        message_hash = record[1]
        re_subject_hash = record[2]
        re_message_hash = record[3]
        fwd_subject_hash = record[4]
        fwd_message_hash = record[5]
        tx_id = record[6]

        if not re_subject_hash and not re_message_hash and not fwd_subject_hash and not fwd_message_hash:
            thread_hash = hashlib.sha256(''.join([subject_hash, message_hash]).encode('utf-8')).hexdigest()
            threads[index] = (subject_hash, message_hash, thread_hash)
            return asd(records, threads, fwd_thread_hash=None)

        if re_subject_hash and re_message_hash and not fwd_subject_hash and not fwd_message_hash:
            thread_hash = hashlib.sha256(''.join([re_subject_hash, re_message_hash]).encode('utf-8')).hexdigest()
            threads[index] = (re_subject_hash, re_message_hash, thread_hash)
            return asd(records, threads, fwd_thread_hash=None)

        if fwd_subject_hash and fwd_message_hash and re_subject_hash and re_message_hash:
            thread_hash = hashlib.sha256(''.join(['fwd', re_subject_hash, re_message_hash]).encode('utf-8')).hexdigest()
            threads[index] = (re_subject_hash, re_message_hash, thread_hash)
            return asd(records, threads, fwd_thread_hash=None)

        if fwd_subject_hash and fwd_message_hash and not re_subject_hash and not re_message_hash:
            thread_hash = hashlib.sha256(''.join(['fwd', fwd_subject_hash, fwd_message_hash]).encode('utf-8')).hexdigest()
            threads[index] = (fwd_subject_hash, fwd_message_hash, thread_hash)
            return asd(records, threads, fwd_thread_hash=None)

    
    

def get_threads(alice, last_tx_id = None):
    conn = psycopg2.connect(**dsn)
    try:
        with conn:
            with conn.cursor() as cur:
                sql = """
                    SELECT DISTINCT
                        c.subject_hash,
                        c.message_hash,
                        c.re_subject_hash,
                        c.re_message_hash,
                        c.fwd_subject_hash,
                        c.fwd_message_hash,
                        c.tx_id,
                        c.recipient,
                        c.timestamp
                    FROM cdms c
                    LEFT JOIN transactions t on c.tx_id = t.id
                    WHERE (c.recipient='{0}' OR t.sender_public_key='{0}')
                """.format(alice)
                if last_tx_id:
                    sql += "\nAND c.timestamp > (SELECT DISTINCT timestamp FROM cdms WHERE tx_id='{0}')".format(last_tx_id)
                sql += "\nORDER BY timestamp ASC;"

                cur.execute(sql)
                records = cur.fetchall()

                threads_data = asd(records)
                threads = []
                for subject_hash, message_hash, thread_hash in threads_data:
                    print(thread_hash)
                    # pass
                    # members =[]
                    # cdms = get_cdms(alice, subject_hash, message_hash, last_tx_id)
                    # for cdm in cdms:
                    #     members.append(cdm['logicalSender'])
                    #     members.append(cdm['recipient'])
                    
                    # members = list(set(members))

                    # threads.append({
                    #     'cdms': cdms,
                    #     'members': [member for member in members if member != alice],
                    #     'threadHash': thread_hash 
                    # })
    except Exception as error:
        return bad_request(error)

    return threads
                # for tx_id in tx_ids:
                #     sql = """
                #         SELECT
                #             subject_hash,
                #             message_hash,
                #             re_subject_hash,
                #             re_message_hash,
                #             fwd_subject_hash,
                #             fwd_message_hash
                #         FROM cdms
                #         WHERE tx_id='{}'
                #     """.format(tx_id[0])
                #     cur.execute(sql)
                #     hashes = cur.fetchall()

                #     subject_hash = hashes[0][0]
                #     message_hash = hashes[0][1]
                #     re_subject_hash = hashes[0][2]
                #     re_message_hash = hashes[0][3]
                #     fwd_subject_hash = hashes[0][4]
                #     fwd_message_hash = hashes[0][5]

                #     thread_hash = hashlib.sha256(''.join([subject_hash or '', message_hash or '']).encode('utf-8')).hexdigest()
                #     if re_subject_hash and re_message_hash:
                #         thread_hash = hashlib.sha256(''.join([re_subject_hash or '', re_message_hash or '']).encode('utf-8')).hexdigest()

                #     print('hashes',hashes)

                #     sql = """
                #         SELECT recipient FROM cdms
                #         WHERE tx_id='{0}'
                #         UNION
                #         SELECT sender_public_key FROM transactions
                #         WHERE id='{0}'
                #         UNION
                #         SELECT s.sender FROM senders s
                #         LEFT JOIN cdms c ON s.cdm_id = c.id
                #         LEFT JOIN transactions t ON c.tx_id = t.id
                #         WHERE c.tx_id='{0}'
                #     """.format(tx_id[0])
                #     cur.execute(sql)
                #     members = [member[0] for member in cur.fetchall() if member[0] != alice]

                    # thread = {
                    #     'threadHash': 'thread_hash',
                    #     'members': 'members'
                    # }
                    # threads.append(thread)


