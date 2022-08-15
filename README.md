<p align="center"><img width="150px" src="src/logoWithBorder.svg"></p>

# [TIME THIEF](https://tmthf.me)

TIME THIEF is a calm, habit-forming offline journal.

Every 15 minutes, 3 prompts (called "activities") are deterministically generated using a [rules engine](src/activities.json). Journal entries are stored locally in a PouchDB.

### Sync server

By default, TIME THIEF doesn't transmit any data from your device. An optional [sync server configuration](./sync-server) is provided to roll your own private backup service.
