from sanic import Blueprint

from .v1 import api_v1

api_v1 = Blueprint.group(api_v1, url_prefix='/api')