# 23、Angular 4 教程 - Angular 6 + NG-Zorro
- 来源：https://ddkk.com/zhuanlan/qianduan/angular/1/23.html
- 分类：前端框架
- 分组：教程目录
NG-Zorro发行到1.0版本后，理论上说兼容性考虑地会好一些，可以考虑引入了。因为其需要Angular 6的版本，而Angular 6在本年度5月份左右刚刚发布，而且考虑到rxjs等相关的变化，低版本的要升上来还是有一点点修改和测试的量的，但是早晚要升，从这篇文章开始使用Angular 6 和 Ng-zorro的新版做demo。

## 准备

软件
版本

node
v8.11.3

npm
v5.6.0

Angular CLI
6.0.8

Package Manager
Yarn

rxjs
6.2.1

typescript
2.7.2

ng-zorro
1.2.0

## 构建demo

构建demo本身非常简单，只需要ng new之后，进行ng add ng-zorro-antd即可

### 创建demo应用框架

使用cli 创建一个名为ng6demo的框架

```java
liumiaocn:WebstormProjects liumiao$ ng new ng6demo --skip-install
CREATE ng6demo/README.md (1024 bytes)
CREATE ng6demo/angular.json (3557 bytes)
CREATE ng6demo/package.json (1311 bytes)
CREATE ng6demo/tsconfig.json (384 bytes)
CREATE ng6demo/tslint.json (2805 bytes)
CREATE ng6demo/.editorconfig (245 bytes)
CREATE ng6demo/.gitignore (503 bytes)
CREATE ng6demo/src/environments/environment.prod.ts (51 bytes)
CREATE ng6demo/src/environments/environment.ts (631 bytes)
CREATE ng6demo/src/favicon.ico (5430 bytes)
CREATE ng6demo/src/index.html (294 bytes)
CREATE ng6demo/src/main.ts (370 bytes)
CREATE ng6demo/src/polyfills.ts (3194 bytes)
CREATE ng6demo/src/test.ts (642 bytes)
CREATE ng6demo/src/assets/.gitkeep (0 bytes)
CREATE ng6demo/src/styles.css (80 bytes)
CREATE ng6demo/src/browserslist (375 bytes)
CREATE ng6demo/src/karma.conf.js (964 bytes)
CREATE ng6demo/src/tsconfig.app.json (194 bytes)
CREATE ng6demo/src/tsconfig.spec.json (282 bytes)
CREATE ng6demo/src/tslint.json (314 bytes)
CREATE ng6demo/src/app/app.module.ts (314 bytes)
CREATE ng6demo/src/app/app.component.css (0 bytes)
CREATE ng6demo/src/app/app.component.html (1141 bytes)
CREATE ng6demo/src/app/app.component.spec.ts (990 bytes)
CREATE ng6demo/src/app/app.component.ts (207 bytes)
CREATE ng6demo/e2e/protractor.conf.js (752 bytes)
CREATE ng6demo/e2e/src/app.e2e-spec.ts (303 bytes)
CREATE ng6demo/e2e/src/app.po.ts (208 bytes)
CREATE ng6demo/e2e/tsconfig.e2e.json (213 bytes)
    Successfully initialized git.
liumiaocn:WebstormProjects liumiao$
```

使用yarn安装各种依赖, 速度比npm确实是快一些，即使这样，依然需要4分钟

```java
liumiaocn:ng6demo liumiao$ yarn
yarn install v1.7.0
info No lockfile found.
[1/4] ?  Resolving packages...
warning karma-coverage-istanbul-reporter > istanbul-api > istanbul-lib-hook@1.2.1: 1.2.0 should have been a major version bump
[2/4] ?  Fetching packages...
[3/4] ?  Linking dependencies...
[4/4] ?  Building fresh packages...
success Saved lockfile.
✨  Done in 244.16s.
liumiaocn:ng6demo liumiao$
```

然后执行ng add ng-zorro-antd，ng add是Angular 6配套出来添加的一个新的命令，其实就是主要就是代替了以前使用package manager进行install并保存到pacakge.json中的动作。

```java
liumiaocn:ng6demo liumiao$ cp package.json package.json.org
liumiaocn:ng6demo liumiao$ ng add ng-zorro-antd
Installing packages for tooling via yarn.
yarn add v1.7.0
[1/4] ?  Resolving packages...
[2/4] ?  Fetching packages...
[3/4] ?  Linking dependencies...
warning " > ng-zorro-antd@1.2.0" has unmet peer dependency "@angular/cdk@^6.0.0".
[4/4] ?  Building fresh packages...
success Saved lockfile.
success Saved 3 new dependencies.
info Direct dependencies
└─ ng-zorro-antd@1.2.0
info All dependencies
├─ @angular/cdk@6.4.2
├─ date-fns@1.29.0
└─ ng-zorro-antd@1.2.0
✨  Done in 11.77s.
Installed packages for tooling via yarn.
UPDATE package.json (1342 bytes)
UPDATE src/app/app.component.html (276 bytes)
UPDATE angular.json (3697 bytes)
UPDATE src/app/app.module.ts (816 bytes)
liumiaocn:ng6demo liumiao$
```

### package.json的区别

```java
liumiaocn:ng6demo liumiao$ diff package.json package.json.org
24d23
<     "ng-zorro-antd": "^1.2.0",
28a28
>     "@angular/compiler-cli": "^6.0.3",
29a30
>     "typescript": "~2.7.2",
31d31
<     "@angular/compiler-cli": "^6.0.3",
46,47c46
<     "tslint": "~5.9.1",
<     "typescript": "~2.7.2"
---
>     "tslint": "~5.9.1"
liumiaocn:ng6demo liumiao$
```

其实只有添加了ng-zorro-antd的1.2.0版本的设定

### angular.json

angular.json也是angular 6开始稍微改头换面转为地上的一个文件，ng add之后，zorro将其css加入到了设定的style中

```java
            "styles": [
              "node_modules/ng-zorro-antd/src/ng-zorro-antd.min.css",
              "src/styles.css"
            ],
```

### app.module.ts文件

与早期的zorro相比这里主要的变化是国际化，其实只是名称和使用方式有了一些变化而已。

```java
liumiaocn:app liumiao$ cat app.module.ts 
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { NgZorroAntdModule, NZ_I18N, zh_CN } from 'ng-zorro-antd';
import { registerLocaleData } from '@angular/common';
import zh from '@angular/common/locales/zh';
registerLocaleData(zh);
@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    NgZorroAntdModule
  ],
  providers: [{ provide: NZ_I18N, useValue: zh_CN }],
  bootstrap: [AppComponent]
})
export class AppModule { }
liumiaocn:app liumiao$
```

### app.component.html

zorro的显示页面变成只是使用一下alicdn上的图片

```java
liumiaocn:app liumiao$ cat app.component.html 
<!-- NG-ZORRO -->
<a href="https://github.com/NG-ZORRO/ng-zorro-antd" target="_blank" style="display: flex;align-items: center;justify-content: center;height: 100%;width: 100%;">
  <img height="300" src="https://img.alicdn.com/tfs/TB1NvvIwTtYBeNjy1XdXXXXyVXa-89-131.svg">
</a>liumiaocn:app liumiao$
```

## 运行

```java
liumiaocn:ng6demo liumiao$ ng serve
** Angular Live Development Server is listening on localhost:4200, open your browser on http://localhost:4200/ **
Date: 2018-07-31T22:50:10.882Z
Hash: 1101cbc06dcbc1c73768
Time: 23493ms
chunk {main} main.js, main.js.map (main) 11.7 kB [initial] [rendered]
chunk {polyfills} polyfills.js, polyfills.js.map (polyfills) 227 kB [initial] [rendered]
chunk {runtime} runtime.js, runtime.js.map (runtime) 5.22 kB [entry] [rendered]
chunk {styles} styles.js, styles.js.map (styles) 414 kB [initial] [rendered]
chunk {vendor} vendor.js, vendor.js.map (vendor) 5.67 MB [initial] [rendered]
ℹ ｢wdm｣: Compiled successfully.
```

## 参考文章

[http://ng.ant.design/docs/introduce/zh#%E7%89%B9%E6%80%A7](http://ng.ant.design/docs/introduce/zh#%E7%89%B9%E6%80%A7)
