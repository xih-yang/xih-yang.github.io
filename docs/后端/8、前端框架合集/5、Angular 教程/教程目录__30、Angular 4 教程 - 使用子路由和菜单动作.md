# 30、Angular 4 教程 - 使用子路由和菜单动作
- 来源：https://ddkk.com/zhuanlan/qianduan/angular/1/30.html
- 分类：前端框架
- 分组：教程目录
在这篇文章中创建一个子路由用于显示conent，用于展示各种组件比如G2如何使用。

## 创建module

```java
liumiaocn:default-layout liumiao$ ls
default-layout.component.css     default-layout.component.spec.ts
default-layout.component.html    default-layout.component.ts
liumiaocn:default-layout liumiao$ ng generate module content-module
CREATE src/app/default-layout/content-module/content-module.module.spec.ts (332 bytes)
CREATE src/app/default-layout/content-module/content-module.module.ts (197 bytes)
liumiaocn:default-layout liumiao$
```

## 创建新的content的组件

```java
liumiaocn:default-layout liumiao$ cd content-module/
liumiaocn:content-module liumiao$ ng generate component g2-demo
CREATE src/app/default-layout/content-module/g2-demo/g2-demo.component.css (0 bytes)
CREATE src/app/default-layout/content-module/g2-demo/g2-demo.component.html (26 bytes)
CREATE src/app/default-layout/content-module/g2-demo/g2-demo.component.spec.ts (629 bytes)
CREATE src/app/default-layout/content-module/g2-demo/g2-demo.component.ts (272 bytes)
UPDATE src/app/default-layout/content-module/content-module.module.ts (275 bytes)
liumiaocn:content-module liumiao$ 
```

## 为新建的moudle添加路由信息

新建的module中包含可以变化的各个子路由

```java
const content_routes: Routes = [
  {
    path: 'g2',
    component: G2DemoComponent
  }
];
```

## 为layout创建子路由关联

因为我们希望新添的页面是会替换当前页面部分的content，所以需要做如下关联

### HTML页面

在html页面原本显示content的地方换上content组件的选择器

```java
    <nz-layout>
      <nz-content>
        <div class="content-box">
          <div nz-row nzGutter="16">
            <div nz-col class="gutter-row" nzSpan="24">
              <div class="gutter-box">
                <router-outlet></router-outlet>
              </div>
            </div>
          </div>
        </div>
      </nz-content>
    </nz-layout>
```

### 路由中添加子路由信息

这里在DefaultLayoutComponent中添加了子路由的信息

```java
const routes: Routes = [
  {
    path: 'layout',
    component: DefaultLayoutComponent,
    children: [
      {
        path: 'g2',
        component: G2DemoComponent
      }
    ]
  },
  {
    path: '',
    component: DefaultLayoutComponent
  },
  {
    path: '**',
    component: DefaultLayoutComponent
  },
];
```

## 菜单设定

menu的菜单设定，实际就是使用的a标签，其中angular提供两个重要的设定内容，routerLink和routerLinkActive，比如此次如下设定即可

```java
<li nz-menu-item><a routerLink="/layout/g2" routerLinkActive="active">G2</a></li>
```

## 显示

通过点击菜单的G2菜单选项，通过子路由，便可得到如下的显示

## 总结

父子路由的设定，这里还是比较粗糙，还有很多问题需要处理，比如通过layout/g2可以访问到contents，直接定位g2会出现什么信息，试着自己确认一下会更好的理解这些基础知识。
