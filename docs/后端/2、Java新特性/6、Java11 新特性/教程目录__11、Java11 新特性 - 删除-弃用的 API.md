# 11、Java11 新特性 - 删除-弃用的 API
- 来源：https://ddkk.com/zhuanlan/java/java11/11.html
- 分类：Java 11 新特性
- 分组：教程目录
Java 11 已删除选定的已弃用 API。以下是已删除 API 的列表。

## Java EE 和 CORBA

以下已弃用的 Java EE 和 CORBA 从 Java 11 版本中删除。

- 基于 XML 的 Web 服务的 Java API (java.xml.ws)
- XML 绑定的 Java 体系结构 (java.xml.bind)
- JavaBeans 激活框架 (java.activation)
- 常用注解（java.xml.ws.annotation）
- 通用对象请求代理架构 (java.corba)
- JavaTransaction API (java.transaction)

这些API 可作为第三方站点的独立版本使用。

## JMC 和 JavaFX

- JDK Mission Control (JMC) 从标准 JDK 中删除。它可作为独立下载使用。
- JavaFX 也从标准 JDK 中删除。它可以作为单独的模块下载。

## 弃用的模块

- 不推荐使用 Nashorn JavaScript 引擎和 JJS 工具。
- JAR 文件的 Pack200 压缩方案已弃用。
