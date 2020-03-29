#!/bin/bash
cd "$(dirname "$0")"
cd ..

docker-compose -f docker-compose.yml down -v --remove-orphans
docker-compose -f docker-compose.yml up --build -d
wait-on http://localhost:80 --timeout 60000
newman run test/acceptance_test.postman_collection.json
docker-compose -f docker-compose.yml down -v --remove-orphans