# 42、Angular 4 教程 - Karma使用介绍
- 来源：https://ddkk.com/zhuanlan/qianduan/angular/1/42.html
- 分类：前端框架
- 分组：教程目录
在前一篇文章中介绍了Jasmine框架在Angular中的使用，而无法避开的另外一个部分就是Karma，这篇文章将继续通过demo应用来介绍Karma在Angular中的运用。

## 什么是Karma

Karma是一个对JavaScript代码执行提供多种浏览器运行环境的工具，前身是被2012年Google开源的Testacular，2013年被更名为Karma。

## 为什么以及何时使用Karma

当有如下需求时，则可以考虑使用Karma

- 希望在真实的浏览器中测试前端代码
- 希望在多平台、多浏览器中测试前端代码
- 希望在开发时本地能够进行前端测试
- 希望前端测试能够整合到持续集成实践中
- 希望每次文件的更新都会执行测试
- 希望使用instanbul自动化生成测试覆盖率报告
- 希望使用RequireJS

## Karma vs Jasmine

Karma和Jasmine实际上并不具有可比性。Jasmine是前端的测试框架，与之类似的还有Mocha和Jasmine以及QUnit等。

## Karma支持的浏览器

Karma支持主流的浏览器，包括

- Chrome and Chrome Canary
- Firefox
- Safari
- PhantomJS
- JSDOM
- Opera
- Internet Explorer
- SauceLabs
- BrowserStack
- …

## 配置Karma

使用karma init命令可以用交互方式设定Karma的配置文件。具体步骤与说明如下所示

- 步骤1: 全局安装karma

使用npm install -g karma即可安装Karma，安装和版本确认的执行命令与结果信息如下所示：

```java
liumiaocn:~ liumiao$ npm install -g karma
/Users/liumiao/.nvm/versions/node/v10.15.3/bin/karma -> /Users/liumiao/.nvm/versions/node/v10.15.3/lib/node_modules/karma/bin/karma
+ karma@4.4.1
added 142 packages from 490 contributors in 6.874s
liumiaocn:~ liumiao$ karma --version
Karma version: 4.4.1
```

- 步骤2: 生成Karma配置文件

按照如下提示一步一步生成Karma的配置文件

```java
liumiaocn:~ liumiao$ mkdir -p karmatest
liumiaocn:~ liumiao$ cd karmatest/
liumiaocn:karmatest liumiao$ ls
liumiaocn:karmatest liumiao$ karma init
Which testing framework do you want to use ?
Press tab to list possible options. Enter to move to the next question.
> jasmine
Do you want to use Require.js ?
This will add Require.js plugin.
Press tab to list possible options. Enter to move to the next question.
> no
Do you want to capture any browsers automatically ?
Press tab to list possible options. Enter empty string to move to the next question.
> Chrome
> 
What is the location of your source and test files ?
You can use glob patterns, eg. "js/*.js" or "test/**/*Spec.js".
Enter empty string to move to the next question.
> 
Should any of the files included by the previous patterns be excluded ?
You can use glob patterns, eg. "**/*.swp".
Enter empty string to move to the next question.
> 
Do you want Karma to watch all the files and run the tests on change ?
Press tab to list possible options.
> yes
Config file generated at "/Users/liumiao/karmatest/karma.conf.js".
liumiaocn:karmatest liumiao$
```

- 步骤3: 确认配置文件

所生成配置文件信息如下所示

```java
liumiaocn:karmatest liumiao$ cat karma.conf.js 
// Karma configuration
// Generated on Tue Oct 29 2019 22:24:00 GMT+0800 (China Standard Time)
module.exports = function(config) {
  config.set({
    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',
    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],
    // list of files / patterns to load in the browser
    files: [
    ],
    // list of files / patterns to exclude
    exclude: [
    ],
    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
    },
    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],
    // web server port
    port: 9876,
    // enable / disable colors in the output (reporters and logs)
    colors: true,
    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,
    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,
    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],
    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,
    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  })
}
liumiaocn:karmatest liumiao$ 
```

## 配置项目说明

上述的步骤3中可以看到使用karma init生成了一个配置文件，接下来我们来看一下这个配置文件常用的设定项目与用途。

### basepath

basepath用来设定测试文件与当前配置文件的相对路径关系, 默认配置唯空，一般会结合files选项进行设定。

### frameworks

指定测试框架，缺省为jasmine，可选择的还有mocha和QUnit等。

### files 与 exclude

files用于指定会在浏览器中执行的测试文件，exclude用于指定将哪些files中的文件进行排除。

### preprocessors

可以用于设定需要进行预处理的文件与预处理器，常见的预处理器有babel和coverage等。

### reporters

用于设定报表的生成方式，可设定为progress或dots等。

### port

web服务器的端口，karma运行时，结果会在浏览器的此端口进行输出

### colors

输出结果是否为彩色，缺省为彩色（true），也可以设定为false

### logLevel

日志级别，可以设定为config.LOG_DISABLE 、config.LOG_ERROR、config.LOG_WARN 、 config.LOG_INFO、 config.LOG_DEBUG其中之一，缺省设定为config.LOG_INFO。

### autoWatch

是否监控文件状态，当设定为true的时候，测试目标文件发生变化时会自动被执行。

### browsers

设定使用的浏览器，缺省为Chrome

### singleRun

是否仅仅运行一次，缺省设定为false，如果设定为true时，karma在浏览器中运行完毕测试文件之后则会退出，一般在持续集成的环境中会被使用。

### concurrency

用于设定同时启动浏览器的并发数。

## demo应用的配置文件

前文介绍使用ng new demo生成的应用中Karma的配置文件如下所示：

```java
liumiaocn:demo liumiao$ cat karma.conf.js 
// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html
module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage-istanbul-reporter'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    client: {
      clearContext: false // leave Jasmine Spec Runner output visible in browser
    },
    coverageIstanbulReporter: {
      dir: require('path').join(__dirname, './coverage/demo'),
      reports: ['html', 'lcovonly', 'text-summary'],
      fixWebpackSourcePaths: true
    },
    reporters: ['progress', 'kjhtml'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome'],
    singleRun: false,
    restartOnFileChange: true
  });
};
liumiaocn:demo liumiao$ 
```

除了在karma init中生成的参数设定之外，还用到了如下的设定参数

### plugins

用于指定测试时所使用到的插件

### coverageIstanbulReporter

使用Istanbul来生成测试结果报告，并可以对输出的常熟和格式进行设定。

## Angular中Karma的使用

### angular.json

在此文件中，将test.ts、tsconfig.spec.json与karma.conf.js进行了关联

```java
 84         "test": {
 85           "builder": "@angular-devkit/build-angular:karma",
 86           "options": {
 87             "main": "src/test.ts",
 88             "polyfills": "src/polyfills.ts",
 89             "tsConfig": "tsconfig.spec.json",
 90             "karmaConfig": "karma.conf.js",
```

### tsconfig.spec.json

测试选项的设定包括编译选项在此文件中，其中包括测试文件的目录等。

```java
liumiaocn:demo liumiao$ cat tsconfig.spec.json 
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./out-tsc/spec",
    "types": [
      "jasmine",
      "node"
    ]
  },
  "files": [
    "src/test.ts",
    "src/polyfills.ts"
  ],
  "include": [
    "src/**/*.spec.ts",
    "src/**/*.d.ts"
  ]
}
liumiaocn:demo liumiao$ 
```

### test.ts

```java
liumiaocn:demo liumiao$ grep spec src/test.ts 
// This file is required by karma.conf.js and loads recursively all the .spec and framework files
const context = require.context('./', true, /\.spec\.ts$/);
liumiaocn:demo liumiao$
```

通过test.ts文件找到所有测试文件并执行。

## Karma执行过程

ngtest命令的执行结果中能清楚地看到Karma的执行过程，主要分为如下步骤

- 步骤1: 在9876端口（karma配置文件中设定）启动Karma服务
- 步骤2: 启动Chrome浏览器（karma配置文件中设定）
- 步骤3: 执行测试文件并显示测试结果

如下为生成测试覆盖率的ng 测试的执行日志示例信息：

```java
liumiaocn:demo liumiao$ ng test --code-coverage
30% building 12/12 modules 0 active29 10 2019 06:43:49.486:WARN [karma]: No captured browser, open http://localhost:9876/
29 10 2019 06:43:49.628:INFO [karma-server]: Karma v4.1.0 server started at http://0.0.0.0:9876/
29 10 2019 06:43:49.629:INFO [launcher]: Launching browsers Chrome with concurrency unlimited
29 10 2019 06:43:49.631:INFO [launcher]: Starting browser Chrome
29 10 2019 06:43:54.228:WARN [karma]: No captured browser, open http://localhost:9876/
29 10 2019 06:43:54.363:INFO [Chrome 78.0.3904 (Mac OS X 10.14.0)]: Connected on socket 3ZmfRRKlLYvWCOsnAAAA with id 22498255
Chrome 78.0.3904 (Mac OS X 10.14.0): Executed 3 of 3 SUCCESS (0.364 secs / 0.309 secs)
TOTAL: 3 SUCCESS
TOTAL: 3 SUCCESS
TOTAL: 3 SUCCESS
=============================== Coverage summary ===============================
Statements   : 100% ( 6/6 )
Branches     : 100% ( 0/0 )
Functions    : 100% ( 1/1 )
Lines        : 100% ( 5/5 )
================================================================================
```

## 参考内容

https://github.com/karma-runner/karma/

https://karma-runner.github.io/
