# TIME THIEF Sync

## Background

TIME THIEF can optionally sync with a backend supporting the [CouchDB replication protocol](https://docs.couchdb.org/en/3.2.2/replication/intro.html). This allows seamless backup and editing the same journal on multiple devices.

Syncing replicates all data and images to the server. Data is transmitted over https but stored unencrypted.

## Sync Server

If you have a Linux server, you can run your own personal sync server.

This directory contains a basic [Docker Compose](https://docs.docker.com/compose) setup for a single user. HTTPS is automatically set up via Let's Encrypt by the [Caddy](https://caddyserver.com) server.

### Setup instructions

1. Launch a Linux server with Docker installed and point a DNS A record to it.
2. Copy [`example.env`](./example.env) to `.env` and edit the configuration values.
3. Run `docker-compose up`.
4. During startup, the `couchdb` container will log: "CouchDB sync endpoint ready:" with your sync endpoint URL. Copy this into your TIME THIEF settings.

### Data storage

The docker-compose config creates two subdirectories:

- `caddy_data`: Caddy HTTPS certificate state
- `couchdb_data`: Your journal data, stored by CouchDB

### Advanced usage

If you have specific constraints, you may be better served by adapting the configuration here to swap in your own Caddy config or alternate load balancer.
