import os
from sanic import Sanic
from api import api_v1
import configparser
from sanic_cors import CORS

config = configparser.ConfigParser()
config.read('config.ini')

app = Sanic('nolik_api')
app.blueprint(api_v1)
cors = CORS(app, resources={r"/api/*": {"origins": os.environ['ORIGINS'].split(',')}})

if __name__ == "__main__":
    env = os.environ['ENV']
    app.run(
        host=config['app']['host'],
        port=int(config['app']['port']),
        debug=env == 'development',
        workers=4 if env == 'production' else 1
    )
