#!/bin/bash
cd "$(dirname "$0")"
cd ..

docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up --build -d
wait-on http://localhost:80 --timeout 60000
newman run test/acceptance_test.postman_collection.json
docker-compose -f docker-compose.dev.yml down