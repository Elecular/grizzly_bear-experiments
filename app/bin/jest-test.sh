#!/bin/bash
cd "$(dirname "$0")"
cd ..

docker-compose -f docker-compose.dev.yml -f docker-compose.test.yml down
docker-compose -f docker-compose.dev.yml -f docker-compose.test.yml up --abort-on-container-exit