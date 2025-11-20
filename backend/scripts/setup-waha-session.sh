#!/bin/bash

# WAHA Session Setup Script
# This script helps create a new WhatsApp session with webhook configuration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
WAHA_URL=${WAHA_URL:-"http://localhost:3000"}
WAHA_API_KEY=${WAHA_API_KEY:-"127434fd3a9643f0bdc7440cb8a6ba4e"}
WEBHOOK_URL=${WEBHOOK_URL:-"http://host.docker.internal:3001/webhooks/waha"}
WEBHOOK_SECRET=${WEBHOOK_SECRET:-""}
SESSION_NAME=${SESSION_NAME:-"default"}

echo -e "${GREEN}WAHA Session Setup${NC}"
echo "===================="
echo ""

# Check if WAHA is running
echo -e "${YELLOW}Checking WAHA connection...${NC}"
if ! curl -s -f -o /dev/null -H "X-Api-Key: ${WAHA_API_KEY}" "${WAHA_URL}/api/sessions"; then
    echo -e "${RED}Error: Cannot connect to WAHA at ${WAHA_URL}${NC}"
    echo "Make sure WAHA is running: cd waha && docker-compose up -d"
    exit 1
fi
echo -e "${GREEN}✓ WAHA is running${NC}"
echo ""

# Check if webhook secret is configured
if [ -z "$WEBHOOK_SECRET" ]; then
    echo -e "${YELLOW}Warning: WEBHOOK_SECRET not set${NC}"
    echo "Webhooks will not use HMAC authentication"
    echo "Set WEBHOOK_SECRET environment variable for secure webhooks"
    echo ""
    read -p "Continue without HMAC? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Generating a random secret..."
        WEBHOOK_SECRET=$(openssl rand -hex 32)
        echo -e "${GREEN}Generated secret: ${WEBHOOK_SECRET}${NC}"
        echo ""
        echo "Add this to your backend/.env file:"
        echo "WAHA_WEBHOOK_SECRET=${WEBHOOK_SECRET}"
        echo ""
        echo "Add this to your waha/.env file:"
        echo "WHATSAPP_HOOK_HMAC_KEY=${WEBHOOK_SECRET}"
        echo ""
        read -p "Press Enter after updating .env files..." 
    fi
fi

# Build webhook configuration
WEBHOOK_CONFIG='[{
    "url": "'"${WEBHOOK_URL}"'",
    "events": [
        "session.status",
        "message",
        "message.any",
        "message.reaction",
        "message.ack"
    ],
    "retries": {
        "policy": "exponential",
        "delaySeconds": 2,
        "attempts": 3
    }'

if [ -n "$WEBHOOK_SECRET" ]; then
    WEBHOOK_CONFIG="${WEBHOOK_CONFIG}"',
    "hmac": {
        "key": "'"${WEBHOOK_SECRET}"'"
    }'
fi

WEBHOOK_CONFIG="${WEBHOOK_CONFIG}"'
}]'

# Create session payload
SESSION_PAYLOAD='{
    "name": "'"${SESSION_NAME}"'",
    "config": {
        "webhooks": '"${WEBHOOK_CONFIG}"'
    }
}'

echo -e "${YELLOW}Creating session: ${SESSION_NAME}${NC}"
echo "Webhook URL: ${WEBHOOK_URL}"
echo ""

# Create or restart session
RESPONSE=$(curl -s -X POST "${WAHA_URL}/api/sessions/" \
    -H "Content-Type: application/json" \
    -H "X-Api-Key: ${WAHA_API_KEY}" \
    -d "${SESSION_PAYLOAD}")

if echo "$RESPONSE" | grep -q "error"; then
    echo -e "${RED}Error creating session:${NC}"
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    exit 1
fi

echo -e "${GREEN}✓ Session created successfully${NC}"
echo ""

# Wait a moment for session to initialize
sleep 2

# Get QR code
echo -e "${YELLOW}Fetching QR code...${NC}"
QR_RESPONSE=$(curl -s -X GET "${WAHA_URL}/api/sessions/${SESSION_NAME}/qr" \
    -H "X-Api-Key: ${WAHA_API_KEY}")

if echo "$QR_RESPONSE" | grep -q "qr"; then
    echo -e "${GREEN}✓ QR Code received${NC}"
    echo ""
    echo "Scan this QR code with WhatsApp:"
    echo ""
    echo "$QR_RESPONSE" | jq -r '.qr' 2>/dev/null || echo "$QR_RESPONSE"
    echo ""
    echo "Or view it in the WAHA Dashboard:"
    echo "${WAHA_URL}/dashboard"
else
    echo -e "${YELLOW}Session may already be authenticated or starting up${NC}"
    echo "Check status at: ${WAHA_URL}/dashboard"
fi

echo ""
echo -e "${GREEN}Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Scan QR code with WhatsApp (if shown above)"
echo "2. Wait for session status to become WORKING"
echo "3. Send a test message to your WhatsApp number"
echo "4. Check backend logs: npm run start:dev"
echo ""
echo "Monitor events:"
echo "- Dashboard: ${WAHA_URL}/dashboard"
echo "- Session status: curl -H 'X-Api-Key: ${WAHA_API_KEY}' ${WAHA_URL}/api/sessions/${SESSION_NAME}"
