# 38、Angular 4 教程 - 使用ng-alain进行开发
- 来源：https://ddkk.com/zhuanlan/qianduan/angular/1/38.html
- 分类：前端框架
- 分组：教程目录
在前面的文章中介绍过ng-alain，当时在使用的时候还显得不是很方便，最简单的一个demo运行的都不是非常流畅。而目前的版本已经做有较大的改进，再这个基础上进行二次开发，尤其是一些后端的平台或者监控的平台看起来都比较不错。在这篇文章中继续来确认一下使用的感受。

## demo环境的搭建

### 事前准备

本文所使用的node、npm与angular cli等的版本如下所示

组件
版本

node
v10.15.3

npm
6.4.1

Angular CLI
8.3.8

```java
liumiaocn:~ liumiao$ node -v
v10.15.3
liumiaocn:~ liumiao$ npm -v
6.4.1
liumiaocn:~ liumiao$ ng --version
     _                      _                 ____ _     ___
    / \   _ __   __ _ _   _| | __ _ _ __     / ___| |   |_ _|
   / △ \ | '_ \ / _ | | | | |/ _ | '__|   | |   | |    | |
  / ___ \| | | | (_| | |_| | | (_| | |      | |___| |___ | |
 /_/   \_\_| |_|\__, |\__,_|_|\__,_|_|       \____|_____|___|
                |___/
Angular CLI: 8.3.8
Node: 10.15.3
OS: darwin x64
Angular: 
... 
Package                      Version
------------------------------------------------------
@angular-devkit/architect    0.803.8
@angular-devkit/core         8.3.8
@angular-devkit/schematics   8.3.8
@schematics/angular          8.3.8
@schematics/update           0.803.8
rxjs                         6.4.0
liumiaocn:~ liumiao$
```

使用如下三部，可以快速搭建ng-alain的demo应用。

- 步骤1: 创建Angular应用

> 执行命令：ng new alain-demo --style less

注：添加Angular routing的提示选择 Yes

> ?Would you like to add Angular routing? Yes

- 步骤2: 将ng-alain添加到项目中

> 执行命令：
>
> cd alain-demo
>
> ng add ng-alain

执行日志如下所示，可以通过选择进行定制化demo的需求，这里全部设定为Yes

```java
liumiaocn:alain-demo liumiao$ ng add ng-alain
Installing packages for tooling via npm.
+ ng-alain@8.4.0
added 1 package from 1 contributor in 8.747s
Installed packages for tooling via npm.
? Which default language would you like to use? 简体中文
? Would you like to add hmr plugin? (default: Y) Yes
? Would you like to add code style plugin? (default: Y) Yes
? Would you like to add dynamic form (sf component) plugin? (default: Y) Yes
? Would you like to add mock plugin? (default: Y) Yes
? Would you like to add i18n plugin? (default: N) Yes
? Would you like to add g2 chart plugin? (default: N) Yes
DELETE src/app/app.component.spec.ts
DELETE src/app/app.component.html
DELETE src/app/app.component.less
CREATE src/style-icons-auto.ts (1845 bytes)
CREATE src/style-icons.ts (264 bytes)
CREATE src/typings.d.ts (223 bytes)
CREATE src/app/delon.module.ts (2622 bytes)
CREATE src/app/core/README.md (137 bytes)
CREATE src/app/core/core.module.ts (380 bytes)
CREATE src/app/core/index.ts (162 bytes)
CREATE src/app/core/module-import-guard.ts (263 bytes)
CREATE src/app/core/i18n/i18n.service.spec.ts (2276 bytes)
CREATE src/app/core/i18n/i18n.service.ts (3362 bytes)
CREATE src/app/core/net/default.interceptor.ts (4893 bytes)
CREATE src/app/core/startup/startup.service.ts (4759 bytes)
CREATE src/app/layout/layout.module.ts (2067 bytes)
CREATE src/app/layout/default/default.component.html (319 bytes)
CREATE src/app/layout/default/default.component.ts (3008 bytes)
CREATE src/app/layout/default/header/header.component.html (2415 bytes)
CREATE src/app/layout/default/header/header.component.ts (566 bytes)
CREATE src/app/layout/default/header/index.md (471 bytes)
CREATE src/app/layout/default/header/components/fullscreen.component.ts (845 bytes)
CREATE src/app/layout/default/header/components/i18n.component.ts (2021 bytes)
CREATE src/app/layout/default/header/components/icon.component.ts (2347 bytes)
CREATE src/app/layout/default/header/components/notify.component.ts (5957 bytes)
CREATE src/app/layout/default/header/components/search.component.ts (1245 bytes)
CREATE src/app/layout/default/header/components/storage.component.ts (825 bytes)
CREATE src/app/layout/default/header/components/task.component.ts (4073 bytes)
CREATE src/app/layout/default/header/components/user.component.ts (1823 bytes)
CREATE src/app/layout/default/setting-drawer/setting-drawer-item.component.html (1012 bytes)
CREATE src/app/layout/default/setting-drawer/setting-drawer-item.component.ts (640 bytes)
CREATE src/app/layout/default/setting-drawer/setting-drawer.component.html (4016 bytes)
CREATE src/app/layout/default/setting-drawer/setting-drawer.component.ts (8168 bytes)
CREATE src/app/layout/default/sidebar/sidebar.component.html (771 bytes)
CREATE src/app/layout/default/sidebar/sidebar.component.ts (342 bytes)
CREATE src/app/layout/fullscreen/fullscreen.component.html (32 bytes)
CREATE src/app/layout/fullscreen/fullscreen.component.ts (293 bytes)
CREATE src/app/layout/passport/passport.component.html (635 bytes)
CREATE src/app/layout/passport/passport.component.less (1502 bytes)
CREATE src/app/layout/passport/passport.component.ts (393 bytes)
CREATE src/app/routes/routes-routing.module.ts (2652 bytes)
CREATE src/app/routes/routes.module.ts (1090 bytes)
CREATE src/app/routes/callback/callback.component.ts (909 bytes)
CREATE src/app/routes/dashboard/dashboard.component.html (28 bytes)
CREATE src/app/routes/dashboard/dashboard.component.ts (307 bytes)
CREATE src/app/routes/exception/403.component.ts (345 bytes)
CREATE src/app/routes/exception/404.component.ts (345 bytes)
CREATE src/app/routes/exception/500.component.ts (345 bytes)
CREATE src/app/routes/exception/exception-routing.module.ts (710 bytes)
CREATE src/app/routes/exception/exception.module.ts (732 bytes)
CREATE src/app/routes/exception/trigger.component.ts (522 bytes)
CREATE src/app/routes/passport/lock/lock.component.html (884 bytes)
CREATE src/app/routes/passport/lock/lock.component.less (184 bytes)
CREATE src/app/routes/passport/lock/lock.component.ts (1122 bytes)
CREATE src/app/routes/passport/login/login.component.html (3774 bytes)
CREATE src/app/routes/passport/login/login.component.less (835 bytes)
CREATE src/app/routes/passport/login/login.component.ts (5502 bytes)
CREATE src/app/routes/passport/register/register.component.html (4870 bytes)
CREATE src/app/routes/passport/register/register.component.less (679 bytes)
CREATE src/app/routes/passport/register/register.component.ts (3279 bytes)
CREATE src/app/routes/passport/register-result/register-result.component.html (553 bytes)
CREATE src/app/routes/passport/register-result/register-result.component.ts (506 bytes)
CREATE src/app/shared/index.ts (98 bytes)
CREATE src/app/shared/shared.module.ts (1432 bytes)
CREATE src/app/shared/json-schema/json-schema.module.ts (805 bytes)
CREATE src/app/shared/utils/yuan.ts (333 bytes)
CREATE src/assets/logo-color.svg (2037 bytes)
CREATE src/assets/logo-full.svg (4374 bytes)
CREATE src/assets/logo.svg (2037 bytes)
CREATE src/assets/zorro.svg (2232 bytes)
CREATE src/assets/tmp/app-data.json (9355 bytes)
CREATE src/assets/tmp/i18n/el-GR.json (10233 bytes)
CREATE src/assets/tmp/i18n/en-US.json (7101 bytes)
CREATE src/assets/tmp/i18n/ko-KR.json (7561 bytes)
CREATE src/assets/tmp/i18n/pl-PL.json (7709 bytes)
CREATE src/assets/tmp/i18n/tr-TR.json (7474 bytes)
CREATE src/assets/tmp/i18n/zh-CN.json (7033 bytes)
CREATE src/assets/tmp/i18n/zh-TW.json (7041 bytes)
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
CREATE src/environments/environment.hmr.ts (682 bytes)
CREATE src/styles/index.less (80 bytes)
CREATE src/styles/theme.less (158 bytes)
CREATE LICENSE (1086 bytes)
CREATE README-zh_CN.md (3579 bytes)
CREATE proxy.conf.json (4 bytes)
CREATE _mock/README.md (38 bytes)
CREATE _mock/_user.ts (3106 bytes)
CREATE _mock/index.ts (25 bytes)
CREATE scripts/color-less.js (1454 bytes)
CREATE .prettierignore (170 bytes)
CREATE .prettierrc (113 bytes)
CREATE .stylelintrc (695 bytes)
CREATE .vscode/extensions.json (67 bytes)
CREATE .vscode/launch.json (459 bytes)
CREATE .vscode/settings.json (835 bytes)
CREATE _cli-tpl/test/__path__/__name@dasherize@if-flat__/__name@dasherize__.component.html (27 bytes)
CREATE _cli-tpl/test/__path__/__name@dasherize@if-flat__/__name@dasherize__.component.ts (854 bytes)
CREATE _cli-tpl/test/__path__/__name@dasherize@if-flat__/__name@dasherize__.component.spec.ts (713 bytes)
CREATE src/hmr.ts (776 bytes)
UPDATE package.json (3515 bytes)
UPDATE angular.json (5365 bytes)
UPDATE tsconfig.json (843 bytes)
UPDATE src/styles.less (321 bytes)
UPDATE src/app/app.component.ts (986 bytes)
UPDATE src/app/app.module.ts (3546 bytes)
UPDATE src/environments/environment.prod.ts (103 bytes)
UPDATE src/environments/environment.ts (683 bytes)
UPDATE README.md (3466 bytes)
UPDATE tslint.json (2604 bytes)
UPDATE src/main.ts (1009 bytes)
UPDATE src/index.html (1667 bytes)
UPDATE tsconfig.app.json (287 bytes)
npm WARN deprecated browserslist@2.11.3: Browserslist 2 could fail on reading 
...省略
up to date in 9.377s
liumiaocn:alain-demo liumiao$
```

- 步骤3: 使用ng-alain启动demo应用

> 执行命令：ng serve

执行日志如下所示

```java
liumiaocn:alain-demo liumiao$ ng serve
10% building 3/3 modules 0 activeℹ ｢wds｣: Project is running at http://localhost:4200/webpack-dev-server/
ℹ ｢wds｣: webpack output is served from /
ℹ ｢wds｣: 404s will fallback to //index.html
32% building 190/191 modules 1 active ...demo/node_modules/less-loader/dist/cjs.js??ref--16-3!/Users/liumiao/alain-demo/src/styles.lessℹ ｢wdm｣: wait until bundle finished: /
41% building 261/261 modules 0 activeℹ ｢wdm｣: wait until bundle finished: /
chunk {exception-exception-module} exception-exception-module.js, exception-exception-module.js.map (exception-exception-module) 11.7 kB  [rendered]
chunk {main} main.js, main.js.map (main) 233 kB [initial] [rendered]
chunk {polyfills} polyfills.js, polyfills.js.map (polyfills) 264 kB [initial] [rendered]
chunk {runtime} runtime.js, runtime.js.map (runtime) 9.02 kB [entry] [rendered]
chunk {scripts} scripts.js, scripts.js.map (scripts) 1.28 MB [entry] [rendered]
chunk {styles} styles.js, styles.js.map (styles) 2.61 MB [initial] [rendered]
chunk {vendor} vendor.js, vendor.js.map (vendor) 9.52 MB [initial] [rendered]
Date: 2019-10-11T02:45:06.420Z - Hash: de03967d390df7d59495 - Time: 19752ms
** Angular Live Development Server is listening on localhost:4200, open your browser on http://localhost:4200/ **
ℹ ｢wdm｣: Compiled successfully.
```

通过html的过度页面，可以看到应用的主页面如下所示：

关于各个目录和主要文件的说明如下所示：

```java
├── _mock                                       Mock 数据规则
├── src
│   ├── app
│   │   ├── core                                核心模块
│   │   │   ├── i18n
│   │   │   ├── net
│   │   │   │   └── default.interceptor.ts      默认HTTP拦截器
│   │   │   ├── services
│   │   │   │   └── startup.service.ts          初始化项目配置
│   │   │   └── core.module.ts                  核心模块文件
│   │   ├── layout                              通用布局
│   │   ├── routes
│   │   │   ├── **                              业务目录
│   │   │   ├── routes.module.ts                业务路由模块
│   │   │   └── routes-routing.module.ts        业务路由注册口
│   │   ├── shared                              共享模块
│   │   │   └── shared.module.ts                共享模块文件
│   │   ├── app.component.ts                    根组件
│   │   └── app.module.ts                       根模块
│   │   └── delon.module.ts                     @delon模块导入
│   ├── assets                                  本地静态资源
│   ├── environments                            环境变量配置
│   ├── styles                                  样式目录
└── └── style.less                              样式引导入口
```

## 使用ng-alain进行开发

上述的demo给出了一个简易的前端框架，主要功能略作改动即可实现定制要求不是特别大的情况下的适应。而使用ng-alain进行快速的业务页面的开发，目前的版本也给出了CRUD等页面自动生成的功能。接下来我们来演示一下一个功能模块在ng-alain中如何进开发。

### 步骤1: 生成模块

> COC: ng-alain认为功能页面不应该出现不属于某个某块的“幽灵”状态，这也符合一般的设计思路。所以进行业务开发时首先要进行业务模块的生成。

假设新加入的模块用于进行用户的增删改查的功能，首先可以通过如下命令来增加user模块。

> 执行命令：ng g ng-alain:module user

执行结果示例：

```java
liumiaocn:alain-demo liumiao$ ng g ng-alain:module user
CREATE src/app/routes/user/user-routing.module.ts (248 bytes)
CREATE src/app/routes/user/user.module.ts (404 bytes)
liumiaocn:alain-demo liumiao$ tree src/app/routes/user
src/app/routes/user
├── user-routing.module.ts
└── user.module.ts
0 directories, 2 files
liumiaocn:alain-demo liumiao$
```

确认一下目前阶段主要的demo的目录结构：

```java
liumiaocn:src liumiao$ tree -d
.
├── app
│   ├── core
│   │   ├── i18n
│   │   ├── net
│   │   └── startup
│   ├── layout
│   │   ├── default
│   │   │   ├── header
│   │   │   │   └── components
│   │   │   ├── setting-drawer
│   │   │   └── sidebar
│   │   ├── fullscreen
│   │   └── passport
│   ├── routes
│   │   ├── callback
│   │   ├── dashboard
│   │   ├── exception
│   │   ├── passport
│   │   │   ├── lock
│   │   │   ├── login
│   │   │   ├── register
│   │   │   └── register-result
│   │   └── user
│   └── shared
│       ├── json-schema
│       └── utils
├── assets
│   └── tmp
│       ├── i18n
│       └── img
├── environments
└── styles
32 directories
liumiaocn:src liumiao$
```

> COC：
>
> ng-alain建议业务模块在routes目录下展开，可以看到使用ng g ng-alain:module user命令所生成的user子目录正是生成在了routes目录之下。

### 步骤2: 生成CURD模块

使用如下命令，生成CURD模块：

> 执行命令：ng g ng-alain:curd curd -m=user

上述命令中的crud，在目前的ng-alain中还支持如下几种：

类型
说明

empty
空白页

list
列表页

edit
编辑页

view
查看页

curd
列表、编辑、查看

> COC:
>
> 与前面的命令不同，此行在执行的时候需要在所生成user模块的父目录进行，也就是当前目录下直接能够看到user模块的信息。

执行日志示例如下所示：

```java
liumiaocn:routes liumiao$ ng g ng-alain:curd curd -m=user
CREATE src/app/routes/user/curd/curd.component.html (352 bytes)
CREATE src/app/routes/user/curd/curd.component.ts (1262 bytes)
CREATE src/app/routes/user/curd/edit/edit.component.html (493 bytes)
CREATE src/app/routes/user/curd/edit/edit.component.ts (1550 bytes)
CREATE src/app/routes/user/curd/view/view.component.html (586 bytes)
CREATE src/app/routes/user/curd/view/view.component.ts (602 bytes)
UPDATE src/app/routes/user/user.module.ts (668 bytes)
UPDATE src/app/routes/user/user-routing.module.ts (356 bytes)
liumiaocn:routes liumiao$
```

可以看到，此行命令一共生成6个文件，包含了CURD的功能实现的模版内容，同时自动更新了模块和路由相关的内容。这样就完成了CRUD的功能模块的模版内容的加入。

### 步骤3: 添加User的2层菜单

修改如下文件：

```java
liumiaocn:startup liumiao$ cat startup.service.ts 
...省略
  private viaMock(resolve: any, reject: any) {
    // const tokenData = this.tokenService.get();
    // if (!tokenData.token) {
    //   this.injector.get(Router).navigateByUrl('/passport/login');
    //   resolve({});
    //   return;
    // }
    // mock
    const app: any = {
      name: ng-alain,
      description: Ng-zorro admin panel front-end framework
    };
    const user: any = {
      name: 'Admin',
      avatar: './assets/tmp/img/avatar.jpg',
      email: 'cipchk@qq.com',
      token: '123456789'
    };
    // Application information: including site name, description, year
    this.settingService.setApp(app);
    // User information: including name, avatar, email address
    this.settingService.setUser(user);
    // ACL: Set the permissions to full, https://ng-alain.com/acl/getting-started
    this.aclService.setFull(true);
    // Menu data, https://ng-alain.com/theme/menu
    this.menuService.add([
      {
        text: 'Main',
        group: true,
        children: [
          {
            text: 'Dashboard',
            link: '/dashboard',
            icon: { type: 'icon', value: 'appstore' }
          },
          {
            text: 'User',
            link: '/user',
            icon: { type: 'icon', value: 'user' },
            children: [
              {
                 text: 'CURD',
                 link: '/user/curd',
              },
              {
                 text: 'List',
                 link: '/user/list'
              }
            ]
          },
          {
            text: 'Quick Menu',
            icon: { type: 'icon', value: 'rocket' },
            shortcutRoot: true
          }
        ]
      }
    ]);
...省略
liumiaocn:startup liumiao$ 
```

在这里你可以看到一个为支撑这个demo运行的Mock函数，菜单写在这里是为了方便，在实际的环境中可以删除此函数，改成viaHttp，这样就会使用assets/tmp下的app-data.json文件的设定内容了，按照文件读入方式的json格式重写上述User菜单的内容即可。

修改完成之后，即可看到如下的菜单结构

### 步骤4: 将CURD子菜单和功能关联

接下来我们将使用命令行方式生成的菜单和自动生成的CURD功能页面进行关联。修改如下路由文件routes-routing.module.ts即可。

```java
liumiaocn:routes liumiao$ cat routes-routing.module.ts
 ...省略
const routes: Routes = [
  {
    path: '',
    component: LayoutDefaultComponent,
    canActivate: [SimpleGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent, data: { title: '仪表盘' } },
      { path: 'exception', loadChildren: () => import('./exception/exception.module').then(m => m.ExceptionModule) },
      // 业务子模块
      { path: 'user', loadChildren: () => import('./user/user.module').then(m => m.UserModule) },
      // { path: 'widgets', loadChildren: () => import('./widgets/widgets.module').then(m => m.WidgetsModule) },
    ]
  },
 ...省略
liumiaocn:routes liumiao$ 
```

可以看到，我们只加入了这样一行信息，User菜单的CURD子菜单项已经可以动作了。

```java
      { path: 'user', loadChildren: () => import('./user/user.module').then(m => m.UserModule) },
```

> COC：
>
> ng-alain建议如非特殊需要，模块的加载均使用懒加载模式。

而为什么是UserModule呢？则是因为自动生成的代码中Module的名称就是这样，详细信息如下所示：

```java
liumiaocn:user liumiao$ cat user.module.ts 
import { NgModule } from '@angular/core';
import { SharedModule } from '@shared';
import { UserRoutingModule } from './user-routing.module';
import { UserCurdComponent } from './curd/curd.component';
import { UserCurdEditComponent } from './curd/edit/edit.component';
import { UserCurdViewComponent } from './curd/view/view.component';
const COMPONENTS = [
  UserCurdComponent];
const COMPONENTS_NOROUNT = [
  UserCurdEditComponent,
  UserCurdViewComponent];
@NgModule({
  imports: [
    SharedModule,
    UserRoutingModule
  ],
  declarations: [
    ...COMPONENTS,
    ...COMPONENTS_NOROUNT
  ],
  entryComponents: COMPONENTS_NOROUNT
})
export class UserModule { }
liumiaocn:user liumiao$
```

### 定制化功能

虽然这个功能较为不错，但是这个页面并不是绝大多数分项目所需要功能，而ng-alain当前的版本提供了可以定制化自己模版的功能可以进一步满足实际项目的需求。

## 总结

可以看到，目前版本的ng-alain，使用起来体验已经有所增强，添加了常用的业务功能自动生成的诸如CURD和常见页面的生成与路由和模块信息更新的功能，使得通用的复制粘贴型的重复功能的作业内容能够得到较大程度的降低。虽然定制化和项目的适应性还需要进一步增强，但是作为前端自动化代码生成框架，已经成为一个选择项了。
