# 27、SwaggerBootstrapUi说明
- 来源：https://ddkk.com/zhuanlan/tools/swagger/27.html
- 分类：开发工具
- 分组：教程目录
swagger-bootstrap-ui主要使用到的前端技术栈主要包括：

属性
说明

jquery
http://jquery.com/>;

bootstrap
http://getbootstrap.com

layer
http://layer.layui.com/>;

jsonviews
” rel=”nofollow”>https://github.com/yesmeck/jquery-jsonview>;

clipboard
https://github.com/zenorocha/clipboard.js>;

axios.min.js
” rel=”nofollow”>https://github.com/axios/axios>;

marked
https://github.com/markedjs/marked>;

art-template
” rel=”nofollow”>https://github.com/aui/art-template>;

这里主要说一些swagger-bootstrap-ui的一些思路，源码的话大家可以去[码云](https://gitee.com/xiaoym/swagger-bootstrap-ui)或者[GitHub](https://github.com/xiaoymin/Swagger-Bootstrap-UI)上去看

**1、** 构建SwaggerBootstrapUi主对象，类似Java后端面向对象的方式来写，定义一些基础属性,这样也方便后期扩展；

```java
var SwaggerBootstrapUi=function () {
    //swagger请求api地址
    this.url="swagger-resources";
    //文档id
    this.docId="content";
    //tabid
    this.tabId="tabUl";
    this.tabContentId="tabContent";
    this.searchEleId="spanSearch";
    this.searchTxtEleId="searchTxt";
    this.menuId="menu";
    this.searchMenuId="searchMenu";
    //实例分组
    this.instances=new Array();
    //当前分组实例
    this.currentInstance=null;
    //动态tab
    this.globalTabId="sbu-dynamic-tab";
    this.globalTabs=new Array();
    this.tabsLiContent=null;
    this.tabsPostProcessors=null;
}
```

包括swagger的响应的属性，也重新在js中定义函数，使用面向对象的方式来操作

**2、** 初始化工作，sbu的入口即main方法,类似于SpringBoot的main方法，读源码的朋友可以从这个方法进入；

```java
/***
     * swagger-bootstrap-ui的main方法,初始化文档所有功能,类似于SpringBoot的main方法
     */
SwaggerBootstrapUi.prototype.main=function () {
    var that=this;
    that.initWindowWidthAndHeight();
    that.windowResize();
    //加载分组接口
    that.analysisGroup();
    //创建分组元素
    that.createGroupElement();
    //搜索
    that.searchEvents();
}
```

**3、** 数据和页面分离，使用art-template模板渲染,这样保持js的独立性；
