from sanic import Blueprint
from .parser import parser

api_v1 = Blueprint.group(parser, url_prefix='/v1')


