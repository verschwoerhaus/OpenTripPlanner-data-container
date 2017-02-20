#!/bin/bash
set -e
set -x
set -o pipefail

# Default value is for tmalloc threshold is 1073741824
# This is too small, and causes GTFS shape mapfit to
# log info, which then breaks the build
# Therefore, we increase this value
export TCMALLOC_LARGE_ALLOC_REPORT_THRESHOLD=2147483648

# Base locations
ROOT=/opt/opentripplanner-data-container
ROUTER_FINLAND=$ROOT/router-finland
ROUTER_HSL=$ROOT/router-hsl
ROUTER_WALTTI=$ROOT/router-waltti

# Tools
FIT_GTFS=$ROOT/gtfs_shape_mapfit/fit_gtfs.bash
OBA_GTFS=$ROOT/one-busaway-gtfs-transformer/onebusaway-gtfs-transformer-cli.jar

function retrieveOSMFinland() {
  echo "Retrieving Finland OSM data..."
  cd $ROUTER_FINLAND
  curl -sS "http://dev.hsl.fi/osm.finland/finland.osm.pbf" -o finland-latest.osm.pbf
}

function retrieveOSMHSL() {
  echo "Retrieving Helsinki OSM data..."
  cd $ROUTER_HSL
  curl -sS "http://dev.hsl.fi/osm.hsl/hsl.osm.pbf" -o helsinki_finland.osm.pbf
}

function retrieveTampere() {
  echo "Retrieving Tampere data..."
  cd $ROUTER_FINLAND
  curl -sS "http://data.itsfactory.fi/journeys/files/gtfs/latest/gtfs_tampere.zip" -o tampere.zip
  $FIT_GTFS finland-latest.osm.pbf +init=epsg:3067 tampere.zip tampere_fitted.zip 2>&1 | tee tampere.fit.log.txt
  mv tampere_fitted.zip tampere.zip
  add_feed_id tampere.zip JOLI
}

function retrieveJyvaskyla() {
  echo "Retrieving Jyväskylä data..."
  cd $ROUTER_FINLAND
  curl -sS "http://data.jyvaskyla.fi/tiedostot/linkkidata.zip" -o jyvaskyla.zip
  add_feed_id jyvaskyla.zip LINKKI

  cp jyvaskyla.zip $ROUTER_WALTTI
}

function retrieveOulu() {
  echo "Retrieving Oulu data..."
  cd $ROUTER_FINLAND
  curl -sS "http://www.transitdata.fi/oulu/google_transit.zip" -o oulu.zip
  add_feed_id oulu.zip OULU

  cp oulu.zip $ROUTER_WALTTI
}

function retrieveLauttaNet() {
  echo "Retrieving Lautta.net data..."
  cd $ROUTER_FINLAND
  curl -sS "http://lautta.net/db/gtfs/gtfs.zip" -o lautta.zip
  add_feed_id lautta.zip LAUTTA
}

function retrieveHsl() {
  echo "Retrieving HSL data..."
  cd $ROUTER_HSL
  curl -sS "http://dev.hsl.fi/gtfs/hsl.zip" -o hsl.zip

  unzip -o hsl.zip stop_times.txt
  # TODO: Check that the line is in expected format
  # Needed in order to get rid of "shape_distance_travelled"
  # this field is not currently available in shapes.txt. OpenTripPlanner needs it to be.
  cut --complement -f 9 -d, stop_times.txt > stop_times.new
  mv stop_times.new stop_times.txt
  zip -f hsl.zip stop_times.txt
  rm stop_times.txt

  # Note! we use finland OSM graph
  echo "Note! Next mapfit requires lot of memory. If it fails mysteriously, try adding more."
  $FIT_GTFS $ROUTER_FINLAND/finland-latest.osm.pbf +init=epsg:3067 hsl.zip hsl_fitted.zip 2>&1 | tee hsl.fit.log.txt
  echo "Mapfit ready."
  mv hsl_fitted.zip hsl.zip
  add_feed_id hsl.zip HSL
  # HSL data is also needed in national graph
  cp hsl.zip $ROUTER_FINLAND
}

function retrieveWaltti() {
  echo "Retrieving Waltti data..."
  cd $ROUTER_WALTTI
  curl -sS "http://dev.hsl.fi/gtfs.waltti/hameenlinna.zip" -o hameenlinna.zip
  curl -sS "http://dev.hsl.fi/gtfs.waltti/joensuu.zip" -o joensuu.zip
  curl -sS "http://dev.hsl.fi/gtfs.waltti/kajaani.zip" -o kajaani.zip
  curl -sS "http://dev.hsl.fi/gtfs.waltti/keski-suomen_ely.zip" -o keski-suomen_ely.zip
  curl -sS "http://dev.hsl.fi/gtfs.waltti/kotka.zip" -o kotka.zip
  curl -sS "http://dev.hsl.fi/gtfs.waltti/kuopio.zip" -o kuopio.zip
  curl -sS "http://dev.hsl.fi/gtfs.waltti/kvl.zip" -o kvl.zip
  curl -sS "http://dev.hsl.fi/gtfs.waltti/lahti.zip" -o lahti.zip
  curl -sS "http://dev.hsl.fi/gtfs.waltti/lappeenranta.zip" -o lappeenranta.zip
  curl -sS "http://dev.hsl.fi/gtfs.waltti/mikkeli.zip" -o mikkeli.zip
  curl -sS "http://dev.hsl.fi/gtfs.waltti/pohjois-pohjanmaan_ely.zip" -o pohjois-pohjanmaan_ely.zip
  curl -sS "http://dev.hsl.fi/gtfs.waltti/posely_iisalmi.zip" -o posely_iisalmi.zip
  curl -sS "http://dev.hsl.fi/gtfs.waltti/posely_joensuu.zip" -o posely_joensuu.zip
  curl -sS "http://dev.hsl.fi/gtfs.waltti/posely_kuopio.zip" -o posely_kuopio.zip
  curl -sS "http://dev.hsl.fi/gtfs.waltti/posely_mikkeli.zip" -o posely_mikkeli.zip
  curl -sS "http://dev.hsl.fi/gtfs.waltti/vaasa.zip" -o vaasa.zip

  # Note! we use finland OSM graph
  cp $ROUTER_FINLAND/finland-latest.osm.pbf .

  add_feed_id hameenlinna.zip Hameenlinna
  add_feed_id joensuu.zip Joensuu
  add_feed_id kajaani.zip Kajaani
  add_feed_id keski-suomen_ely.zip KeskiSuomenEly
  add_feed_id kotka.zip Kotka
  add_feed_id kuopio.zip Kuopio
  add_feed_id kvl.zip Kouvola
  add_feed_id lahti.zip Lahti
  add_feed_id lappeenranta.zip Lappeenranta
  add_feed_id mikkeli.zip Mikkeli
  add_feed_id pohjois-pohjanmaan_ely.zip PohjoisPohjanmaanEly
  add_feed_id posely_iisalmi.zip IisalmiEly
  add_feed_id posely_joensuu.zip JoensuuEly
  add_feed_id posely_kuopio.zip KuopioEly
  add_feed_id posely_mikkeli.zip MikkeliEly
  add_feed_id vaasa.zip Vaasa
}

function retrieveTurku() {
  echo "Retrieving Turku/Foli data..."
  cd $ROUTER_WALTTI
  curl -sS "http://dev.hsl.fi/gtfs.foli/foli.zip" -o foli.zip

  add_feed_id foli.zip FOLI
}


function retrieveKoontikanta() {
  echo "Retrieving Koontikanta data..."
  cd $ROUTER_FINLAND

  curl -sS "http://dev.hsl.fi/gtfs.matka/matka.zip" -o matka.zip

  rm -rf koontikanta
  mkdir -p koontikanta

  transformKoontikantaPart "java -server -Xmx8G -jar $OBA_GTFS --transform=$ROUTER_FINLAND/gtfs-rules/matka.rule matka.zip koontikanta/matka.tmp"
  # rename id's as a separate pass to avoid nondeterminism
  transformKoontikantaPart "java -server -Xmx8G -jar $OBA_GTFS --transform=$ROUTER_FINLAND/gtfs-rules/matka-id.rule koontikanta/matka.tmp koontikanta/matka"
  sed -i -e '1 a''MATKA,matka.fi,http://www.matka.fi/,Europe/Helsinki,' koontikanta/matka/agency.txt

  cd koontikanta/matka
  zip ../../matka.filtered.zip *
  cd ../..

  mv matka.filtered.zip matka.zip

  add_feed_id matka.zip MATKA
}

# One Bus away transform does not end terminate with a correct error code. Check that here and fail if configuration is set
function transformKoontikantaPart() {
  if (! $1 2>&1) | grep "Exception"
  then
    echo "Failed to transform koontikanta part"
    exit 1
  fi
}

#add (or modify) feed_info.txt that contains the feed_id
function add_feed_id() {
  set +o pipefail
  filename=$1
  id=$2

  contains_fileinfo=`unzip -l $filename|grep feed_info.txt|wc -l`

  if [ "$contains_fileinfo" -ne "1" ]; then
    echo "creating new feed-info"
    #no feed info available in zip, write whole file
    cat <<EOT > feed_info.txt
feed_publisher_name,feed_publisher_url,feed_lang,feed_id
$id-fake-name,$id-fake-url,$id-fake-lang,$id
EOT
  else
    unzip -o $filename feed_info.txt
    #see if if feed_id is already there
    count=`grep feed_id feed_info.txt|wc -l`
    if [ "$count" -ne "1" ]; then
      echo "adding feed_id column"
      #no feed_id in feed_info.txt, append
      awk -vc="feed_id" -vd="$id" 'NR==1{$0=c","$0}NR!=1{$0=d","$0}1' feed_info.txt > feed_info_new.txt
    else
      echo "changing existing id"
      #existing feed_id, replace it
      original=`awk -F ',' 'NR==1 {for (i=1; i<=NF; i++) {ix[$i] = iNR>1 {printf "%s\n", $ix["feed_id"]}' c1=feed_id feed_info.txt`
      echo "chaning existing id $original to $id"
      cat feed_info.txt | sed s/$original/$id/g > feed_info_new.txt
    fi
    mv feed_info_new.txt feed_info.txt
  fi

  # add feed_info to zip
  zip $filename feed_info.txt
  set -o pipefail
}

# Here we go
retrieveHsl

retrieveTampere
retrieveJyvaskyla
retrieveOulu
retrieveLauttaNet
retrieveKoontikanta

retrieveWaltti
retrieveTurku

# build zip packages
mkdir ${WEBROOT}
zip -D ${WEBROOT}/router-hsl.zip $ROOT/router-hsl/*
zip -D ${WEBROOT}/router-finland.zip $ROOT/router-finland/*
zip -D ${WEBROOT}/router-waltti.zip $ROOT/router-waltti/*
cp ${WORK}/routers.txt ${WEBROOT}
