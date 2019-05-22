FROM nginx:latest

COPY nginx.prod.conf /etc/nginx/nginx.conf
COPY dhparam.pem /etc/nginx/dhparam.pem
COPY ssl_params.conf /etc/nginx/ssl_params.conf

COPY ssl/chainify.org.crt /etc/nginx/chainify.org.crt
COPY ssl/chainify.org.key /etc/nginx/chainify.org.key