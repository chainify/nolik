from sanic import Blueprint
from .cdms import cdms
from .ipfs import ipfs
from .threads import threads
from .heartbeat import heartbeat

api_v1 = Blueprint.group(
  cdms,
  ipfs,
  threads,
  heartbeat,
  url_prefix='/v1'
)


