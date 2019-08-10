import os
import sys
import re
from sanic import Blueprint
from sanic.response import json
from sanic.log import logger
import asyncio
import aiohttp
import requests
import psycopg2
import json as pjson
from psycopg2.extras import execute_values
import sendgrid
from sendgrid.helpers.mail import *
import hashlib
from datetime import datetime
from time import time
from .errors import bad_request
import configparser
import uuid
import signal
import subprocess
import base58
from .utils import verify_signature
import xml.etree.ElementTree as ET

config = configparser.ConfigParser()
config.read('config.ini')

parser = Blueprint('parser_v1', url_prefix='/parser')
dsn = {
    "user": config['DB']['user'],
    "password": config['DB']['password'],
    "database": config['DB']['database'],
    "host": config['DB']['host'],
    "port": config['DB']['port'],
    "sslmode": config['DB']['sslmode'],
    "target_session_attrs": config['DB']['target_session_attrs']
}


class Parser:
    def __init__(self):
        self.height = 1
        self.last_block = None
        self.step = 5
        self.blocks_to_check = 5

        self.db_reconnects = 0
        self.db_max_reconnects = 10
        self.transactions_inserted = 0

        self.sql_data_transactions = []
        self.sql_data_proofs = []
        self.sql_data_cdms = []
        self.sql_data_senders = []

    async def emergency_stop_loop(self, title, error):
        logger.info('Emergency loop stop request')
        logger.info('Reason: {}'.format(error))
        logger.info('Closing tasks')
        for task in asyncio.Task.all_tasks():
            task.cancel()

        logger.info('Stopping loop')
        loop = asyncio.get_running_loop()
        loop.stop()
        return bad_request(error)

    async def fetch_data(self, url, session):
        try:
            async with session.get(url) as response:
                data = await response.text()
                data = pjson.loads(data)
                cnfy_id = 'cnfy-{}'.format(str(uuid.uuid4()))

                for tx in data['transactions']:
                    if tx['type'] in [4] and tx['feeAssetId'] == config['blockchain']['asset_id']:
                        
                        attachment_base58 = base58.b58decode(tx['attachment']).decode('utf-8')
                        print('attachment_base58', attachment_base58)
                        attachment = None
                        try:
                            attachment = requests.get('{0}:{1}/ipfs/{2}'.format(config['ipfs']['host'], config['ipfs']['get_port'], attachment_base58), timeout=2).text
                        except Exception as error:
                            logger.error('IPFS Error: {0}'.format(error))

                        if attachment == None:
                            logger.warning('CONTINUE ON IPFS HASH {0}'.format(attachment_base58) )
                            continue

                        attachment_hash = hashlib.sha256(attachment.encode('utf-8')).hexdigest()
                        print(attachment)
                        root = ET.fromstring(attachment)
                        version = root.findall('version')[0].text if len(root.findall('version')) > 0 else None
                        blockchain = root.findall('blockchain')[0].text if len(root.findall('blockchain')) > 0 else None
                        network = root.findall('network')[0].text if len(root.findall('network')) > 0 else None
                        messages = root.findall('messages')[0] if len(root.findall('messages')) > 0 else []
                        
                        # members = [tx['senderPublicKey']]
                        # for message in messages:
                        #     to_public_key = None
                        #     to = message.findall('to')[0] if len(message.findall('to')) > 0 else None
                        #     if to:
                        #         to_public_key = to.findall('publickey')[0].text if len(to.findall('publickey')) > 0 else None
                        #     if to_public_key and to_public_key not in members:
                        #         members.append(to_public_key)

                        #     cc_public_key = None
                        #     cc = message.findall('cc')[0] if len(message.findall('cc')) > 0 else None
                        #     if cc:
                        #         cc_public_key = cc.findall('publickey')[0].text if len(cc.findall('publickey')) > 0 else None
                        #     if cc_public_key and cc_public_key not in members:
                        #         members.append(cc_public_key)

                        # group_hash = hashlib.sha256(''.join(sorted(members)).encode('utf-8')).hexdigest()
                        for message in messages:
                            to_public_key = None
                            cc_public_key = None
                            to = message.findall('to')[0] if len(message.findall('to')) > 0 else None
                            cc = message.findall('cc')[0] if len(message.findall('cc')) > 0 else None
                            if to:
                                to_public_key = to.findall('publickey')[0].text if len(to.findall('publickey')) > 0 else None
                            if cc:
                                cc_public_key = cc.findall('publickey')[0].text if len(cc.findall('publickey')) > 0 else None

                            subject_ciphertext = None
                            subject_sha256hash = None
                            subject = message.findall('subject')[0] if len(message.findall('subject')) > 0 else None
                            if subject:
                                subject_ciphertext = subject.findall('ciphertext')[0].text if len(subject.findall('ciphertext')) > 0 else None
                                subject_sha256hash = subject.findall('sha256')[0].text if len(subject.findall('sha256')) > 0 else None

                            body_ciphertext = None
                            body_sha256hash = None
                            body = message.findall('body')[0] if len(message.findall('body')) > 0 else None
                            if body:
                                body_ciphertext = body.findall('ciphertext')[0].text if len(body.findall('ciphertext')) > 0 else None
                                body_sha256hash = body.findall('sha256')[0].text if len(body.findall('sha256')) > 0 else None

                            recipient_public_key = to_public_key if to_public_key else cc_public_key
                            recipient_type = 'to' if to_public_key else 'cc'

                            group_hash = hashlib.sha256(''.join([subject_sha256hash or '', body_sha256hash or '']).encode('utf-8')).hexdigest()
                            extra = message.findall('extra')[0] if len(message.findall('extra')) > 0 else None
                            if extra:
                                group_hash = extra.findall('groupHash')[0].text if len(extra.findall('groupHash')) > 0 else None

                            cdm_id = 'cdm-' + str(uuid.uuid4())
                            self.sql_data_cdms.append((
                                cdm_id,
                                tx['id'],
                                recipient_public_key,
                                subject_ciphertext,
                                subject_sha256hash,
                                body_ciphertext,
                                body_sha256hash,
                                group_hash,
                                blockchain,
                                network,
                                recipient_type
                            ))
                            
                            senders = message.findall('from')[0] if len(message.findall('from')) > 0 else None
                            if senders:
                                for sender in senders:
                                    sender_public_key = sender.findall('publickey')[0].text if len(sender.findall('publickey')) > 0 else None
                                    signature = sender.findall('signature')[0].text if len(sender.findall('signature')) > 0 else None

                                    sender_id = str(uuid.uuid4())                                    
                                    self.sql_data_senders.append((sender_id, cdm_id, sender_public_key, signature, True))

                        tx_data = (
                            tx['id'],
                            data['height'],
                            tx['type'],
                            tx['sender'],
                            tx['senderPublicKey'],
                            tx['recipient'],
                            tx['amount'],
                            tx['assetId'],
                            tx['feeAssetId'],
                            tx['feeAsset'],
                            tx['fee'],
                            tx['attachment'],
                            tx['version'],
                            datetime.fromtimestamp(tx['timestamp'] / 1e3),
                            cnfy_id,
                            attachment_hash,
                            attachment
                        )
                        
                        self.sql_data_transactions.append(tx_data)

                        for proof in tx['proofs']:
                            self.sql_data_proofs.append((tx['id'], proof))

                       

        except asyncio.CancelledError:
            logger.info('Parser has been stopped')
            raise
        except Exception as error:
            logger.error('Fetching data error: {}'.format(error))
            pass
            # await self.emergency_stop_loop('Fetch data', error)

    async def save_data(self):
        conn = psycopg2.connect(**dsn)
        try:
            with conn:
                with conn.cursor() as cur:
                    if len(self.sql_data_transactions) > 0:
                        sql = """INSERT INTO transactions (id, height, type, sender, sender_public_key, recipient,
                        amount, asset_id, fee_asset_id, fee_asset, fee, attachment, version, timestamp, cnfy_id, attachment_hash, attachment_text)
                        VALUES %s ON CONFLICT (id) DO UPDATE SET height = EXCLUDED.height"""
                        execute_values(cur, sql, self.sql_data_transactions)
                        if cur.rowcount > 0:
                            self.transactions_inserted += cur.rowcount

                        sql = """INSERT INTO proofs (tx_id, proof) VALUES %s ON CONFLICT DO NOTHING"""
                        execute_values(cur, sql, self.sql_data_proofs)

                        sql = """INSERT INTO cdms (id, tx_id, recipient, subject, subject_hash, message, message_hash, group_hash, blockchain, network, type)
                        VALUES %s ON CONFLICT DO NOTHING"""
                        execute_values(cur, sql, self.sql_data_cdms)        

                        if len(self.sql_data_senders) > 0:
                            sql = """INSERT INTO senders (id, cdm_id, sender, signature, verified)
                            VALUES %s ON CONFLICT DO NOTHING"""
                            execute_values(cur, sql, self.sql_data_senders)                     

                    conn.commit()
                    logger.info('Saved {0} transactions'.format(self.transactions_inserted))

        except psycopg2.IntegrityError as error:
            logger.info('Error', error)
            pass
        except asyncio.CancelledError:
            logger.info('Parser has been stopped')
            raise
        except Exception as error:
            logger.info('Height: {}'.format(self.height))
            logger.error('Batch insert error: {}'.format(error))
            await self.emergency_stop_loop('Batch insert error', error)
        finally:
            self.transactions_inserted = 0
            self.sql_data_transactions = []
            self.sql_data_proofs = []
            self.sql_data_cdms = []
            self.sql_data_senders = []

    async def start(self):
        conn = None
        try:
            conn = psycopg2.connect(**dsn)
        except psycopg2.OperationalError as error:
            logger.error('Postgres Engine Error:', error)
            await self.emergency_stop_loop('No conn error', 'Error on connection to Postgres Engine')

        try:
            with conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT max(height) FROM transactions")
                    max_height = cur.fetchone()

                    if max_height and max_height[0]:
                        if max_height[0] > self.blocks_to_check:
                            self.height = max_height[0] - self.blocks_to_check

                    if config['blockchain']['start_height']:
                        start_height = int(config['blockchain']['start_height'])
                        if self.height < start_height:
                            self.height = start_height

        
        except Exception as error:
            logger.error('Max height request error: {}'.format(error))
            await self.emergency_stop_loop('Max height request error', error)

        while True:
            try:
                req = requests.get('{0}/node/status'.format(config['blockchain']['host']))
                data = req.json()
                self.last_block = int(data['blockchainHeight'])

                with conn:
                    with conn.cursor() as cur:
                        if self.height > self.last_block:
                            cur.execute("""
                                DELETE FROM transactions WHERE height > '{height}'
                            """.format(
                                height=self.last_block
                            ))
                            self.height = self.last_block
                            conn.commit()

            except Exception as error:
                await self.emergency_stop_loop('Waves node is not responding', error)

            logger.info('Start height: {}, last block: {}'.format(self.height, self.last_block))
            logger.info('-' * 40)
            try:
                async with aiohttp.ClientSession() as session:
                    try:
                        while self.height < self.last_block:
                            t0 = time()
                            batch = self.height + self.step
                            if self.height + self.step >= self.last_block:
                                batch = self.last_block + 1

                            batch_range = (self.height, batch)
                            tasks = []
                            for i in range(batch_range[0], batch_range[1]):
                                url = '{0}/blocks/at/{1}'.format(config['blockchain']['host'], self.height)
                                task = asyncio.create_task(self.fetch_data(url, session))
                                tasks.append(task)
                                self.height += 1
                            logger.info('Height range {0} - {1}'.format(batch_range[0], batch_range[1]))
                            await asyncio.gather(*tasks)
                            await self.save_data()
                            logger.info('Parsing time: {0} sec'.format(time() - t0))
                            logger.info('-' * 40)

                    except asyncio.CancelledError:
                        logger.info('Parser stopping...')
                        raise
                    except Exception as error:
                        logger.error('Blocks session cycle error on height {0}: {1}'.format(self.height, error))
                        await self.emergency_stop_loop('Blocks session cycle error', error)

            except asyncio.CancelledError:
                logger.info('Parser has been stopped')
                raise
            except Exception as error:
                logger.error('Request blocks cycle error: {0}'.format(error))
                await self.emergency_stop_loop('Request blocks cycle', error)
            finally:
                self.height = self.height - self.blocks_to_check
                await asyncio.sleep(2)


controls = Parser()

@parser.listener('after_server_start')
def autostart(app, loop):
    loop.create_task(controls.start())
    logger.info('Autostart Success!')

@parser.listener('after_server_stop')
def gentle_exit(app, loop):
    logger.info('Killing the process')
    os.kill(os.getpid(), signal.SIGKILL)

# @parser.route('/start', methods=['POST'])
# def controls_start(request):
#     loop = asyncio.get_running_loop()
#     loop.create_task(controls.start())
#     return json({"action": "start", "status": "OK"})

@parser.route('/healthcheck', methods=['GET'])
def container_healthcheck(request):
    return json({"action": "healthcheck", "status": "OK"})


# @parser.route('/stop', methods=['POST'])
# def controls_stop(request):
#     try:
#         loop = asyncio.get_running_loop()
#         tasks = [t for t in asyncio.all_tasks() if t is not
#                  asyncio.current_task()]

#         [task.cancel() for task in tasks]

#         logger.info('Canceling outstanding tasks')
#         asyncio.gather(*tasks)
#         loop.stop()
#         logger.info('Shutdown complete.')

#     except Exception as error:
#         return bad_request(error)

#     return json({"action": "stop", "status": "OK"})
