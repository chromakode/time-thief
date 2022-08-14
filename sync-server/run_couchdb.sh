#!/bin/bash
set -e

cat >> /opt/couchdb/etc/local.d/time-thief.ini << EOL
[couchdb]
single_node=true

[couch_peruser]
enable = true

[chttpd]
bind_address = 0.0.0.0
port = 5984
enable_cors = true

[cors]
credentials = true
origins = http://localhost, https://tmthf.me
methods = GET, PUT, POST, HEAD, DELETE
headers = accept, authorization, content-type, origin, referer, x-csrf-token
EOL

/docker-entrypoint.sh /opt/couchdb/bin/couchdb &
couch_pid=$*

couchdb_api="http://${COUCHDB_USER}:${COUCHDB_PASSWORD}@localhost:5984"

curl -sS --retry 5 --retry-delay 1 --retry-all-errors \
     -X PUT ${couchdb_api}/_users/org.couchdb.user:${SYNC_USER} \
     -H "Accept: application/json" \
     -H "Content-Type: application/json" \
     -d "{\"name\": \"${SYNC_USER}\", \"password\": \"${SYNC_PASSWORD}\", \"roles\": [], \"type\": \"user\"}"

sync_user_hex=$(echo -n "$SYNC_USER" | od -t x1 -A n | tr -d '[:space:]')

echo "=== CouchDB sync endpoint ready: https://${SYNC_USER}:${SYNC_PASSWORD}@${SYNC_HOSTNAME}:1234/userdb-${sync_user_hex} ==="

wait $couch_pid