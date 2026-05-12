# 1.2 jfinal-undertow 下开发
- 来源：https://ddkk.com/zhuanlan/orm/jfinal/2.html
- 分类：ORM框架
- 分组：1 Jfinal 入门
## 1、创建标准的 maven 项目

eclipse 主菜单选择 new，再选择 project

在弹出的窗口中选择 Maven Project，点击 next 按钮进入下一步

在接下来的窗口中勾选 Use default Wrokspace location 点击 next 进入下一步

在接下来的窗口中的 Filter 栏输入 "webapp"，选择 org.apache.maven.archetypes maven-archetype-webapp 1.0，点击 next 进入下一步

在接下来的窗口中输入 Group Id 以及 Artifact Id，点击 finish 完成项目的创建

创建创建完成后，最终的目录结构如下

**注意**：在某些低版本的 eclipse 中，项目创建完成后，在 main 目录下面会**缺少 "java" 这个目录**，只需要在资源管理器里面手动创建该目录即可

## 2、添加 jfinal-undertow 与 jfinal 依赖

打开pom.xml 文件，在其中添加如下依赖

```xml
<dependency>
    <groupId>com.jfinal</groupId>
    <artifactId>jfinal-undertow</artifactId>
    <version>3.0</version>
</dependency>
<dependency>
    <groupId>com.jfinal</groupId>
    <artifactId>jfinal</artifactId>
    <version>5.0.1</version>
</dependency>
```

如果需要 WebSocket 支持，再添加一个依赖，不开发 WebSocket 无需理会

```xml
<dependency>
    <groupId>io.undertow</groupId>
    <artifactId>undertow-websockets-jsr</artifactId>
    <version>2.2.17.Final</version>
</dependency>
```

## 3、添加 java 文件

在项目src/main/java 目录下创建demo包，并在 demo 包下创建 DemoConfig 文件

```java
package demo;
import com.jfinal.config.*;
import com.jfinal.template.Engine;
import com.jfinal.server.undertow.UndertowServer;
public class DemoConfig extends JFinalConfig {
    /**
     * 注意：用于启动的 main 方法可以在任意 java 类中创建，在此仅为方便演示
     *      才将 main 方法放在了 DemoConfig 中
     *
     *      开发项目时，建议新建一个 App.java 或者 Start.java 这样的专用
     *      启动入口类放置用于启动的 main 方法
     */
    public static void main(String[] args) {
        UndertowServer.start(DemoConfig.class, 80, true);
    }
    public void configConstant(Constants me) {
       me.setDevMode(true);
    }
    public void configRoute(Routes me) {
       // jfinal 4.9.03 版新增了路由扫描功能，不必手动添加路由
       // me.add("/hello", HelloController.class);
       // 使用路由扫描，参数 "demo." 表示只扫描 demo 包及其子包下的路由
       me.scan("demo.");
    }
    public void configEngine(Engine me) {}
    public void configPlugin(Plugins me) {}
    public void configInterceptor(Interceptors me) {}
    public void configHandler(Handlers me) {}
}
```

在demo 包下创建 HelloController 类文件， 内容如下：

```java
package demo;
import com.jfinal.core.Controller;
@Path("/hello")
public class HelloController extends Controller {
    public void index() {
       renderText("Hello JFinal World.");
    }
}
```

jfinal 4.9.03 新增了**路由扫描**功能，详情请见：[https://jfinal.com/doc/2-3](https://jfinal.com/doc/2-3)

## 4、启动项目

在DemoConfig 类文件上点击鼠标右键，选择 Debug As，再选择 Java Applidation 即可运行

## 5、开启浏览器看效果

打开浏览器在地址栏中输入: http://localhost/hello，输出内容为Hello JFinal World证明项目框架搭建完成

**完整 demo示例** 可在JFinal官方网站首页右侧下载：[http://www.jfinal.com](http://www.jfinal.com)

注意：**jfinal-undertow 默认不支持 JSP**，强烈建议使用 jfinal 默认的模板引擎 enjoy，谁用谁爽翻。

如果一定要使用 JSP，可以参考文档 1.5 章节最后面的《JSP支持问题》：[https://jfinal.com/doc/1-5](https://jfinal.com/doc/1-5)，或者使用 jetty-server 作为开发环境：[https://jfinal.com/doc/1-6](https://jfinal.com/doc/1-6)

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> JFinal 官方 | https://jfinal.com
