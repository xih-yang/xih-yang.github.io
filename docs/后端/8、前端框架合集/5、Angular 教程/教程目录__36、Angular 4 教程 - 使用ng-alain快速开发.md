# 36、Angular 4 教程 - 使用ng-alain快速开发
- 来源：https://ddkk.com/zhuanlan/qianduan/angular/1/36.html
- 分类：前端框架
- 分组：教程目录
ng-alain在ng-zorro-antd上再封一程，可以更快加速开发速度，目前在github上已经超过1800个star。这篇文章来简单看一下如何使用。

## 创建应用框架

因为alain缺省使用使用less作为样式设定，在创建骨架时需要指定style为less方式。使用ng new alaindemo –skip-install –style less进行创建。

## 下载依赖

可以使用yarn或者npm install进行依赖包的下载

```java
liumiaocn:alaindemo liumiao$ ng add ng-alain
...省略
DELETE README.md
DELETE src/main.ts
DELETE src/environments/environment.prod.ts
DELETE src/environments/environment.ts
DELETE src/app/app.module.ts
DELETE src/app/app.component.spec.ts
DELETE src/app/app.component.ts
CREATE src/app/app.component.spec.ts (607 bytes)
CREATE src/app/app.component.ts (1481 bytes)
CREATE src/app/app.module.ts (1966 bytes)
CREATE src/app/core/README.md (142 bytes)
CREATE src/app/core/core.module.ts (326 bytes)
CREATE src/app/core/module-import-guard.ts (269 bytes)
CREATE src/app/core/net/default.interceptor.ts (3923 bytes)
CREATE src/app/core/startup/startup.service.ts (3556 bytes)
CREATE src/app/delon.module.ts (2635 bytes)
CREATE src/app/layout/default/default.component.html (303 bytes)
CREATE src/app/layout/default/default.component.spec.ts (528 bytes)
CREATE src/app/layout/default/default.component.ts (1199 bytes)
CREATE src/app/layout/default/header/components/fullscreen.component.ts (568 bytes)
CREATE src/app/layout/default/header/components/icon.component.ts (2010 bytes)
CREATE src/app/layout/default/header/components/notify.component.ts (6019 bytes)
CREATE src/app/layout/default/header/components/search.component.ts (1162 bytes)
CREATE src/app/layout/default/header/components/storage.component.ts (678 bytes)
CREATE src/app/layout/default/header/components/task.component.ts (3269 bytes)
CREATE src/app/layout/default/header/components/user.component.ts (1250 bytes)
CREATE src/app/layout/default/header/header.component.html (2101 bytes)
CREATE src/app/layout/default/header/header.component.spec.ts (513 bytes)
CREATE src/app/layout/default/header/header.component.ts (522 bytes)
CREATE src/app/layout/default/header/index.md (491 bytes)
CREATE src/app/layout/default/sidebar/sidebar.component.html (702 bytes)
CREATE src/app/layout/default/sidebar/sidebar.component.spec.ts (518 bytes)
CREATE src/app/layout/default/sidebar/sidebar.component.ts (366 bytes)
CREATE src/app/layout/fullscreen/fullscreen.component.html (33 bytes)
CREATE src/app/layout/fullscreen/fullscreen.component.ts (188 bytes)
CREATE src/app/layout/layout.module.ts (1720 bytes)
CREATE src/app/layout/passport/passport.component.html (587 bytes)
CREATE src/app/layout/passport/passport.component.less (1295 bytes)
CREATE src/app/layout/passport/passport.component.ts (416 bytes)
CREATE src/app/routes/callback/callback.component.ts (820 bytes)
CREATE src/app/routes/dashboard/dashboard.component.html (60 bytes)
CREATE src/app/routes/dashboard/dashboard.component.ts (332 bytes)
CREATE src/app/routes/exception/403.component.ts (349 bytes)
CREATE src/app/routes/exception/404.component.ts (349 bytes)
CREATE src/app/routes/exception/500.component.ts (349 bytes)
CREATE src/app/routes/passport/lock/lock.component.html (1287 bytes)
CREATE src/app/routes/passport/lock/lock.component.spec.ts (513 bytes)
CREATE src/app/routes/passport/lock/lock.component.ts (891 bytes)
CREATE src/app/routes/passport/login/login.component.html (3393 bytes)
CREATE src/app/routes/passport/login/login.component.less (877 bytes)
CREATE src/app/routes/passport/login/login.component.ts (5427 bytes)
CREATE src/app/routes/passport/register/register.component.html (4306 bytes)
CREATE src/app/routes/passport/register/register.component.less (721 bytes)
CREATE src/app/routes/passport/register/register.component.ts (3203 bytes)
CREATE src/app/routes/passport/register-result/register-result.component.html (505 bytes)
CREATE src/app/routes/passport/register-result/register-result.component.ts (302 bytes)
CREATE src/app/routes/routes-routing.module.ts (2726 bytes)
CREATE src/app/routes/routes.module.ts (1422 bytes)
CREATE src/app/shared/json-schema/json-schema.module.ts (848 bytes)
CREATE src/app/shared/shared.module.ts (1393 bytes)
CREATE src/assets/logo-color.svg (2062 bytes)
CREATE src/assets/logo-full.svg (4421 bytes)
CREATE src/assets/logo.svg (2062 bytes)
CREATE src/assets/tmp/app-data.json (9489 bytes)
CREATE src/assets/tmp/img/1.png (2838 bytes)
CREATE src/assets/tmp/img/2.png (2515 bytes)
CREATE src/assets/tmp/img/3.png (3386 bytes)
CREATE src/assets/tmp/img/4.png (3293 bytes)
CREATE src/assets/tmp/img/5.png (2560 bytes)
CREATE src/assets/tmp/img/6.png (3827 bytes)
CREATE src/assets/tmp/img/avatar.jpg (43173 bytes)
CREATE src/assets/tmp/img/bg1.jpg (647356 bytes)
CREATE src/assets/tmp/img/bg10.jpg (185940 bytes)
CREATE src/assets/tmp/img/bg2.jpg (148219 bytes)
CREATE src/assets/tmp/img/bg3.jpg (360944 bytes)
CREATE src/assets/tmp/img/bg4.jpg (493847 bytes)
CREATE src/assets/tmp/img/bg5.jpg (157930 bytes)
CREATE src/assets/tmp/img/bg6.jpg (453836 bytes)
CREATE src/assets/tmp/img/bg7.jpg (46096 bytes)
CREATE src/assets/tmp/img/bg8.jpg (194653 bytes)
CREATE src/assets/tmp/img/bg9.jpg (64117 bytes)
CREATE src/assets/tmp/img/half-float-bg-1.jpg (108685 bytes)
CREATE src/assets/zorro.svg (2266 bytes)
CREATE src/environments/environment.hmr.ts (700 bytes)
CREATE src/environments/environment.prod.ts (109 bytes)
CREATE src/environments/environment.ts (701 bytes)
CREATE src/main.ts (968 bytes)
CREATE src/styles/index.less (59 bytes)
CREATE src/styles/theme.less (71 bytes)
CREATE src/styles.less (188 bytes)
CREATE src/testing/common.spec.ts (2473 bytes)
CREATE LICENSE (1107 bytes)
CREATE README-zh_CN.md (5203 bytes)
CREATE README.md (6642 bytes)
CREATE _mock/README.md (43 bytes)
CREATE _mock/_user.ts (2208 bytes)
CREATE _mock/index.ts (26 bytes)
CREATE .prettierignore (37 bytes)
CREATE .prettierrc (77 bytes)
CREATE .stylelintrc (1056 bytes)
CREATE .vscode/launch.json (475 bytes)
CREATE .vscode/settings.json (350 bytes)
CREATE src/hmr.ts (776 bytes)
UPDATE package.json (2805 bytes)
UPDATE angular.json (4897 bytes)
UPDATE tsconfig.json (800 bytes)
UPDATE src/tsconfig.app.json (647 bytes)
UPDATE src/tsconfig.spec.json (717 bytes)
UPDATE tslint.json (3189 bytes)
UPDATE src/tslint.json (433 bytes)
UPDATE src/index.html (1668 bytes)
...省略
liumiaocn:alaindemo liumiao$ 
```

## 启动&确认

使用ng serve启动应用，会报出各种错误，官方称使用npm即可，并给了yarn和npm的plugin的使用，确认之后还是将Less的版本，另外碰到问题之后反复npm install->删除node_modules也未曾成功。所以使用了如下官网不建议的方式： git clone -> npm install -> ng serve

## git clone

```java
liumiaocn:WebstormProjects liumiao$ git clone https://github.com/cipchk/ng-alain alain
Cloning into 'alain'...
remote: Counting objects: 8311, done.
remote: Total 8311 (delta 0), reused 0 (delta 0), pack-reused 8311
Receiving objects: 100% (8311/8311), 39.35 MiB | 57.00 KiB/s, done.
Resolving deltas: 100% (5518/5518), done.
liumiaocn:WebstormProjects liumiao$ 
```

## npm install

```java
liumiaocn:WebstormProjects liumiao$ cd alain
liumiaocn:alain liumiao$ npm install
...省略
```

## ng serve

```java
liumiaocn:alain liumiao$ ng serve
** Angular Live Development Server is listening on localhost:4200, open your browser on http://localhost:4200/ **
Date: 2018-08-07T21:10:18.784Z
Hash: 8a18f86907d3f20f1a22
Time: 46325ms
chunk {data-v-data-v-module} data-v-data-v-module.js, data-v-data-v-module.js.map (data-v-data-v-module) 13.4 kB  [rendered]
chunk {delon-delon-module} delon-delon-module.js, delon-delon-module.js.map (delon-delon-module) 77.9 kB  [rendered]
chunk {extras-extras-module} extras-extras-module.js, extras-extras-module.js.map (extras-extras-module) 43.8 kB  [rendered]
chunk {main} main.js, main.js.map (main) 269 kB [initial] [rendered]
chunk {polyfills} polyfills.js, polyfills.js.map (polyfills) 425 kB [initial] [rendered]
chunk {pro-pro-module} pro-pro-module.js, pro-pro-module.js.map (pro-pro-module) 153 kB  [rendered]
chunk {runtime} runtime.js, runtime.js.map (runtime) 8.22 kB [entry] [rendered]
chunk {scripts} scripts.js, scripts.js.map (scripts) 1.36 MB  [rendered]
chunk {style-style-module} style-style-module.js, style-style-module.js.map (style-style-module) 41.1 kB  [rendered]
chunk {styles} styles.js, styles.js.map (styles) 660 kB [initial] [rendered]
chunk {vendor} vendor.js, vendor.js.map (vendor) 7.27 MB [initial] [rendered]
chunk {widgets-widgets-module} widgets-widgets-module.js, widgets-widgets-module.js.map (widgets-widgets-module) 46.8 kB  [rendered]
ℹ ｢wdm｣: Compiled successfully
```

## 确认

这就是ng-alain的目前版本的确认页面

最近的一些例子中用的布局根alain很像的例子，也只是很像而已，用非常少的代码，模拟一下而已。在入门的时候，不考虑其他因素，仅先考虑功能性，在会用之后，在比较一下alain的代码，相信每个人都会有自己的体会。

## 总结

尝试了一下将git clone方式生成的node_modules直接给ng add 方式生成的项目使用，结果发现可以启动，但是css显示仍然有问题，但至少已经能够启动，有兴趣的朋友可以比较两个package.json的差别，相信至少能够推到ng serve启动的步骤上，不过花时间在这上面确实有点浪费，后续版本相信稳定之后将会是一行ng add可以将其引入的方式，clone下来自己增删改也是一个使用的方式。ng-zorro-antd只是一个前端的组件库，ng-alain真正意义上接近一个前端框架的概念，自带很多可以进行开发的类似半成品的sample，有一定能力的开发者可以考虑在此基础上进行修改。

## 参考文章

[https://ng-alain.com/docs/getting-started](https://ng-alain.com/docs/getting-started)
