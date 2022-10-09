#!/usr/bin/env node

const package = require('../package.json')
const { program } = require('commander')
const _ = require('underscore')
const glob = require('glob')

program
  .version(package.version)
  .option('-d, --debug', 'output extra debugging')
  .option('-a, --assets <assets>', 'REQUIRED: list of globbed filepath separated by comma, each static asset listed will have the new version number inserted before the file type prefix (file pattern supported)')
  .option('-g, --grepFiles <grepFiles>', 'list of globbed filepath separated by comma, specifies all files that matcher a certain pattern (i.e. /x/y/*.html will match all files in that directory with .html suffix)')
  .option('-s, --silence', 'if set to true, it will silence all output to STDOUT')
  .option('-n, --new-version <newVersion', 'defaults to generating an md5 hash of the file (recommended to leave as default as md5 hashing means that assets will not blow browser cache if they\'re unchanged)')
  .option('--kep-original-and-old-versions', 'set this to true if you want to disable auto-deletion of BOTH the original and old versions')
  .option('-k, --keep-original', 'set this to true if you want to delete just the ORIGINAL')
  .option('--keep-old-versions', 'set this to true if you want to delete just the OLD VERSIONS')
  .option('-r, --require-js', 'if set to the true then unsuffixed js assets (listed in the assets array) will be updated to the new version. Defaults to false')
  .option('-c, --cdn-path <cdn>', 'if set, will prepend the cdnPath to all assets that are specified with an absolute path (ie, a leading /)')
  .parse(process.argv)

const options = program.opts();
const assets = options.assets && options.assets.split(',')
const listAssets = (assets && _.isArray(assets)) ? assets : []
const globbedAssets = listAssets.reduce(function globAndAppendAssets(files, currentFile) {
  return files.concat(glob.sync(currentFile))
}, [])

const grepFiles = options.grepFiles && options.grepFiles.split(',')

if (!globbedAssets || !globbedAssets.length) {
  console.error('No asset file found')
  process.exit()
}

if (!assets || !assets.length) {
  console.error('--assets parameter is required, example: `--assets app.js,app.css`')
  process.exit()
}

const Version = require('../lib/main')
const version = new Version({
  assets: globbedAssets,
  grepFiles: grepFiles,
  silence: options.silence,
  newVersion: options.newVersion,
  keepOriginalAndOldVersions: options.keepOriginalAndOldVersions,
  keepOriginal: options.keepOriginal,
  keepOldVersions: options.keepOldVersions,
  requirejs: options.requirejs,
  cdn: options.cdn
})

version.run()