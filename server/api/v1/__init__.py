from sanic import Blueprint
from .ipfs import ipfs
from .heartbeat import heartbeat
from .cdms import cdms

api_v1 = Blueprint.group(
  ipfs,
  cdms,
  heartbeat,
  url_prefix='/v1'
)