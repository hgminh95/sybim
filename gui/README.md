# GUI

## Requirement

- Jinja2

## Build

Run `python3 generate_everything.py` to build the projects.

## Development

To setup development env, you can use Nginx. Below is a sample config:

```lang=nginx
  upstream websocket {
    server 127.0.0.1:${SYNC_SERVER_PORT}
  }

  server {
    listen 1330;
    root /path/to/build/_build;

    location / {
      index index.html;
    }

    location /static/* {
      alias /static;
    }

    location /r/ {
      try_files /room.html /room.html;
    }

    location /j {
      try_files /join.html /join.html;
    }

    location /c {
      try_files /create.html /create.html;
    }

    location /faq {
      try_files /faq.html /faq.html;
    }

    location /ws {
      proxy_pass http://websocket;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection $connection_upgrade;
      proxy_set_header Host $host;
    }

    location /robots.txt {
      try_files /robots.txt /robots.txt;
    }
  }
```

