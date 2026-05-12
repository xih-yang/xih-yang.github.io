# 28、Angular 4 教程 - 简单布局的页面
- 来源：https://ddkk.com/zhuanlan/qianduan/angular/1/28.html
- 分类：前端框架
- 分组：教程目录
这篇文章用最简单的方式做一个包含左侧可收缩的侧边栏菜单和固定头部的页面布局。

## 修改内容

基本上还在前面的文章上使用的内容，为了简单，只是简单修改一下HTML和CSS的内容

## default-layout.component.html

```java
liumiaocn:default-layout liumiao$ cat default-layout.component.html 
<nz-layout>
  <nz-header>
    <div style="display:inline-block;width: 10%;">
      <a href="#/">
        <img src="assets/logo.svg" style="max-height:40px;">
      </a>
    </div>
    <div style="display:inline-block;width: 10%;">
      <button nz-button [nzType]="'primary'" (click)="handleCollapseAction()" style="margin-bottom: 10px;">
        <i class="anticon" [class.anticon-menu-unfold]="isCollapsed" [class.anticon-menu-fold]="!isCollapsed"></i>
      </button>
    </div>
    <div style="display:inline-block;width: 45%;">
      <nz-input-group nzSuffixIcon="anticon anticon-search">
        <input width="100%" type="text" nz-input placeholder="please input some information...">
      </nz-input-group>
    </div>
    <div style="display:inline-block;width: 35%; text-align: right ;">
      <nz-badge [nzCount]="5">
        <button nzTrigger="click" nzTitle="prompt text" nzPlacement="bottom" nz-button nz-popover
                [nzTitle]="titleTemplate" [nzContent]="contentTemplate" class="btn" nzType="primary" nzShape="circle">
          <i
            class="anticon anticon-bell"></i>
        </button>
        <ng-templatetitleTemplate><i class="anticon anticon-info-circle"></i> Title</ng-template>
        <ng-templatecontentTemplate>
          <nz-list [nzDataSource]="data" [nzRenderItem]="item" [nzItemLayout]="'horizontal'">
            <ng-templateitem let-item>
              <nz-list-item class="tooltip-layout">
                <nz-list-item-meta
                  [nzTitle]="nzTitle"
                  nzDescription="Alert information： you should pay attention to ....">
                  <ng-templatenzTitle>
                    {
     {
     item.title}}
                  </ng-template>
                </nz-list-item-meta>
              </nz-list-item>
            </ng-template>
          </nz-list>
        </ng-template>
      </nz-badge>
      <button nz-button style="margin-left: 10px" nzType="primary" nzShape="circle"><i
        class="anticon anticon-setting"></i></button>
      <button nz-button style="margin-left: 10px" nzType="primary" nzShape="circle"><i
        class="anticon anticon-poweroff"></i></button>
    </div>
  </nz-header>
  <nz-layout >
    <nz-sider [nzCollapsed]="isCollapsed">
      <div>
        <ul nz-menu [nzMode]="'inline'" nzTheme='light' [nzInlineCollapsed]="isCollapsed">
          <li nz-menu-item>
            <span title>
              <i class="anticon anticon-dashboard"></i>
              <span>Dashboard</span>
            </span>
          </li>
          <li nz-submenu>
            <span title>
              <i class="anticon anticon-area-chart"></i>
              <span>Chart</span>
            </span>
            <ul>
              <li nz-menu-item>G2</li>
              <li nz-menu-item>G6</li>
              <li nz-menu-item>F2</li>
              <li nz-menu-item>D3</li>
              <li nz-menu-item>Echart</li>
            </ul>
          </li>
          <li nz-submenu>
            <span title>
              <i class="anticon anticon-layout"></i>
              <span>Operations</span>
            </span>
            <ul>
              <li nz-menu-item>Create</li>
              <li nz-menu-item>Retrieve</li>
              <li nz-menu-item>Update</li>
              <li nz-menu-item>Delete</li>
            </ul>
          </li>
          <li nz-submenu>
            <span title>
              <i class="anticon anticon-setting"></i>
              <span>Other</span>
            </span>
            <ul>
              <li nz-menu-item>I18N</li>
              <li nz-menu-item>Draggable</li>
              <li nz-menu-item>LOG</li>
            </ul>
          </li>
        </ul>
      </div>
    </nz-sider>
    <nz-layout>
      <nz-content>
        <div class="content-box">
          <div nz-row nzGutter="16">
            <div nz-col class="gutter-row" nzSpan="24">
              <div class="gutter-box">
                content
              </div>
            </div>
          </div>
        </div>
      </nz-content>
    </nz-layout>
  </nz-layout>
  <nz-footer>
    Copyright by [liumiaocn] ICP 1567-2018
  </nz-footer>
</nz-layout>
liumiaocn:default-layout liumiao$ 
```

## default-layout.component.css

```java
liumiaocn:default-layout liumiao$ cat default-layout.component.css
.btn {
  margin-left: 18px;
}
.btn:hover {
  background: rgba(255,255,255,.2);
}
.tooltip-layout {
  margin-bottom: 5px;
  cursor: pointer
}
.tooltip-layout:hover {
  background:cccccc;
}
.ant-layout {
  text-align: center;
}
.ant-layout-header {
  background:1890ff;
  height:     64px;
  padding: 0 0px;
  font-size: 14px;
  color:ffffff;
}
.ant-layout-sider ,
.ant-menu {
  background:ffffff;
}
.ant-layout-content {
  background:fff;
  color:000000;
  margin-left: 10px;
}
.ant-layout-footer {
  background:ffffff;
  margin-top: 10px;
  height: 16px;
  padding-top: 7px;
}
.content-box {
  min-height: 700px;
  background:ebebeb;
  margin: 1px;
}
.ant-btn-primary {
  background: transparent;
}
liumiaocn:default-layout liumiao$
```

## 显示

所以整体来说，使用诸如zorro这样的组件库在一定程度上能提高开发效率的。

## 代码位置

可以从如下github上进行下载确认

```java
https://github.com/liumiaocn/trainings/tree/master/angualr/ng6demo
```
