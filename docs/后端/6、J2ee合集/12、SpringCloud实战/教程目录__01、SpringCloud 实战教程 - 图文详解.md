# 01、SpringCloud 实战教程 - 图文详解
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloud/2/1.html
- 分类：J2EE框架
- 分组：教程目录
## Spring Cloud 是什么？

Spring Cloud 是一系列框架的有序集合，它利用 Spring Boot 的开发便利性简化了分布式系统的开发，比如服务发现、服务网关、服务路由、链路追踪等。Spring Cloud 并不重复造轮子，而是将市面上开发得比较好的模块集成进去，进行封装，从而减少了各模块的开发成本。换句话说：Spring Cloud 提供了构建分布式系统所需的“全家桶”。

## Spring Cloud 现状

目前，国内使用 Spring Cloud 技术的公司并不多见，不是因为 Spring Cloud 不好，主要原因有以下几点：

**1、** SpringCloud中文文档较少，出现问题网上没有太多的解决方案；

**2、** 国内创业型公司技术老大大多是阿里系员工，而阿里系多采用Dubbo来构建微服务架构；

**3、** 大型公司基本都有自己的分布式解决方案，而中小型公司的架构很多用不上微服务，所以没有采用SpringCloud的必要性；

但是，微服务架构是一个趋势，而 Spring Cloud 是微服务解决方案的佼佼者，这也是作者写本系列课程的意义所在。

## Spring Cloud 优缺点

其主要优点有：

**1、** 集大成者，SpringCloud包含了微服务架构的方方面面；

**2、** 约定优于配置，基于注解，没有配置文件；

**3、** 轻量级组件，SpringCloud整合的组件大多比较轻量级，且都是各自领域的佼佼者；

**4、** 开发简便，SpringCloud对各个组件进行了大量的封装，从而简化了开发；

**5、** 开发灵活，SpringCloud的组件都是解耦的，开发人员可以灵活按需选择组件；

它的缺点：

**1、** 项目结构复杂，每一个组件或者每一个服务都需要创建一个项目；

**2、** 部署门槛高，项目部署需要配合Docker等容器技术进行集群部署，而要想深入了解Docker，学习成本高；

Spring Cloud 的优势是显而易见的。因此对于想研究微服务架构的同学来说，学习 Spring Cloud 是一个不错的选择。

## Spring Cloud 项目搭建

温馨提示：要有一定的springboot的基础呦！

上一篇文章我们了解了微服务，光了解了还不够，最主要的还是要动手实践，因为实践是检验真理的唯一标准，只有理论和实践都掌握了，才是真的学会了。我们知道微服务是有多个服务，将不同的业务放到不同的服务当中，然后各个服务之间相互调用。所以我们要新建一个总工程（父工程）来管理下边的其他微服务工程。全程使用maven项目进行搭建，和springboot搭建是一样的。下面我们开始搭建!

项目搭建图：

我们首先先构建父工程，这里使用的是maven项目进行构建。

gav填写，根据自己的习惯进行填写，然后点击Next

出现如下界面，点击Finish，此时新建项目完成。

接下我们就先配置，首先我们先配置POM.XML文件。

```java
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.study.springcloud</groupId>
  <artifactId>mcroservice</artifactId>
  <!-- 首先修改打包方式 -->
  <packaging>pom</packaging>
  <version>1.0-SNAPSHOT</version>
  <properties>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <maven.compiler.source>1.8</maven.compiler.source>
    <maven.compiler.target>1.8</maven.compiler.target>
    <mysql.version>5.1.47</mysql.version>
    <druid.version>1.1.10</druid.version>
    <junit.version>4.1.2</junit.version>
    <lombok.version>1.16.10</lombok.version>
    <log4j.vsrsion>1.2.17</log4j.vsrsion>
  </properties>
  <!--  因为是总项目 所以用dependencyManagement来管理  因为其他的子项目就不会来管理版本了了 可以直接引用 -->
  <dependencyManagement>
    <dependencies>
      <!-- springcloud的依赖-->
      <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-dependencies</artifactId>
        <version>Greenwich.SR1</version>
        <type>pom</type>
        <scope>import</scope>
      </dependency>
      <!-- springboot的依赖-->
      <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-dependencies</artifactId>
        <version>2.1.4.RELEASE</version>
        <type>pom</type>
        <scope>import</scope>
      </dependency>
      <!--  数据库-->
      <dependency>
        <groupId>mysql</groupId>
        <artifactId>mysql-connector-java</artifactId>
        <version>${mysql.version}</version>
      </dependency>
      <dependency>
        <groupId>com.alibaba</groupId>
        <artifactId>druid</artifactId>
        <version>${druid.version}</version>
      </dependency>
      <!-- springboot启动器-->
      <dependency>
        <groupId>org.mybatis.spring.boot</groupId>
        <artifactId>mybatis-spring-boot-starter</artifactId>
        <version>1.3.2</version>
      </dependency>
      <!--单元测试 -->
      <dependency>
        <groupId>junit</groupId>
        <artifactId>junit</artifactId>
        <version>4.12</version>
      </dependency>
      <!-- lombok-->
      <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <version>1.18.8</version>
      </dependency>
      <!-- log4j-->
      <dependency>
        <groupId>log4j</groupId>
        <artifactId>log4j</artifactId>
        <version>${log4j.vsrsion}</version>
      </dependency>
      <dependency>
        <groupId>ch.qos.logback</groupId>
        <artifactId>logback-core</artifactId>
        <version>1.2.3</version>
      </dependency>
    </dependencies>
  </dependencyManagement>
</project>
```

因为我们父工程是不写业务的，其中我们可以将src文件夹删除，将一些没用的文件进行设置不显示或者删除。我们此时父工程就搭建完成了，就是这么简单。

接下来，我们就可以进行继续搭建其他的微服务工程了。我们首先搭建一个专门放我们实体类的服务，来让其他服务来调用。

选中我们的父工程点击New，在点击Module，如下图：

这里是跟见父工程一样。

填写我们的Module的项目名称。

注意下面这一步是Module name处用将我们项目名的-省略，因为实际项目中有更多的工程，我们为了方便看的更清楚，需要加-来进行分割！然后我们点击Finish。

此时我们的第一个微服务工程就建立完成了，接下来就是配置啦。我们首先配置POM.xml文件。这里我们引入了Hutool这个jar包，它是一个Java基础[工具](http://www.fly63.com/tool)类，对文件、流、加密解密、转码、正则、线程、XML等JDK方法进行封装，组成各种Util[工具](http://www.fly63.com/tool)类，同时提供以下组件：

- 布隆过滤
- 缓存
- 克隆接口
- 类型转换
- 日期处理
- [数据](http://www.fly63.com/)库ORM（基于ActiveRecord思想）
- 基于DFA有限自动机的多个关键字查找
- HTTP客户端
- IO和文件
- 有用的一些[数据](http://www.fly63.com/)结构
- 日志
- 反射代理类的简化（AOP切面实现）
- Setting（一种扩展Properties的配置文件）
- System（JVM和系统信息等）
- WatchService的封装（文件变动监控）
- XXXUtil各种有用的[工具](http://www.fly63.com/tool)类

用起来也别方便，使我们java开发中的神器。

```java
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <parent>
        <artifactId>mcroservice</artifactId>
        <groupId>com.study.springcloud</groupId>
        <version>1.0-SNAPSHOT</version>
    </parent>
    <modelVersion>4.0.0</modelVersion>
    <artifactId>cloud-api-commons</artifactId>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-devtools</artifactId>
            <scope>runtime</scope>
            <optional>true</optional>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
<!-- 工具包-->
        <dependency>
            <groupId>cn.hutool</groupId>
            <artifactId>hutool-all</artifactId>
            <version>5.1.0</version>
        </dependency>
    </dependencies>
</project>
```

这是我们就可以在该服务中写的pojo类，我们这里以支付为例，所以我们先在数据中建议一张支付的表。sql语句如下

```java
CREATE TABLE payment (
  id bigint(20) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  serial varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
```

我们为该表添加数据，sql语句如下：

```java
insert  into payment(id,serial) values (1,'百度'),(2,'alibaba'),(3,'京东'),(4,'头条');
```

建表和添加数据完成了，我们就新建对应的实体类。下图为项目结构图：

payment表对应的实体类。这里使用了lombok，上面的pom文件导入了依赖，但是需要安装lombok插件，不然会报错！如下图：

```java
package com.buba.springcloud.pojo;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;
import java.io.Serializable;
//网络通信 一定要实现序列化
//使用lombok  没有配置的童鞋要去百度查一下  jar我们导入了  需要在idea装一个插件就可以了
@Data
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
public class Payment implements Serializable {
    private Long id;
    // 微服务 一个服务对应一个数据库，同一个信息可能存在不同的数据库
    private  String serial;
}
```

为了数据传输的方便，也为了前后端分离项目，我们将返回的数据进行封装，封装成一个实体类。

```java
package com.buba.springcloud.pojo;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;
@Data
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
public class CommonResult<T> {
    private Integer code;//返回状态码
    private String  message;//返回是否调用成功
    private  T data; //返回的数据
    public CommonResult(Integer code, String message) {
        this(code,message,null);
    }
}
```

我们实体类的服务主要存放实体类，也不写业务逻辑，我们也可以将src文件夹删除掉。此时我们就将总工程和提供实体类的微服务工程搭建成功了。因为实体类的服务工程需要其他的各个服务工程调用，所以要将实体类的服务进行打包放到公用的本地库中。

我们首先将该工程clean，确保当前工程的maven的配置是否成功。

出现如下界面说明当前工程的maven配置环境没有问题

那接下来我们就开始install打包放到本地库中。如下为成功界面：

此时我们可以看到我们总工程的pom.xml文件引入了cloud-api-commons，如下图：

我们下一篇文章将要搭建生产者和消费者的微服务工程啦。文章持续更新中，欢迎点赞关注！
