// Path
const path = require("path");

// Utils
const {
  log,
  info,
  done,
  warn,
  error,
  clearConsole,
  exit
} = require("@vue/cli-shared-utils");

// Root
const root = process.cwd();

/**
 * Path Resolve
 * @param dir {string}
 * ======== ======== ========
 */
function resolve(dir) {
  return path.join(__dirname, dir);
}

/**
 * Get Argv in Process
 * @param name {string}
 * ======== ======== ========
 */
function getArgv(name, cache = {}) {
  // Argv
  const [node, path, ...argv] = process.argv;

  // Mapping
  argv.map(
    item => (
      (item = item.replace(/^--/, "")),
      item.replace(
        /^([\w\.\-\:\/]+)\=?(.*)/g,
        ($0, $1, $2) => ((cache[$1] = `"${$2 || true}"`), $0)
      )
    )
  );

  // Has Name in Argvs
  return name ? cache[name] : cache;
}

/**
 * To Stringify
 * @param conf {json}
 * ======== ======== ========
 */
function toStringify(conf = {}) {
  // Machining
  return Object.keys(conf).map(key => (conf[key] = `'${conf[key]}'`)), conf;
}

// Action
module.exports = (api, options, rootOptions) => {
  // Use chainWebpack
  api.chainWebpack(webpackConfig => {
    // Configure
    const configure = require(`${root}/configure.json`);
    // Argvs
    const argvs = getArgv();

    // Env Default
    argvs.env = argvs.env || `"dev"`;
    // Plat Default
    argvs.plat = argvs.plat || `"${process.env.VUE_APP_PLATFORM}"`;

    // Injection
    webpackConfig.plugin("define").tap(
      // Definitions
      definitions => (
        // Merge to Env
        Object.assign(definitions[0]["process.env"], {
          ...argvs,
          ...toStringify(configure)
        }),
        // Return
        definitions
      )
    );
  });
};
