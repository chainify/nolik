import os
from sanic import Sanic
from api import api_v1
import configparser

config = configparser.ConfigParser()
config.read('config.ini')

app = Sanic('nolik_parser')
app.blueprint(api_v1)

if __name__ == "__main__":
    env = os.environ['ENV']
    app.run(
        host=config['app']['host'],
        port=int(config['app']['port']),
        debug=env == 'development',
        workers=1
    )
