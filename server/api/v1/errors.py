from sanic.response import json

def bad_request(message):
    return json({'error': 'bad request', 'message': '{0}'.format(message)}, status=400)

def unauthorized(message):
    return json({'error': 'unauthorized', 'message': '{0}'.format(message)}, status=401)

def forbidden(message):
    return json({'error': 'forbidden', 'message': '{0}'.format(message)}, status=403)

def conflict(message):
    return json({'error': 'conflict', 'message': '{0}'.format(message)}, status=409)
