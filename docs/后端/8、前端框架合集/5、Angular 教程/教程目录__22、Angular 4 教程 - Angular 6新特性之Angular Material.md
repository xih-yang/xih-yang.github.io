# 22、Angular 4 教程 - Angular 6新特性之Angular Material
- 来源：https://ddkk.com/zhuanlan/qianduan/angular/1/22.html
- 分类：前端框架
- 分组：教程目录
Angular Material是包含Navigation/Dashboard/Table三种图形类型，这篇文章中将会了解一些其使用的方式。

## 准备:安装Material

进入到上篇文章创建的demo2，使用ng add进行安装

```java
liumiaocn:demo2 liumiao$ pwd
/tmp/trainings/angualr/demo2
liumiaocn:demo2 liumiao$
```

> 安装命令：ng add @angular/material

```java
liumiaocn:demo2 liumiao$ ng add @angular/material
Installing packages for tooling via yarn.
yarn add v1.7.0
[1/4] ?  Resolving packages...
[2/4] ?  Fetching packages...
[3/4] ?  Linking dependencies...
warning " > @angular/material@6.4.0" has unmet peer dependency "@angular/cdk@6.4.0".
[4/4] ?  Building fresh packages...
success Saved lockfile.
success Saved 1 new dependency.
info Direct dependencies
└─ @angular/material@6.4.0
info All dependencies
└─ @angular/material@6.4.0
✨  Done in 13.02s.
Installed packages for tooling via yarn.
UPDATE package.json (1374 bytes)
UPDATE angular.json (3785 bytes)
UPDATE src/app/app.module.ts (423 bytes)
UPDATE src/index.html (469 bytes)
UPDATE src/styles.css (165 bytes)
liumiaocn:demo2 liumiao$
```

## 确认package的变化

安装之前对package.json做了备份，可以看出此次操作有何变化

```java
liumiaocn:demo2 liumiao$ diff package.json package.json.org
20d19
<     "@angular/material": "^6.4.0",
26,27c25
<     "zone.js": "^0.8.26",
<     "@angular/cdk": "^6.2.0"
---
>     "zone.js": "^0.8.26"
29a28
>     "@angular/compiler-cli": "^6.0.3",
30a30
>     "typescript": "~2.7.2",
32d31
<     "@angular/compiler-cli": "^6.0.3",
47,48c46
<     "tslint": "~5.9.1",
<     "typescript": "~2.7.2"
---
>     "tslint": "~5.9.1"
liumiaocn:demo2 liumiao$
```

由于diff命令自身的限制，一些没有变化的内容也被列了出来，确认之后发现@angular/material和@angular/cdk是添加的内容

## Material Navigation

使用Material 创建Navigation只需要如下的命令即可

> 创建命令：ng generate @angular/material:material-nav –name 名称

接下来我们创建一个名为mynav的Material Navigation

```java
liumiaocn:demo2 liumiao$ ng generate @angular/material:material-nav --name mynav
CREATE src/app/mynav/mynav.component.css (129 bytes)
CREATE src/app/mynav/mynav.component.html (948 bytes)
CREATE src/app/mynav/mynav.component.spec.ts (698 bytes)
CREATE src/app/mynav/mynav.component.ts (577 bytes)
UPDATE src/app/app.module.ts (793 bytes)
liumiaocn:demo2 liumiao$
```

确认selector为app-mynav

```java
liumiaocn:demo2 liumiao$ cat src/app/mynav/mynav.component.ts
import { Component } from '@angular/core';
import { BreakpointObserver, Breakpoints, BreakpointState } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
@Component({
  selector: 'app-mynav',
  templateUrl: './mynav.component.html',
  styleUrls: ['./mynav.component.css']
})
export class MynavComponent {
  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches)
    );
  constructor(private breakpointObserver: BreakpointObserver) {}
  }
liumiaocn:demo2 liumiao$
```

替换app.component.html的内容，确认Material Navigation的运行状况

```java
liumiaocn:demo2 liumiao$ cat src/app/app.component.html 
<app-mynav></app-mynav>
liumiaocn:demo2 liumiao$
```

运行ng serve

```java
liumiaocn:demo2 liumiao$ ng serve
** Angular Live Development Server is listening on localhost:4200, open your browser on http://localhost:4200/ **
...省略
ℹ ｢wdm｣: Compiled successfully.
```

确认Material Navigation运行页面

可以看到，缺省生成的Material Navigation就是一个Sidebar的菜单布局

## Material Table

> 创建命令：ng generate @angular/material:material-table –name 名称

创建名为mytable的Material Table：

```java
liumiaocn:demo2 liumiao$ ng generate @angular/material:material-table --name mytable
CREATE src/app/mytable/mytable-datasource.ts (3360 bytes)
CREATE src/app/mytable/mytable.component.css (0 bytes)
CREATE src/app/mytable/mytable.component.html (857 bytes)
CREATE src/app/mytable/mytable.component.spec.ts (618 bytes)
CREATE src/app/mytable/mytable.component.ts (701 bytes)
UPDATE src/app/app.module.ts (993 bytes)
liumiaocn:demo2 liumiao$ 
liumiaocn:demo2 liumiao$ grep app- src/app/mytable/mytable.component.ts
  selector: 'app-mytable',
liumiaocn:demo2 liumiao$
```

替换app.component.html并运行ng serve

```java
liumiaocn:demo2 liumiao$ cat src/app/app.component.html 
<app-mytable></app-mytable>
liumiaocn:demo2 liumiao$
```

确认Material Table运行页面，顶部对table可以进行排序操作

滑动到尾部可以看到具有分页的功能
