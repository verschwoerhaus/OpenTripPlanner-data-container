#!/bin/bash

set +e

# Set these environment variables
#DOCKER_USER // dockerhub credentials
#DOCKER_AUTH

echo "*** Building generic builder image *

ORG=${ORG:-hsldevcom}
DOCKER_TAG=${DOCKER_TAG:-$TRAVIS_BUILD_ID}
DOCKER_IMAGE=$ORG/$CONTAINER-builder
DOCKER_BUILDER_IMAGE=opt-data-builder

echo "*** Creating builder image"
echo "***Build ID:"$DOCKER_TAG

docker build  --tag=$DOCKER_BUILDER_IMAGE -f Dockerfile.builder .
EC=$?
if [ $EC -ne 0 ]; then
    exit $EC
fi
docker login -u $DOCKER_USER -p $DOCKER_AUTH
EC=$?
if [ $EC -ne 0 ]; then
    exit $EC
fi
echo "*** Pushing builder image"
docker push $DOCKER_BUILDER_IMAGE 1>/dev/null
EC=$?
if [ $EC -ne 0 ]; then
    echo "*** $ROUTER_NAME pre-build finished"
    exit $EC
fi

echo "** Generic builder image build completed"
