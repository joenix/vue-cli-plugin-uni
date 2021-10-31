// Path
const path = require("path");

// Fs
const fs = require("fs");

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

// Conf
const conf = getConf();

// Argv
const argvs = getArgv();

/**
 * Path Resolve
 * @param dir {string}
 * ======== ======== ========
 */
function resolve(dir) {
  return path.join(__dirname, dir);
}

/**
 * Foreach
 * @param source {json}
 * @param callback {function}
 * ======== ======== ========
 */
function foreach(source = {}, callback = () => {}) {
  Object.keys(source).map(item => callback(source[item], item));
}

/**
 * Check
 * @param value {any}
 * @param mode {any}
 * ======== ======== ========
 */
function check(value, mode = Object) {
  return value && value.constructor === mode;
}

/**
 * Deep
 * @param source {json}
 * @param callback {function}
 * ======== ======== ========
 */
function deep(source, callback) {
  // Check
  if (check(source)) {
    // Recursion
    foreach(source, value => deep(value, callback));
    // Factory
    source = callback(source);
  }
}

/**
 * Get Configure
 * ======== ======== ========
 */
function getConf(path = `${root}/scaff.config2.js`) {
  // If File
  return fs.existsSync(path) ? require(path) : {};
}

/**
 * Get Argv in Process
 * @param name {string}
 * ======== ======== ========
 */
function getArgv(name, cache = {}) {
  // Argv -- Cant Run in Plugign
  // let [node, path, ...argv] = process.argv;

  // Get Argv From Original Command
  let argv = JSON.parse(process.env.npm_config_argv).original.filter(cmd =>
    /^--/.test(cmd)
  );

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
  deep(conf, json => {
    for (let i in json) {
      if (json[i].constructor !== Object) {
        json[i] = `'${json[i]}'`;
      }
    }
  });

  // Return
  return conf;
}

/**
 * To Stringify
 * @param conf {json}
 * ======== ======== ========
 */
function getProp(fn) {
  return `"${fn(process.env)}"`;
}

// Argvs injection must run front at Vue
if (argvs.env) {
  process.env.NODE_ENV = argvs.env;
}

// Action
module.exports = (api, options, rootOptions) => {
  // Merge User Config 2 Project Options
  Object.assign(api.service.projectOptions, conf);

  // Use chainWebpack
  api.chainWebpack(webpackConfig => {
    // Configure
    const injection = require(`${root}/injection.json`);

    // Environ
    if (argvs.env === undefined) {
      argvs.env = getProp(e => e.npm_config_env || e.NODE_ENV || "development");
    }

    // Platform
    if (argvs.plat === undefined) {
      argvs.plat = getProp(e => e.VUE_APP_PLATFORM);
    }

    // Injection
    webpackConfig.plugin("define").tap(
      // Definitions
      definitions => (
        // Merge to Env
        Object.assign(definitions[0]["process.env"], {
          ...argvs,
          ...toStringify(injection)
        }),
        // Return
        definitions
      )
    );
  });
};
