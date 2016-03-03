#/bin/bash
set -e
set -x

ROOT=.
mkdir -p $ROOT
cd $ROOT

apt-get update

# Misc stuff needed by build-routes script
echo "Install misc stuff..."
apt-get -y install build-essential python-dev protobuf-compiler libprotobuf-dev \
    make swig g++ python-dev libreadosm-dev \
    libboost-graph-dev libproj-dev libgoogle-perftools-dev \
    osmctools unzip zip python-pyproj wget \
    python-argh

# Install Pip and some dependencies
echo "Install pip and some dependencies..."
wget https://bootstrap.pypa.io/get-pip.py; python get-pip.py;
pip install imposm.parser
pip install argh

# One busaway transformer
echo "Getting One-busaway-gtfs-transformer..."
mkdir -p $ROOT/one-busaway-gtfs-transformer
wget -O $ROOT/one-busaway-gtfs-transformer/onebusaway-gtfs-transformer-cli.jar "http://nexus.onebusaway.org/service/local/artifact/maven/content?r=public&g=org.onebusaway&a=onebusaway-gtfs-transformer-cli&v=1.3.4-SNAPSHOT"

echo "Getting pyproj and building it..."
git clone https://github.com/jswhit/pyproj.git
cd pyproj
git checkout ec9151e8c6909f7fac72bb2eab927ff18fa4cf1d # TODO: Fix when it deploys again
python setup.py build
python setup.py install
cd ..

echo "Getting gtfs_shape_mapfit and building it..."
git clone --recursive -b fastmapmatch https://github.com/HSLdevcom/gtfs_shape_mapfit.git
cd gtfs_shape_mapfit
make -C pymapmatch

echo "Done installing dependencies."
