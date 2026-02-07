#!/bin/bash

# Wait for backend to be ready
echo "Waiting for backend to start..."
sleep 5

# Add AI API endpoint to monitor
curl -X POST http://localhost:3000/endpoints \
  -H "Content-Type: application/json" \
  -d '{
    "name": "AI Query API",
    "url": "http://ai:8000/api/v1/generate_query",
    "method": "POST",
    "headers": {
      "Authorization": "Bearer 04b6c2f83f099b06eb9048a9263318b291d0c7ede841f1d87b7534a4be41d4ca",
      "content-type": "application/json"
    },
    "payload": {
      "tenant": "Sonny",
      "query_intent": "how many computers do i have?"
    },
    "intervalSeconds": 30,
    "timeoutMs": 10000,
    "alertOnFailure": true,
    "alertThresholdMs": 3000
  }'

echo -e "\n✓ AI API endpoint added!"
echo "View dashboard at: http://localhost:3001"
