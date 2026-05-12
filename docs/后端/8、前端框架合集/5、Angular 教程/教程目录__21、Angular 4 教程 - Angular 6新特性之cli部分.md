# 21、Angular 4 教程 - Angular 6新特性之cli部分
- 来源：https://ddkk.com/zhuanlan/qianduan/angular/1/21.html
- 分类：前端框架
- 分组：教程目录
Angular6的发布(2018/05/04)已经过去大概两个多月了，从这篇文章开始使用angular6进行试验。

## 生成项目框架

```java
liumiaocn:angualr liumiao$ ng new demo2 --skip-install
CREATE demo2/README.md (1022 bytes)
CREATE demo2/angular.json (3539 bytes)
CREATE demo2/package.json (1309 bytes)
CREATE demo2/tsconfig.json (384 bytes)
CREATE demo2/tslint.json (2805 bytes)
CREATE demo2/.editorconfig (245 bytes)
CREATE demo2/.gitignore (503 bytes)
CREATE demo2/src/environments/environment.prod.ts (51 bytes)
CREATE demo2/src/environments/environment.ts (631 bytes)
CREATE demo2/src/favicon.ico (5430 bytes)
CREATE demo2/src/index.html (292 bytes)
CREATE demo2/src/main.ts (370 bytes)
CREATE demo2/src/polyfills.ts (3194 bytes)
CREATE demo2/src/test.ts (642 bytes)
CREATE demo2/src/assets/.gitkeep (0 bytes)
CREATE demo2/src/styles.css (80 bytes)
CREATE demo2/src/browserslist (375 bytes)
CREATE demo2/src/karma.conf.js (964 bytes)
CREATE demo2/src/tsconfig.app.json (194 bytes)
CREATE demo2/src/tsconfig.spec.json (282 bytes)
CREATE demo2/src/tslint.json (314 bytes)
CREATE demo2/src/app/app.module.ts (314 bytes)
CREATE demo2/src/app/app.component.css (0 bytes)
CREATE demo2/src/app/app.component.html (1141 bytes)
CREATE demo2/src/app/app.component.spec.ts (988 bytes)
CREATE demo2/src/app/app.component.ts (207 bytes)
CREATE demo2/e2e/protractor.conf.js (752 bytes)
CREATE demo2/e2e/src/app.e2e-spec.ts (301 bytes)
CREATE demo2/e2e/src/app.po.ts (208 bytes)
CREATE demo2/e2e/tsconfig.e2e.json (213 bytes)
    Directory is already under version control. Skipping initialization of git.
liumiaocn:angualr liumiao$ 
```

## 项目骨架 1.7.3 vs v6

1.7.3
V6
文件
用途

有
有
./README.md
项目的基本信息，主要包含使用cli命令如何对项目进行构建/测试/运行等

有
无
./.angular-cli.json
CLI的配置文件，可以设定项目的基础信息，比如构建后的目标目录名称等（V4版）

无
有
./angular.json
CLI的配置文件，可以设定项目的基础信息，比如构建后的目标目录名称等（V6版）

有
有
./.editorconfig
编辑器的配置文件

有
有
./.gitignore
为了保证自动生成的文件不被提交的git配置文件

有
有
./src/assets/.gitkeep
assets目录用于存放图片等静态资源文件，构建时会拷贝到发布包里。新创建时一般为空，但是由于git会忽略空文件夹，放置.gitkeep这个空文件以保证目录得到管理

有
有
./src/environments/environment.prod.ts
生产环境配置文件，在.angular-cli.json中被mapping，mapping值为：prod

有
有
./src/environments/environment.ts
开发环境配置，在.angular-cli.json中被mapping，mapping值为：dev

有
有
./src/favicon.ico
网页左上角显示的图标

有
有
./src/index.html
项目主页

有
有
./src/main.ts
Angular程序的入口

有
有
./src/polyfills.ts
不同浏览器，比如一些老旧的浏览器及版本的支持

有
有
./src/styles.css
全局的样式

无
有
./src/tslint.json
tslint配置信息

有
有
./src/styles.css
全局的样式

有
有
./src/tsconfig.app.json
Angular应用的typescript编译器的配置文件

有
有
./src/tsconfig.spec.json
单元测试的typescirpt编译器的配置文件

有
有
./src/typings.d.ts
项目中使用的typescript类型的引用文件

有
有
./e2e/app.e2e-spec.ts
端到端测试文件

有
有
./e2e/app.po.ts
端到端测试入口文件

有
有
./e2e/tsconfig.e2e.json
用于端到端测试的typescript编译器的配置文件

有
有
./karma.conf.js
karma单元测试的配置文件

有
有
./package.json
npm的配置文件以及第三方依赖包

有
有
./protractor.conf.js
protractor的端到端测试的配置文件

有
有
./tsconfig.json
typescirpt编译器的配置文件

有
有
./tslint.json
提供给TSLint和Codelyzer的配置信息

有
有
./src/app/app.module.ts
模块定义配置文件

有
有
./src/app/app.component.css
组件的样式文件

有
有
./src/app/app.component.html
组件的HTML模板文件

有
有
./src/app/app.component.spec.ts
组件的单元测试文件

有
有
./src/app/app.component.ts
组件定义文件

## CLI workspaces的区别

### 1.7.3版本

```java
liumiaocn:demo1 liumiao$ cat .angular-cli.json 
{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "project": {
    "name": "demo1"
  },
  "apps": [
    {
      "root": "src",
      "outDir": "dist",
      "assets": [
        "assets",
        "favicon.ico"
      ],
      "index": "index.html",
      "main": "main.ts",
      "polyfills": "polyfills.ts",
      "test": "test.ts",
      "tsconfig": "tsconfig.app.json",
      "testTsconfig": "tsconfig.spec.json",
      "prefix": "app",
      "styles": [
        "styles.css"
      ],
      "scripts": [],
      "environmentSource": "environments/environment.ts",
      "environments": {
        "dev": "environments/environment.ts",
        "prod": "environments/environment.prod.ts"
      }
    }
  ],
  "e2e": {
    "protractor": {
      "config": "./protractor.conf.js"
    }
  },
  "lint": [
    {
      "project": "src/tsconfig.app.json",
      "exclude": "**/node_modules/**"
    },
    {
      "project": "src/tsconfig.spec.json",
      "exclude": "**/node_modules/**"
    },
    {
      "project": "e2e/tsconfig.e2e.json",
      "exclude": "**/node_modules/**"
    }
  ],
  "test": {
    "karma": {
      "config": "./karma.conf.js"
    }
  },
  "defaults": {
    "styleExt": "css",
    "component": {}
  }
}
liumiaocn:demo1 liumiao$
```

### v6版本

```java
liumiaocn:demo2 liumiao$ cat angular.json 
{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "newProjectRoot": "projects",
  "projects": {
    "demo2": {
      "root": "",
      "sourceRoot": "src",
      "projectType": "application",
      "prefix": "app",
      "schematics": {},
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:browser",
          "options": {
            "outputPath": "dist/demo2",
            "index": "src/index.html",
            "main": "src/main.ts",
            "polyfills": "src/polyfills.ts",
            "tsConfig": "src/tsconfig.app.json",
            "assets": [
              "src/favicon.ico",
              "src/assets"
            ],
            "styles": [
              "src/styles.css"
            ],
            "scripts": []
          },
          "configurations": {
            "production": {
              "fileReplacements": [
                {
                  "replace": "src/environments/environment.ts",
                  "with": "src/environments/environment.prod.ts"
                }
              ],
              "optimization": true,
              "outputHashing": "all",
              "sourceMap": false,
              "extractCss": true,
              "namedChunks": false,
              "aot": true,
              "extractLicenses": true,
              "vendorChunk": false,
              "buildOptimizer": true
            }
          }
        },
        "serve": {
          "builder": "@angular-devkit/build-angular:dev-server",
          "options": {
            "browserTarget": "demo2:build"
          },
          "configurations": {
            "production": {
              "browserTarget": "demo2:build:production"
            }
          }
        },
        "extract-i18n": {
          "builder": "@angular-devkit/build-angular:extract-i18n",
          "options": {
            "browserTarget": "demo2:build"
          }
        },
        "test": {
          "builder": "@angular-devkit/build-angular:karma",
          "options": {
            "main": "src/test.ts",
            "polyfills": "src/polyfills.ts",
            "tsConfig": "src/tsconfig.spec.json",
            "karmaConfig": "src/karma.conf.js",
            "styles": [
              "src/styles.css"
            ],
            "scripts": [],
            "assets": [
              "src/favicon.ico",
              "src/assets"
            ]
          }
        },
        "lint": {
          "builder": "@angular-devkit/build-angular:tslint",
          "options": {
            "tsConfig": [
              "src/tsconfig.app.json",
              "src/tsconfig.spec.json"
            ],
            "exclude": [
              "**/node_modules/**"
            ]
          }
        }
      }
    },
    "demo2-e2e": {
      "root": "e2e/",
      "projectType": "application",
      "architect": {
        "e2e": {
          "builder": "@angular-devkit/build-angular:protractor",
          "options": {
            "protractorConfig": "e2e/protractor.conf.js",
            "devServerTarget": "demo2:serve"
          },
          "configurations": {
            "production": {
              "devServerTarget": "demo2:serve:production"
            }
          }
        },
        "lint": {
          "builder": "@angular-devkit/build-angular:tslint",
          "options": {
            "tsConfig": "e2e/tsconfig.e2e.json",
            "exclude": [
              "**/node_modules/**"
            ]
          }
        }
      }
    }
  },
  "defaultProject": "demo2"
}liumiaocn:demo2 liumiao$ 
```

对文件内容进行确认发现整体内容大体相同，但是还是有不少区别的：

(1)增加了@angular-devkit/build-angular在各个阶段的builder，主要有如下的builder

```java
@angular-devkit/build-angular:app-shell
@angular-devkit/build-angular:browser
@angular-devkit/build-angular:dev-server
@angular-devkit/build-angular:extract-i18n
@angular-devkit/build-angular:karma
@angular-devkit/build-angular:protractor
@angular-devkit/build-angular:server
@angular-devkit/build-angular:tslint
```

(2)增加了文件版本version，当前值为1

(3)明示引入了i18n

…

## 安装package

```java
liumiaocn:angualr liumiao$ cd demo2
liumiaocn:demo2 liumiao$ ls
README.md     angular.json  e2e           package.json  src           tsconfig.json tslint.json
liumiaocn:demo2 liumiao$ yarn
yarn install v1.7.0
info No lockfile found.
[1/4] ��  Resolving packages...
warning karma-coverage-istanbul-reporter > istanbul-api > istanbul-lib-hook@1.2.1: 1.2.0 should have been a major version bump
[2/4] ��  Fetching packages...
[3/4] ��  Linking dependencies...
[4/4] ��  Building fresh packages...
success Saved lockfile.
✨  Done in 688.19s.
liumiaocn:demo2 liumiao$ 
```

## 确认版本

```java
liumiaocn:demo2 liumiao$ ng version
     _                      _                 ____ _     ___
    / \   _ __   __ _ _   _| | __ _ _ __     / ___| |   |_ _|
   / △ \ | '_ \ / _ | | | | |/ _ | '__|   | |   | |    | |
  / ___ \| | | | (_| | |_| | | (_| | |      | |___| |___ | |
 /_/   \_\_| |_|\__, |\__,_|_|\__,_|_|       \____|_____|___|
                |___/
Angular CLI: 6.0.8
Node: 8.11.3
OS: darwin x64
Angular: 6.0.9
... animations, common, compiler, compiler-cli, core, forms
... http, language-service, platform-browser
... platform-browser-dynamic, router
Package                           Version
-----------------------------------------------------------
@angular-devkit/architect         0.6.8
@angular-devkit/build-angular     0.6.8
@angular-devkit/build-optimizer   0.6.8
@angular-devkit/core              0.6.8
@angular-devkit/schematics        0.6.8
@angular/cli                      6.0.8
@ngtools/webpack                  6.0.8
@schematics/angular               0.6.8
@schematics/update                0.6.8
rxjs                              6.2.2
typescript                        2.7.2
webpack                           4.8.3
liumiaocn:demo2 liumiao$
```

## 启动

使用ng serve启动，则可确认结果了

## ng 命令比较

cli 1.7.3
V6
命令
说明

有
有
ng new
创建项目骨架

有
有
ng serve
构建并运行应用

有
有
ng generate
创建组件/类/服务等

有
有
ng lint
使用lint对代码进行检查

有
有
ng test
使用karma进行单体测试

有
有
ng e2e
使用protractor进行端到端测试

有
有
ng build
构建生成结果的js文件

有
deprecated
ng get/ng set
获取/设定配置

有
有
ng help
获取帮助信息

有
有
ng doc
查询文档信息

有
有
ng xi18n
从源文件抽取i18n信息

有
有
ng update
解析package.json并更新，在v6中添加了all等选项，之前只有dryRun和next

无
有
ng add
添加package

有
有
ng version
确认相关版本信息
