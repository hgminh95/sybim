FROM python:3-alpine AS builder

COPY requirements.txt /src/

RUN pip3 install -r /src/requirements.txt

WORKDIR /src/

COPY . .

RUN python3 generate_everything.py


FROM nginx:alpine

ENV NGINX_ENVSUBST_OUTPUT_DIR=/etc/nginx/ \
    SYNC_SERVER_HOST=0.0.0.0 \
    SYNC_SERVER_PORT=1331

COPY nginx.conf.template /etc/nginx/templates/

COPY --from=builder /src/_build /html

EXPOSE 80
