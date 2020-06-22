
/*
 * id = feedid (String)
 * url = feed url (String)
 * fit = mapfit shapes (true/false)
 * rules = OBA Filter rules to apply (array of strings)
 */
const src = (id, url, fit, rules) => ({ id, url, fit, rules })

const ULM_CONFIG = {
  'id': 'ulm',
  'src': [
    // src('SWU', 'https://github.com/UlmApi/swu-gtfs-community/releases/download/20190410-community-shapes/20190410-community-shapes.zip', false)
    src('DING', 'https://www.nvbw.de/fileadmin/nvbw/open-data/Fahrplandaten_mit_Liniennetz/ding.zip', false),
    src('FLIX', 'http://gtfs.gis-dev.flix.tech.s3-eu-west-1.amazonaws.com/gtfs_generic_eu.zip', false),
  ],
  'osm': 'ulm'
}

const VSH_CONFIG = {
  'id': 'vsh',
  'src': [
    //src('DING', 'https://www.nvbw.de/fileadmin/nvbw/open-data/Fahrplandaten_mit_Liniennetz/ding.zip', false),
    //src('FLIX', 'http://gtfs.gis-dev.flix.tech.s3-eu-west-1.amazonaws.com/gtfs_generic_eu.zip', false),
    //src('SPNV', 'https://www.nvbw.de/fileadmin/nvbw/open-data/Fahrplandaten_ohne_Liniennetz/bwspnv.zip', false),
    src('MFDZ', 'https://gtfs.mfdz.de/ulm.merged.gtfs.zip', false),
  ],
  'osm': 'ulm'
}

const HSL_CONFIG = {
  'id': 'hsl',
  'src': [
    src('HSL', 'http://dev.hsl.fi/gtfs/hsl.zip', false),
    src('HSLlautta', 'http://lautta.net/db/gtfs_pk/gtfs.zip', false)
  ],
  'osm': 'hsl',
  'dem': 'hsl'
}

const FINLAND_CONFIG = {
  'id': 'finland',
  'src': [
    src('HSL', 'http://dev.hsl.fi/gtfs/hsl.zip', false),
    src('MATKA', 'https://gtfsdatav2.blob.core.windows.net/gtfsdata-blob/matka.zip', 'gtfs_shape_mapfit/fit_gtfs_stops.bash', ['router-finland/gtfs-rules/matka.rule', 'router-finland/gtfs-rules/matka-id.rule']),
    src('tampere', 'http://www.tampere.fi/ekstrat/ptdata/tamperefeed_deprecated.zip', false),
    src('LINKKI', 'https://tvv.fra1.digitaloceanspaces.com/209.zip', 'gtfs_shape_mapfit/fit_gtfs_stops.bash'),
    src('lautta', 'http://lautta.net/db/gtfs/gtfs.zip', false),
    src('OULU', 'https://assets.oulunliikenne.fi/gtfs_google/google_transit.zip', false)
  ],
  'osm': 'finland'
}

const WALTTI_CONFIG = {

  'id': 'waltti',
  'src': [
    src('Hameenlinna', 'https://tvv.fra1.digitaloceanspaces.com/203.zip', 'gtfs_shape_mapfit/fit_gtfs_stops.bash', ['router-waltti/gtfs-rules/waltti.rule']),
    src('Kajaani', 'https://tvv.fra1.digitaloceanspaces.com/211.zip', 'gtfs_shape_mapfit/fit_gtfs_stops.bash', ['router-waltti/gtfs-rules/waltti.rule']),
    src('Kotka', 'https://tvv.fra1.digitaloceanspaces.com/217.zip', 'gtfs_shape_mapfit/fit_gtfs_stops.bash', ['router-waltti/gtfs-rules/waltti.rule']),
    src('Kouvola', 'https://tvv.fra1.digitaloceanspaces.com/219.zip', 'gtfs_shape_mapfit/fit_gtfs_stops.bash', ['router-waltti/gtfs-rules/waltti.rule']),
    src('Lappeenranta', 'https://tvv.fra1.digitaloceanspaces.com/225.zip', 'gtfs_shape_mapfit/fit_gtfs_stops.bash', ['router-waltti/gtfs-rules/waltti.rule']),
    src('Mikkeli', 'https://tvv.fra1.digitaloceanspaces.com/227.zip', 'gtfs_shape_mapfit/fit_gtfs_stops.bash', ['router-waltti/gtfs-rules/waltti.rule']),
    src('PohjoisPohjanmaanEly', 'https://tvv.fra1.digitaloceanspaces.com/113.zip', 'gtfs_shape_mapfit/fit_gtfs_stops.bash', ['router-waltti/gtfs-rules/waltti.rule']),
    src('IisalmiEly', 'https://tvv.fra1.digitaloceanspaces.com/181.zip', 'gtfs_shape_mapfit/fit_gtfs_stops.bash', ['router-waltti/gtfs-rules/waltti.rule']),
    src('MikkeliEly', 'https://tvv.fra1.digitaloceanspaces.com/184.zip', 'gtfs_shape_mapfit/fit_gtfs_stops.bash', ['router-waltti/gtfs-rules/waltti.rule']),
    src('Vaasa', 'https://tvv.fra1.digitaloceanspaces.com/249.zip', 'gtfs_shape_mapfit/fit_gtfs_stops.bash', ['router-waltti/gtfs-rules/waltti.rule']),
    src('Joensuu', 'https://tvv.fra1.digitaloceanspaces.com/207.zip', 'gtfs_shape_mapfit/fit_gtfs_stops.bash', ['router-waltti/gtfs-rules/waltti.rule']),
    src('JoensuuEly', 'https://tvv.fra1.digitaloceanspaces.com/183.zip', 'gtfs_shape_mapfit/fit_gtfs_stops.bash', ['router-waltti/gtfs-rules/waltti.rule']),
    src('FOLI', 'http://data.foli.fi/gtfs/gtfs.zip', false, ['router-waltti/gtfs-rules/waltti.rule']),
    src('Lahti', 'http://www.lsl.fi/assets/uploads/google_transit.zip', 'gtfs_shape_mapfit/fit_gtfs_stops.bash', ['router-waltti/gtfs-rules/waltti.rule']),
    src('Kuopio', 'http://karttapalvelu.kuopio.fi/google_transit/google_transit.zip', false, ['router-waltti/gtfs-rules/waltti.rule']),
    src('OULU', 'https://assets.oulunliikenne.fi/gtfs_google/google_transit.zip', false),
    src('LINKKI', 'https://tvv.fra1.digitaloceanspaces.com/209.zip', 'gtfs_shape_mapfit/fit_gtfs_stops.bash'),
    src('tampere', 'http://www.tampere.fi/ekstrat/ptdata/tamperefeed_deprecated.zip', false),
    src('Rovaniemi', 'https://tvv.fra1.digitaloceanspaces.com/237.zip', 'gtfs_shape_mapfit/fit_gtfs_stops.bash', ['router-waltti/gtfs-rules/waltti.rule'])
  ],
  'osm': 'finland',
  'dem': 'waltti'
}

let ALL_CONFIGS

const setCurrentConfig = (name) => {
  ALL_CONFIGS = [WALTTI_CONFIG, ULM_CONFIG, VSH_CONFIG, HSL_CONFIG, FINLAND_CONFIG].reduce((acc, nxt) => {
    if ((name && name.split(',').indexOf(nxt.id) !== -1) ||
      name === undefined) {
      acc.push(nxt)
    }
    return acc
  }, [])
}

// Allow limiting active configs with env variable
if (process.env.ROUTERS) {
  setCurrentConfig(process.env.ROUTERS.replace(/ /g, ''))
} else {
  setCurrentConfig()
}

// EXTRA_SRC format should be {"FOLI": {"url": "http://data.foli.fi/gtfs/gtfs.zip",  "fit": false, "rules": ["router-waltti/gtfs-rules/waltti.rule"], "routers": ["hsl", "finland"]}}
// but you can only define, for example, new url and the other key value pairs will remain the same as they are defined in this file. "routers" is always a mandatory field.
// It is also possible to add completely new src by defining object with unused id or to remove a src by defining "remove": true
const extraSrc = process.env.EXTRA_SRC !== undefined ? JSON.parse(process.env.EXTRA_SRC) : {}

let usedSrc = []
// add config to every source and override config values if they are defined in extraSrc
for (let i = 0; i < ALL_CONFIGS.length; i++) {
  const cfg = ALL_CONFIGS[i]
  const cfgSrc = cfg.src
  for (let j = cfgSrc.length - 1; j >= 0; j--) {
    const src = cfgSrc[j]
    const id = src.id
    if (extraSrc[id] && extraSrc[id].routers !== undefined && extraSrc[id].routers.includes(cfg.id)) {
      usedSrc.push(id)
      if (extraSrc[id].remove) {
        cfgSrc.splice(j, 1)
        continue
      }
      cfgSrc[j] = { ...src, ...extraSrc[src.id] }
    }
    cfgSrc[j].config = cfg
  }
}

// Go through extraSrc keys to find keys that don't already exist in src and add those as new src
Object.keys(extraSrc).forEach((id) => {
  if (!usedSrc.includes(id)) {
    const routers = extraSrc[id].routers
    for (let i = 0; i < ALL_CONFIGS.length; i++) {
      const cfg = ALL_CONFIGS[i]
      if (routers === undefined || routers.includes(cfg.id)) {
        cfg.src.push({ ...extraSrc[id], id })
      }
    }
  }
})

// create id->src-entry map
const configMap = ALL_CONFIGS.map(cfg => cfg.src)
  .reduce((acc, val) => acc.concat(val), [])
  .reduce((acc, val) => {
    if (acc[val.id] === undefined) {
      acc[val.id] = val
    }
    return acc
  }, {})

const osm = [
  { id: 'finland', url: 'https://karttapalvelu.storage.hsldev.com/finland.osm/finland.osm.pbf' },
  { id: 'hsl', url: 'https://karttapalvelu.storage.hsldev.com/hsl.osm/hsl.osm.pbf' },
  { id: 'ulm', url: 'https://rgw1.netways.de/swift/v1/AUTH_66c3085bb69a42ed8991c90e5c1f453e/digitransit/osm/tuebingen-schwaben-latest.osm.pbf' },
]

const dem = [
  { id: 'waltti', url: 'https://elevdata.blob.core.windows.net/elevation/waltti/waltti-10m-elevation-model_20190927.tif' },
  { id: 'hsl', url: 'https://elevdata.blob.core.windows.net/elevation/hsl/hsl-10m-elevation-model_20190920.tif' }
]

const constants = {
  BUFFER_SIZE: 1024 * 1024 * 32
}

module.exports = {
  ALL_CONFIGS: () => ALL_CONFIGS,
  configMap,
  osm,
  osmMap: osm.reduce((acc, val) => { acc[val.id] = val; return acc }, {}),
  dem,
  demMap: dem.reduce((acc, val) => { acc[val.id] = val; return acc }, {}),
  dataToolImage: `hsldevcom/otp-data-tools:${process.env.TOOLS_TAG || 'latest'}`,
  dataDir: process.env.DATA || `${process.cwd()}/data`,
  hostDataDir: process.env.HOST_DATA || `${process.cwd()}/data`,
  setCurrentConfig: setCurrentConfig,
  constants
}
