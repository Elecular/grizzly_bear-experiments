#!/bin/bash
cd "$(dirname "$0")"
cd ..

docker-compose -f docker-compose.yml -f docker-compose.dev.yml down -v --remove-orphans
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up