from sanic import Blueprint

from .v1 import api_v1
# from .v2 import api_v2


api_v1 = Blueprint.group(api_v1, url_prefix='/api')
# __all__ = ['api_v1']
# __all__ = ['api_v1', 'api_v2']