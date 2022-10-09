# versioning-asseets

## Install
```Shell
npm install -g versioning-assets
```

## What it does:
1. Renames assets on filesystem
```Shell
	## BEFORE
	/www/project-x/public/css$ ls -l
	> all-min.css

	## AFTER
	/www/project-x/public/css$ ls -l
	> all-min.44d0440440442524c6d667900275e.css
```

2.  Find and replaces references to them in files:
```HTML
	<!-- index.html: BEFORE -->
	<link rel="stylesheet" type="text/css" href="css/all-min.css">

	<!-- index.html: AFTER -->
	<link rel="stylesheet" type="text/css" href="css/all-min.44d0440440442524c6d667900275e.css">
```

## How this module fits into your build process:
1. you:		generate fresh asset and output to the location specified in options.assets (> /public/css/all.min.css)
2. module: 	renames fresh asset file to versioned name (> all.min.__newversion__.css)
3. module: 	deletes original fresh asset file (all.min.css > deleted)
4. module: 	deletes old versioned asset files in the same dir (all.min.__oldversion__.css > deleted)


## Example

#### Input options in script:
```JavaScript
/* ~/www/project-x/version.js */
var Version = require("node-version-assets");
var versionInstance = new Version({
	assets: ['public/css/all-min.css', 'public/js/app.js'],
	grepFiles: ['views/prod/index.html']
});
versionInstance.run();
```

#### Run the script:

```Shell
andy@bada55:~/www/project-x$ node version.js

Deleted Assets:
   public/css/all-min.css
   public/js/app.js

Versioned Assets Created:
   public/css/all-min.44d0440440442524c6d667900275e.css: file unchanged > version number re-used
   public/js/app.12d070550742574e8d87900er34.js: file unchanged > version number re-used

Files whose contents were updated with refs to renamed asset files:
   views/prod/index.html
```

#### Run with the CLI

Install `npm i -g node-version-assets`

```bash
node-version-assets -a app.js,app.css -g index.html
```

Use `-h` to see the CLI help.

## Grunt Example
```JavaScript
grunt.registerTask('version-assets', 'version the static assets just created', function() {

	var Version = require("node-version-assets");
	var versionInstance = new Version({
		assets: ['public/css/all-min.css', 'public/js/app.js'],
		grepFiles: ['views/prod/index.html']
	});

	var cb = this.async(); // grunt async callback
	versionInstance.run(cb);
});

// make sure versioning is final task
grunt.registerTask('default', 'lint rjs jpgmin gifmin pngmin concat cssmin version-assets');
```

## Options

#### @param {options}
- accepts: object

#### @param {options.assets}
- accepts: array of strings
- required: each item of the array is the relative file path to the static asset
- each static asset listed will have the new version number inserted before the file type prefix, eg:
	- all-min.js > all.min.01135498.js
- if there is a previous version number in the same position then it will be replaced, eg:
	- all-min.oldversion234.js > all.min.01135498.js


## Optional, ahem, Options

#### @param {options.silence}
- accepts: boolean
- default: false
- if set to true, it will silence all output to STDOUT


#### @param {options.grepFiles}
- accepts: array of strings
- list of files (relative filepaths or globbed filepaths) containing references to the {options.assets} which need to be renamed
- a globbed filepath specifies all files that matches a certain pattern (i.e. /x/y/*.html will match all files in that directory with .html suffix)

#### @param {options.newVersion}
- accepts: string (only numbers or letters)
- not required: defaults to generating an md5 hash of the file (recommended to leave as default as md5 hashing means that assets will not blow browser cache if they're unchanged)

#### @param {options.keepOriginalAndOldVersions}
- accepts: boolean
- set this to true if you want to disable auto-deletion of BOTH the original and old versions
- by default the module deletes:
	1. the original, unversioned asset (eg app.js)
	2. previous versions of the asset (eg app.435fdg435TG435435.js)

#### @param {options.keepOriginal}
- accepts: boolean
- set this to true if you want to delete just the ORIGINAL
- if options.keepOriginalAndOldVersions is true then the old versions will still be deleted

#### @param {options.keepOldVersions}
- accepts: boolean
- set this to true if you want to delete just the OLD VERSIONS
- if options.keepOriginalAndOldVersions is true then the original will still be deleted

#### @param {options.requireJs}
- accepts: boolean
- not required: defaults to false

If set to true then unsuffixed js assets (listed in the assets array) will be updated to the new version, eg:
```HTML
<script type="text/javascript">
	require.config({
		paths: {

			<!-- BEFORE: -->
			main: "js/app.newie"

			<!-- AFTER: -->
			main: "js/app.newie.001"
		}
	});
</script>
```

#### @param {options.cdnPath}
- accepts: string
- not required
- if set, will prepend the `cdnPath` to all assets that are specified with an absolute path (ie, a leading `/`), eg:
	- `src="/public/all-min.js"` > `src="https://cdn.example.com/public/all.min.01135498.js"`
	- `src="images/image.jpg"` > `src="images/image.48503824.jpg"`
	- `src="../images/image.jpg"` > `src="../images/image.48503824.jpg"`

