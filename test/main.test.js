var test = require('tap').test,
  _ = require('underscore'),
  async = require('async'),
  path = require('path'),
  fs = require('fs'),
  // my libs
  Main = require('./../lib/main');

// my test vars
var cssFile = "all-min.css",
  jsNewie = "app.newie.js",
  jsOldie = "app.oldie.js",
  fixturesDir = path.join('test-utils/fixtures/'),
  // fixturesDir = path.join('**/fixtures/'),
  cssDir = fixturesDir + 'css/',
  jsDir = fixturesDir + 'js/',
  opts = {
    cb: function (err, results) { },
    assets: [cssDir + cssFile, jsDir + jsNewie, jsDir + jsOldie],
    grepFiles: [fixturesDir + "index.html"],
    newVersion: 1111111111
  },
  globOpts = _.extend({}, opts, { grepFiles: [fixturesDir + "*.html"] }),
  cdnOpts = _.extend({}, opts, { cdnPath: 'https://cdn.example.com' });

var cleaner = require('./../test-utils/test-cleanup');

test('Main Contructor Fn: shd assign correct properties', function (t) {

  var mainInstance = new Main(opts),
    mainGlobInstance = new Main(globOpts),
    mainCdnInstance = new Main(cdnOpts),
    mainInstanceDefaultsChecking = new Main(_.extend({}, opts, { cb: null, newVersion: null, grepFiles: null }));

  // shd assign correctly
  t.equal(mainInstance.cb, opts.cb);
  t.same(mainInstance.assets, opts.assets);
  t.same(mainInstance.grepFiles, opts.grepFiles);

  // shd assign glob options correctly
  var htmlFixtures = [fixturesDir + 'index.html', fixturesDir + 'index2.html'];
  t.equal(mainGlobInstance.cb, opts.cb);
  t.same(mainGlobInstance.assets, opts.assets);
  t.same(mainGlobInstance.grepFiles, htmlFixtures);

  // shd assign cdn option correctly
  t.equal(mainInstance.cdnPath, undefined);
  t.equal(mainCdnInstance.cdnPath, cdnOpts.cdnPath);

  // defaults
  t.equal(mainInstanceDefaultsChecking.requireJs, undefined);
  t.ok(_.isArray(mainInstanceDefaultsChecking.grepFiles), "this.grepFiles defaults to an empty array");
  t.equal(mainInstanceDefaultsChecking.cb, undefined);

  // validation
  t.throws(function () { new Main("silenceErrorJustForTests"); });
  t.throws(function () { new Main(_.extend({}, opts, { assets: "shd be an array", silenceError: true })); }, "opts.assets is the only required param");

  t.end();
});

test('Main.checkPaths() ', function (t) {

  var mainInstance = new Main(opts),
    cb = function (err, results) {
      console.log('success checkPath: ', err)
      t.equal(err, null, "if all files exist then err shd be null");
    }

  t.plan(1);

  // fire away!
  mainInstance.checkPaths(cb);
});


test('Main.grepFilesReplace()', function (t) {

  var mainInstance = new Main(opts),
    mainInstanceFails = new Main(_.extend({}, opts, { grepFiles: [] })),
    // results is undefined from createWriteStream callback
    cb = function (err, results) {
      t.equal(mainInstance.greppers.length, opts.grepFiles.length, "grepFiles instances shd be created");
      t.equal(err, null, "if all files exist then err shd be null");
    },
    cbFail = function (err, results) {
      t.equal(err, null, "no files to grep");
    };

  t.plan(3);

  // fire away!
  mainInstance.initReplacers(function () {
    mainInstance.grepFilesReplace(cb);
    mainInstanceFails.grepFilesReplace(cbFail);
  });
});

test('Main.renameAssetsInFilesystem(): shd write file', function (t) {

  var mainInstance = new Main(opts),
    versionedAssets = opts.assets.map(function (path) {
      return path.replace(/(\.css|\.js)/, '.' + opts.newVersion + "$1");
    }),
    testAssert = function (result) {

      // if result is true then every file exists
      t.ok(result, "every file exists")

      // delete newly generated files
      async.map(versionedAssets, fs.unlink, function () {
        t.end();
      });
    },
    testRun = function () {
      // check every file has been created
      async.every(versionedAssets, fs.exists, testAssert);
    };

  // fire away!
  mainInstance.initReplacers(function () {
    mainInstance.renameAssetsInFilesystem(testRun);
  });
});

test('Main.run(): md5 versioning', function (t) {

  var mainMd5 = new Main(_.extend({}, opts, { newVersion: null, keepOriginal: true })),
    runTestAssertions = function (err, results) {

      if (err) {
        t.fail(err);
        return t.end();
      }

      var cssDirContents = fs.readdirSync(cssDir),
        jsDirContents = fs.readdirSync(jsDir),
        regex = /(.*)(\.js|\.css)/,
        cssVersioned = cssFile.replace(regex, "$1." + mainMd5.replacers[0].newVersion + "$2"),
        jsNewieVersioned = jsNewie.replace(regex, "$1." + mainMd5.replacers[1].newVersion + "$2"),
        jsOldieVersioned = jsOldie.replace(regex, "$1." + mainMd5.replacers[2].newVersion + "$2");

      t.same(err, null, "no errors on filepath");
      t.ok(cssDirContents.indexOf(cssVersioned) !== -1, "css file md5 versioned copy generated");
      t.ok(jsDirContents.indexOf(jsNewieVersioned) !== -1, "jsNewie md5 versioned copy generated");
      t.ok(jsDirContents.indexOf(jsOldieVersioned) !== -1, "jsOldie md5 versioned copy generated");


      //////////////////////////////////////////////////////////////////////
      // run again with same file contents > shd generate same file names //
      //////////////////////////////////////////////////////////////////////
      mainMd5.run(function (err) {

        if (err) {
          t.fail(err);
          return t.end();
        }

        var cssDirContentsSecondTime = fs.readdirSync(cssDir),
          jsDirContentsSecondTime = fs.readdirSync(jsDir);

        t.ok(cssDirContentsSecondTime.indexOf(cssVersioned) !== -1, "2nd time: css file md5 versioned copy generated");
        t.ok(jsDirContentsSecondTime.indexOf(jsNewieVersioned) !== -1, "2nd time: jsNewie md5 versioned copy generated");
        t.ok(jsDirContentsSecondTime.indexOf(jsOldieVersioned) !== -1, "2nd time: jsOldie md5 versioned copy generated");
        t.end();
      });
    };


  cleaner(function (err) {

    if (err) {
      t.fail(err);
      return t.end();
    }


    mainMd5.run(runTestAssertions);
    // fixtures dir = dif when run from this script (rather than npm run-script pretest)
  });
});

test('Main.run(): matching file names', function (t) {
  var mainInstance = new Main({
    assets: [
      jsDir + 'login-bundle.js',
      jsDir + 'bundle.js'
    ],
    silence: true,
    grepFiles: []
  });

  mainInstance.run(function () {
    var jsDirContents = fs.readdirSync(jsDir);
    t.ok(jsDirContents.indexOf(mainInstance.replacers[0].outputFileName) !== -1, mainInstance.replacers[0].outputFileName + " exists");
    t.ok(jsDirContents.indexOf(mainInstance.replacers[1].outputFileName) !== -1, mainInstance.replacers[1].outputFileName + " exists");
    t.end();
  });
});
