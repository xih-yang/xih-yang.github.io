# 04、Spring Boot Admin - 自定义开发UI界面
- 来源：https://ddkk.com/zhuanlan/monitoring/springbootadmin/4.html
- 分类：监控工具
- 分组：教程目录
## 前言

Spring Boot Admin提供了丰富的监控及其他功能，但是在正式上线前，需要二次开发，包含修改界面为自家公司或者去掉不需要的功能，下面将修改UI界面。

## UI界面修改

**1、** 环境准备；

安装nodejs/npm/cnpm等VUE开发环境

[下载admin源码](https://github.com/codecentric/spring-boot-admin/releases)

**2、** 导入源码；

IDEA打开源码

使用IDEA打开spring-boot-admin-server-ui模块，或者使用VS Code导入UI模块

**3、** package.json添加项目启动命令：“serve”:“vue-cli-serviceserve”；

**1、** 运行项目；

安装依赖：npm install

运行项目：npm run-script serve

访问：http://localhost:8080，接下来就可以修改界面代码了！

**2、** 修改示例：这项比较多余，于是想要删除关于我们这个菜单；

**3、** 注释about下这个这段代码；

**4、** 保存后访问首页，发现已被删除；

**5、** 打包UI项目：npmrun-scriptbuild；

**6、** 切换至spring-boot-admin根目录下，执行打包脚本：mvnw-Dmaven.test.failure.ignore=true-Dmaven.test.skip=truecleanpackage（过程很慢，耐心等待）；

**7、** 自定义包需要引入到server包中，实际开发时，需要上传到maven私服，然后引入私服包，这里博主就直接引用本地，修改admin项目pom；

```xml
<dependency>
    <groupId>de.codecentric</groupId>
    <artifactId>spring-boot-admin-starter-server</artifactId>
    <version>${
sring.admin.version}</version>
    <exclusions>
        <exclusion>
            <groupId>de.codecentric</groupId>
            <artifactId>spring-boot-admin-server-ui</artifactId>
        </exclusion>
    </exclusions>
</dependency>
<dependency>
    <groupId>de.codecentric</groupId>
    <artifactId>spring-boot-admin-server-ui</artifactId>
    <version>2.3.0</version>
    <scope>system</scope>
      <!--添加jar包路径-->
    <systemPath>E:\open-source\spring-boot-admin\spring-boot-admin-server-ui\target\spring-boot-admin-server-ui-2.3.0-SNAPSHOT.jar</systemPath>
</dependency>
```

**1、** 重启admin项目，发现修改成功，后续根据公司实际情况，二次开发即可；
