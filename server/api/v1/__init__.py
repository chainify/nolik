from sanic import Blueprint
from .ipfs import ipfs
from .heartbeat import heartbeat

api_v1 = Blueprint.group(
  ipfs,
  heartbeat,
  url_prefix='/v1'
)