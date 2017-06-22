
/*
 * id = feedid (String)
 * url = feed url (String)
 * fit = mapfit shapes (true/false)
 * rules = OBA Filter rules to apply (array of strings)
 */
src = (id,url,fit,rules) => ({id,url,fit,rules});

const HSL_CONFIG = {
  "id":"hsl",
  "src": [
    src("HSL","http://dev.hsl.fi/gtfs/hsl.zip", true)
  ],
  "osm":"hsl",
}

const FINLAND_CONFIG = {
  "id":"finland",
  "src": [
    src("HSL","http://dev.hsl.fi/gtfs/hsl.zip", true),
    src("MATKA","http://dev.hsl.fi/gtfs.matka/matka.zip", true),
    src("tampere","http://data.itsfactory.fi/journeys/files/gtfs/latest/gtfs_tampere.zip", true),
    src("jyvaskyla","http://data.jyvaskyla.fi/tiedostot/linkkidata.zip", false),
    src("lautta","http://lautta.net/db/gtfs/gtfs.zip", false),
    src("oulu",'http://www.transitdata.fi/oulu/google_transit.zip', false),
  ],
  "osm":"finland",
}

const WALTTI_CONFIG = {

  "id":"waltti",
  "src": [
    src("Hameenlinna","http://dev.hsl.fi/gtfs.waltti/hameenlinna.zip", false),
    src("Kajaani","http://dev.hsl.fi/gtfs.waltti/kajaani.zip", false),
    src("KeskiSuomenEly",'http://dev.hsl.fi/gtfs.waltti/keski-suomen_ely.zip', false),
    src("Kotka",'http://dev.hsl.fi/gtfs.waltti/kotka.zip', false),
    src("Kouvola",'http://dev.hsl.fi/gtfs.waltti/kvl.zip',false),
    src("Lappeenranta",'http://dev.hsl.fi/gtfs.waltti/lappeenranta.zip',false),
    src("Mikkeli",'http://dev.hsl.fi/gtfs.waltti/mikkeli.zip',false),
    src("PohjoisPohjanmaanEly",'http://dev.hsl.fi/gtfs.waltti/pohjois-pohjanmaan_ely.zip',false),
    src("IisalmiEly",'http://dev.hsl.fi/gtfs.waltti/posely_iisalmi.zip',false),
    src("MikkeliEly",'http://dev.hsl.fi/gtfs.waltti/posely_mikkeli.zip',false),
    src("Vaasa",'http://dev.hsl.fi/gtfs.waltti/vaasa.zip',false),
    src("Joensuu", 'http://dev.hsl.fi/gtfs.waltti/joensuu.zip',false, ['router-waltti/gtfs-rules/waltti.rule']),
    src("JoensuuEly", 'http://dev.hsl.fi/gtfs.waltti/posely_joensuu.zip',false),
    src("FOLI", 'http://dev.hsl.fi/gtfs.foli/foli.zip', false),
    src("Lahti", 'http://dev.hsl.fi/gtfs.lahti/lahti.zip', false),
    src("Kuopio", 'http://dev.hsl.fi/gtfs.kuopio/kuopio.zip', false)
  ],
  "osm":"finland",
}

//Allow limiting active configs with env variable
const ALL_CONFIGS=[WALTTI_CONFIG, HSL_CONFIG, FINLAND_CONFIG].reduce((acc,nxt)=>{
  if(process.env.ROUTER) {
    if(process.env.ROUTER.split(',').indexOf(nxt.id)!=-1) {
      acc.push(nxt);
    }
  }
  return acc;
},[]);

//add config to every source
ALL_CONFIGS.forEach(cfg => cfg.src.forEach(src=>src.config=cfg));

// create id->src-entry map
const configMap=ALL_CONFIGS.map(cfg => cfg.src)
  .reduce((acc, val) => acc.concat(val), [])
  .reduce((acc, val) => {
    if(acc[val.id]===undefined) {
      acc[val.id] = val
    }
    return acc;
  },{})

const osm = [
  {id:"finland",url: "http://dev.hsl.fi/osm.finland/finland.osm.pbf"},
  {id:"hsl", url: "http://dev.hsl.fi/osm.hsl/hsl.osm.pbf"}
];


module.exports={
  ALL_CONFIGS,
  configMap,
  osm,
  osmUrls:osm.map(e=>e.url)

}
