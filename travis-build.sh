#!/bin/bash
set +e

# This is run at ci, created an image that contains all the tools needed in
# databuild
#
# Set these environment variables
#DOCKER_USER // dockerhub credentials
#DOCKER_AUTH

ORG=${ORG:-hsldevcom}
BUILDER=otp-data-builder
DOCKER_TAG=${TRAVIS_BUILD_ID:-latest}
DOCKER_IMAGE=$ORG/$BUILDER:${DOCKER_TAG}
DOCKER_IMAGE_LATEST=$ORG/$BUILDER:latest

echo Building $BUILDER: $DOCKER_IMAGE

docker build  --tag=$DOCKER_IMAGE -f Dockerfile .

if [ "${TRAVIS_BRANCH}" == "master" ]; then
  docker login -u $DOCKER_USER -p $DOCKER_AUTH
  docker push $DOCKER_IMAGE
  docker tag $DOCKER_IMAGE $DOCKER_IMAGE_LATEST
  docker push $DOCKER_IMAGE_LATEST
fi

echo Build completed

ORG=${ORG:-hsldevcom}
TOOLS=otp-data-tools
DOCKER_TAG=${TRAVIS_BUILD_ID:-latest}
DOCKER_IMAGE=$ORG/$TOOLS:${DOCKER_TAG}
DOCKER_IMAGE_LATEST=$ORG/$TOOLS:latest

cd $TOOLS

echo Building $TOOLS: $DOCKER_IMAGE

docker build  --tag=$DOCKER_IMAGE -f Dockerfile .

if [ "${TRAVIS_BRANCH}" == "master" ]; then
  docker login -u $DOCKER_USER -p $DOCKER_AUTH
  docker push $DOCKER_IMAGE
  docker tag $DOCKER_IMAGE $DOCKER_IMAGE_LATEST
  docker push $DOCKER_IMAGE_LATEST
fi
echo Build completed
