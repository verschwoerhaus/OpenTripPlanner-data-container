# OpenTripPlanner-data-containers
[![Build](https://api.travis-ci.org/HSLdevcom/OpenTripPlanner-dta-container.svg?branch=master)](https://api.travis-ci.org/HSLdevcom/OpenTripPlanner-dta-container.svg?branch=master)

## This dockerization project:

1. Fetches HSL, Liikennevirasto, and waltti cities GTFS data
2. Alters, and transforms that data
3. Forms OpenTripPlanner router zip files from the data
4. Creates and pushes 3 docker images (hsl/waltti/finland)

Each docker image runs a http server listening to port 8080. From the http server, you can get:
- http://localhost:8080/routers.txt

That file defines the served router zip bundle:
- hsl: http://localhost:8080/router-hsl.zip
- waltti: http://localhost:8080/router-waltti.zip
- finland: http://localhost:8080/router-finland.zip

Each of the bundles contain also OpenStreetMap graph file, so you should be able to load them into OpenTripPlanner
