#!/bin/bash
COOKIE_FILE=$(mktemp)

# 1. Login
curl -sS -c $COOKIE_FILE -X POST http://localhost:1323/session \
  -H "Content-Type: application/json" \
  -d '{"username": "bob@example.com", "password": "supersecret"}'

echo "=== LOGIN RESPONSE ==="

# 2. Get mailboxes
echo "=== MAILBOXES ==="
curl -sS -b $COOKIE_FILE http://localhost:1323/mailboxes

# 3. Get messages in INBOX
echo -e "\n=== MESSAGES in INBOX ==="
curl -sS -b $COOKIE_FILE http://localhost:1323/mailboxes/INBOX | head -c 2000

rm $COOKIE_FILE
