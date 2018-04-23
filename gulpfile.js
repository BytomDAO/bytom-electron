const path = require('path')
const gulp = require('gulp')
const process = require('process')
const packager = require('electron-packager')
const builder = require('electron-builder')
const clean = require('gulp-clean')
const zip = require('gulp-zip')

const packageInfo = require('./package.json')

const APP_NAME = packageInfo.name

let deleteUselessFiles = function (platform, distPath) {
  let filesToBeRemoved = []
  switch (platform) {
    case 'win32':
      filesToBeRemoved = [
        '*.html',
        'LICENSE',
        'version'
      ]
      break
    case 'darwin':
      filesToBeRemoved = [
        '*.html',
        'LICENSE',
        'version'
      ]
      break
    case 'linux':
      filesToBeRemoved = [
        '*.html',
        'LICENSE',
        'version',
      ]
      break
  }
  filesToBeRemoved = filesToBeRemoved.map((file) => {
    return path.join(distPath, file)
  })
  console.log('Removed unnecessary files...')
  return gulp.src(filesToBeRemoved).pipe(clean())
}

let compressFiles = function (platform, arch, distPath) {
  const fileName = 'Bytom-' + platform + '-' +arch
  let archname
  switch (arch) {
    case 'ia32':
      archname = '32'
      break
    case 'x64':
      archname = '64'
      break
  }
  let fileZipName
  switch (platform) {
    case 'darwin':
      fileZipName = 'Bytom-macosx.zip'
      break
    case 'win32':
      fileZipName = 'Bytom-win'+ archname +'.zip'
      break
    case 'linux':
      fileZipName = 'Bytom-linux'+ archname +'.zip'
      break
  }

  console.log("zip the fileds...")
  return gulp.src( distPath + '/' + fileName + '/**' )
    .pipe(zip(fileZipName))
    .pipe(gulp.dest(distPath))
}

let buildPackage = function (platform, arch, callback) {
  let icon
  switch (platform) {
    case 'win32':
      icon = './static/images/app-icon/win/app.ico'
      break
    case 'darwin':
      icon = './static/images/app-icon/mac/app.icns'
      break
    default:
      icon = './static/images/app-icon/png/app.png'
      break
  }
  let bytomd_file
  switch (platform) {
    case 'win32':
      if(arch == 'x64'){
        bytomd_file = 'bytomd/bytomd-(?!windows_amd64)'
      }else if(arch == 'ia32'){
        bytomd_file = 'bytomd/bytomd-(?!windows_386)'
      }
      break
    case 'darwin':
      bytomd_file = 'bytomd/bytomd-(?!darwin)'
      break
    case 'linux':
      if(arch == 'x64'){
        bytomd_file = 'bytomd/bytomd-(?!linux_amd64)'
      }else if(arch == 'ia32'){
        bytomd_file = 'bytomd/bytomd-(?!linux_386)'
      }
      break
  }
  packager({
    arch: arch,
    icon: icon,
    dir: '.',
    out: './desktop',
    name: APP_NAME,
    asar: {
      unpackDir: 'bytomd'
    },
    platform: platform,
    overwrite: true,
    ignore: bytomd_file
  }, function (err, appPath) {
    if (appPath) {
      let distPath = appPath[0]
      console.log(distPath)
      callback && callback(platform, arch, distPath)
    }
  })
}

let afterPackage = function (platform, arch, distPath) {
  deleteUselessFiles(platform, distPath)
  compressFiles(platform, arch, distPath)
}

gulp.task('build-dist', (cb) => {
  const appPackageJson = _.extend({}, require('../package.json'), {  // eslint-disable-line global-require
    name: APP_NAME.replace(/\s/, ''),
    productName: APP_NAME,
    description: APP_NAME,
    homepage: 'https://github.com/bytom/dashboard',
    build: {
      appId: 'org.bytom.desktopWallet',
      asar: true,
      directories: {
        buildResources: '../build',
        output: '../dist'
      },
      linux: {
        category: 'WebBrowser',
        icon: './static/images/app-icon/png/app.png',
        target: [
          'zip'
        ]
      },
      win: {
        target: [
          'zip'
        ]
      },
      mac: {
        category: 'public.app-category.productivity',
      },
      dmg: {
        iconSize: 128,
        contents: [
          {
            x: 441,
            y: 448,
            type: 'link',
            path: '/Applications'
          },
          {
            x: 441,
            y: 142,
            type: 'file'
          }
        ]
      }
    }
  })

  fs.writeFileSync(
    path.join(__dirname, `../dist_${type}`, 'app', 'package.json'),
    JSON.stringify(appPackageJson, null, 2), 'utf-8'
  )

  const targets = []
  if (options.mac) targets.push(builder.Platform.MAC)
  if (options.win) targets.push(builder.Platform.WINDOWS)
  if (options.linux) targets.push(builder.Platform.LINUX)

  builder.build({
    targets: builder.createTargets(targets, null, 'all'),
    projectDir: path.join(__dirname, `../dist_${type}`, 'app'),
    publish: 'never',
    config: {
      afterPack(params) {
        return Q.try(() => {
          shell.cp(
            [
              path.join(__dirname, '..', 'LICENSE'),
              path.join(__dirname, '..', 'README.md'),
              path.join(__dirname, '..', 'AUTHORS')
            ],
            params.appOutDir
          )
        })
      }
    }
  })
    .catch((err) => {
      throw new Error(err)
    })
    .finally(() => {
      cb()
    })
})

gulp.task('package', function (callback) {
  if (process.platform == 'darwin') {
    buildPackage(process.platform, 'x64', afterPackage)
  }else{
    buildPackage(process.platform, process.arch, afterPackage)
  }
})

gulp.task('package-uncompressed', function (callback) {
  if (process.platform == 'darwin') {
    buildPackage(process.platform, 'x64')
  }else{
    buildPackage(process.platform, process.arch)
  }
})

gulp.task('package-uncompressed-platform', function (callback) {
  if (gulp.env.platform == 'darwin') {
    buildPackage(gulp.env.platform, 'x64')
  }else{
    buildPackage(gulp.env.platform , gulp.env.arch)
  }
})

gulp.task('build-dist',() => {
  const platforms = ['darwin', 'win32', 'mac']
  const archs = ['x64', 'ia32']
  platforms.forEach((platform) => {
    if(platform != 'darwin'){
      buildPackage(platform, archs[0])
      buildPackage(platform, archs[1])
    }else{
      buildPackage(platform, 'x64')
    }
  })
})

gulp.task('default', ['build'])