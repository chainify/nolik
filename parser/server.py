import os
from sanic import Sanic
from api import api_v1
import configparser

config = configparser.ConfigParser()
config.read('config.ini')

app = Sanic('parser')
app.blueprint(api_v1)

if __name__ == "__main__":
    app.run(
        debug=config['app']['debug'] == 'true',
        host=config['app']['host'],
        port=int(config['app']['port']),
        workers=int(config['app']['workers'])
    )
