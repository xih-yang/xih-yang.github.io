# 05、RocketMQ 实战 - RocketMQ 控制台的安装与启动
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/5/5.html
- 分类：消息队列
- 分组：教程目录
RocketMQ有一个可视化的dashboard，通过该控制台可以直观的查看到很多数据。

## 1 下载

下载地址：https://github.com/apache/rocketmq-externals/releases

## 2 修改配置

修改其src/main/resources中的application.properties配置文件。

- 原来的端口号为8080，修改为一个不常用的
- 指定RocketMQ的name server地址

## 3 添加依赖

在解压目录rocketmq-console的pom.xml中添加如下JAXB依赖。

> JAXB，Java Architechture for Xml Binding，用于XML绑定的Java技术，是一个业界标准，是一
>
> 项可以根据XML Schema生成Java类的技术。

```java
<dependency>
<groupId>javax.xml.bind</groupId>
<artifactId>jaxb-api</artifactId>
<version>2.3.0</version>
</dependency>
<dependency>
<groupId>com.sun.xml.bind</groupId>
<artifactId>jaxb-impl</artifactId>
<version>2.3.0</version>
</dependency>
<dependency>
<groupId>com.sun.xml.bind</groupId>
<artifactId>jaxb-core</artifactId>
<version>2.3.0</version>
</dependency>
<dependency>
<groupId>javax.activation</groupId>
<artifactId>activation</artifactId>
<version>1.1.1</version>
</dependency>
```

## 4 打包

在rocketmq-console目录下运行maven的打包命令。

## 5 启动

## 6 访问
