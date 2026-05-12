#!/bin/bash
COOKIE_FILE=$(mktemp)

# 1. Login
curl -sS -c $COOKIE_FILE -X POST http://localhost:1323/session \
  -H "Content-Type: application/json" \
  -d '{"username": "bob@example.com", "password": "supersecret"}' > /dev/null

UID_STR="1758924949.M852997P11059.ms19.migadu.com,S=65314,W=65314"

echo "=== MESSAGE METADATA ==="
curl -sS -b $COOKIE_FILE http://localhost:1323/mailboxes/INBOX/messages/$UID_STR | jq .

rm $COOKIE_FILE
