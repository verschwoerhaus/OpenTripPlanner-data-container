#!/bin/bash

# Set these environment variables
#ROUTER_NAME // hsl/waltti/finland
#DOCKER_USER // dockerhub credentials
#DOCKER_AUTH
#DOCKER_TAG or TRAVIS_COMMIT
set +e

echo "*** Building for" $ROUTER_NAME

ORG=${ORG:-hsldevcom}
CONTAINER=opentripplanner-data-container
DOCKER_TAG=${DOCKER_TAG:-$TRAVIS_COMMIT}
DOCKER_IMAGE=$ORG/$CONTAINER-$ROUTER_NAME
DOCKER_BUILDER_IMAGE=$DOCKER_IMAGE:builder
DOCKER_TAGGED_IMAGE=$DOCKER_IMAGE:$DOCKER_TAG


# Build data with builder
echo "***Launching the builder"
rm -rf target build
mkdir target
docker run --rm --entrypoint tar $DOCKER_BUILDER_IMAGE -c /opt/$CONTAINER/webroot|tar x -C target
if [ $? -ne 0 ]; then
    exit 0
fi
echo "*** Builder launched"

#prebuild graph
echo "*** Prebuilding the graph"
mkdir -p build/$ROUTER_NAME
unzip -j target/opt/$CONTAINER/webroot/router-$ROUTER_NAME.zip -d build/$ROUTER_NAME/
if [ $? -ne 0 ]; then
    exit 0
fi
VERSION=`docker run --rm --entrypoint /bin/bash hsldevcom/opentripplanner:prod  -c "java -jar otp-shaded.jar --version"|grep commit|cut -d' ' -f2`
docker run -v `pwd`/build:/opt/opentripplanner/graphs --rm --entrypoint /bin/bash hsldevcom/opentripplanner:prod  -c "java -Xmx6g -jar otp-shaded.jar --build graphs/$ROUTER_NAME"
if [ $? -ne 0 ]; then
    exit 0
fi
cd build/
zip graph-$ROUTER_NAME-$VERSION.zip $ROUTER_NAME/router-config.json $ROUTER_NAME/Graph.obj
if [ $? -ne 0 ]; then
    exit 0
fi
cd ..

#build docker image
echo "*** Building the docker image"
docker build --tag=$DOCKER_TAGGED_IMAGE -f Dockerfile .
if [ $? -ne 0 ]; then
    exit 0
fi
docker login -u $DOCKER_USER -p $DOCKER_AUTH
if [ $? -ne 0 ]; then
    exit 0
fi
docker push $DOCKER_TAGGED_IMAGE
if [ $? -ne 0 ]; then
    exit 0
fi
echo "*** $ROUTER_NAME image built and pushed"
