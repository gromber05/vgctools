proxy_pass http://api:8000;
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Forwarded-Proto $scheme;
client_max_body_size 5m;
add_header Cache-Control "no-store" always;
add_header X-Content-Type-Options "nosniff" always;
