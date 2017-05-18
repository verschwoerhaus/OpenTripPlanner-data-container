#!/bin/bash

set +e

# Set these environment variables
#ROUTER_NAME // hsl/waltti/finland
#DOCKER_USER // dockerhub credentials
#DOCKER_AUTH

echo "*** Pre-building for" $ROUTER_NAME

ORG=${ORG:-hsldevcom}
CONTAINER=opentripplanner-data-container
DOCKER_IMAGE=$ORG/$CONTAINER-$ROUTER_NAME
DOCKER_BUILDER_IMAGE=$DOCKER_IMAGE:builder

echo "*** Fetching OSM data"
curl http://dev.hsl.fi/osm.finland/finland.osm.pbf -o finland.osm.pbf &
curl http://dev.hsl.fi/osm.hsl/hsl.osm.pbf -o hsl.osm.pbf &
wait

echo "*** Creating builder image"
docker build --build-arg ROUTER_NAME="$ROUTER_NAME" --tag=$DOCKER_BUILDER_IMAGE -f Dockerfile.builder .
if [ $? -ne 0 ]; then
    exit 0
fi
docker login -u $DOCKER_USER -p $DOCKER_AUTH
if [ $? -ne 0 ]; then
    exit 0
fi
docker push $DOCKER_BUILDER_IMAGE
if [ $? -ne 0 ]; then
    exit 0
fi

echo "*** $ROUTER_NAME pre-build finished"
