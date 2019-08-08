from sanic import Blueprint
from .cdms import cdms
from .ipfs import ipfs
# from .accounts import accounts
from .groups import groups
from .heartbeat import heartbeat

api_v1 = Blueprint.group(
  cdms,
  ipfs,
  groups,
  heartbeat,
  url_prefix='/v1'
)


