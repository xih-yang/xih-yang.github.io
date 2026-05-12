# 26、Angular 4 教程 - 可折叠的sidebar和菜单
- 来源：https://ddkk.com/zhuanlan/qianduan/angular/1/26.html
- 分类：前端框架
- 分组：教程目录
zorro对nz-sider和menu都提供了折叠的选项，可以很容易实现动态折叠的效果。

## menu的nzInlineCollapsed

menu通过nzInlineCollapsed的设定进行

### html

```java
liumiaocn:default-layout liumiao$ cat default-layout.component.html 
<nz-layout>
  <nz-header>
    <button nz-button [nzType]="'primary'" (click)="handleCollapseAction()" style="margin-bottom: 10px;">
      <i class="anticon" [class.anticon-menu-unfold]="isCollapsed" [class.anticon-menu-fold]="!isCollapsed"></i>
    </button>
  </nz-header>
  <nz-layout>
    <nz-sider>
      <div>
        <ul nz-menu [nzMode]="'inline'" nzTheme='light' [nzInlineCollapsed]="isCollapsed">
          <li nz-menu-item>
            <span title>
              <i class="anticon anticon-mail"></i>
              <span>Navigation One</span>
            </span>
          </li>
          <li nz-submenu>
            <span title>
              <i class="anticon anticon-appstore"></i>
              <span>Navigation Two</span>
            </span>
            <ul>
              <li nz-menu-item>Option 5</li>
              <li nz-menu-item>Option 6</li>
              <li nz-submenu>
                <span title>Submenu</span>
                <ul>
                  <li nz-menu-item>Option 7</li>
                  <li nz-menu-item>Option 8</li>
                </ul>
              </li>
            </ul>
          </li>
          <li nz-submenu>
            <span title>
              <i class="anticon anticon-setting"></i>
              <span>Navigation Three</span>
            </span>
            <ul>
              <li nz-menu-item>Option 9</li>
              <li nz-menu-item>Option 10</li>
              <li nz-menu-item>Option 11</li>
            </ul>
          </li>
        </ul>
      </div> 
    </nz-sider>
    <nz-layout>
      <nz-content>
    <div class="content-box">
      <div nz-row nzGutter="16">
        <div nz-col class="gutter-row" nzSpan="8">
          <div class="gutter-box">col-8</div>
        </div>
        <div nz-col class="gutter-row" nzSpan="8">
          <div class="gutter-box">col-8</div>
        </div>
        <div nz-col class="gutter-row" nzSpan="8">
          <div class="gutter-box">col-8</div>
        </div>
      </div>
    </div>
      </nz-content>
      <nz-footer>Layout Fotter</nz-footer>
    </nz-layout>
  </nz-layout>
</nz-layout>
liumiaocn:default-layout liumiao$
```

### css

```java
liumiaocn:default-layout liumiao$ cat default-layout.component.css
.ant-layout {
  text-align: center;
}
.ant-layout-header {
  background:1890ff;
  height:     64px;
}
.ant-layout-sider {
  background:ebebeb;
}
.ant-layout-content {
  background:fff;
  line-height: 120px;
  color:0;
  margin-left: 10px;
}
.ant-layout-footer {
  background:ebebeb;
  margin-top: 10px;
  margin-left: 10px;
}
.gutter-box {
  height: 400px;
  background:ebebeb;
  margin: 1px;
}
.ant-menu { 
  background:ebebeb;
}
.ant-btn-primary {
  background: transparent;
}
liumiaocn:default-layout liumiao$
```

### 折叠菜单

因为layout的原因，所以nz-sider没有跟着折叠

## nz-sider的nzCollapsed

nz-sider是通过nzCollapsed进行设定折叠状态的。所以只需要在html中添加对nzCollapsed的控制即可，menu折叠和展开的同时sider也同样动作即可`（）`
