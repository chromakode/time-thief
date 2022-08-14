#!/bin/sh
cat > /etc/caddy/Caddyfile << EOL
handle https://${SYNC_HOSTNAME}:1234/userdb-* {
    reverse_proxy couchdb:5984
}
EOL

caddy run --config /etc/caddy/Caddyfile