# 12、Tomcat 内核详解 - 日志框架及其国际化
- 来源：https://ddkk.com/zhuanlan/server/tomcat/3/12.html
- 分类：服务器框架
- 分组：教程目录
## 1.系统内日志

Tomcat底层使用JDK自带的日志工具，没有使用第三方日志工具。以减少包的引用，没有采用JDK日志工具的默认配置，而是通过系统变量和重写某些类达到特定的效果；

## 2.日志的国际化

使用到了JDK里面的三个类：MessageFormat、Locale、ResourceBundle，Tomcat中利用StringManamger将这三个类封装起来，方便操作，每个Java包对应一个StringManager对象，折中的考虑使得性能与资源得以同时兼顾；

## 3.客户端访问日志

### 3.1访问日志组件的设计

### 3.2 访问日志格式的自定义
