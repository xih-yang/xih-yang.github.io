# 14、Tomcat 内核详解 - 请求URI映射器Mapper
- 来源：https://ddkk.com/zhuanlan/server/tomcat/3/14.html
- 分类：服务器框架
- 分组：教程目录
Mapper组件主要职责就是负责Tomcat的请求路由，每个客户端的请求到达Tomcat之后，都将由Mapper路由到对应的处理逻辑上（Servlet）上，在Tomcat结构中有两种部分包含Mapper组件，一个是Connector组件，称为全局路由Mapper；另一个是Context组件，称为局部路由Mapper；

## 1.请求的映射类型

每个完整的请求都会对应服务端Tomcat内部的Host、Context、Wrapper层次与之对应。而具体的路由工作则由Mapper组件负责。

## 2.Mapper的实现

Mapper组件会包含N个Host容器的引用，然后每个Host会包含N个Context容器引用，最后每个Context容器会包含N个Wrapper容器的引用；

## 3.局部路由Mapper

局部路由Mapper提供了Context容器内部路由导航功能的组件。它只存在于Context容器中，用于记录访问资源与Wrapper之间的映射，每个Web应用都存在自己的局部路由Wrapper组件；

局部路由Mapper只能在同一个Web应用内进行转发路由，而不能实现跨Web应用的路由，如果要实现跨Web应用，需要使用重定向功能，让客户端重新定向到其他主机或者其他的Web应用上。

而对于从客户端到服务端的请求，则需要全局路由Mapper组件的参与；

## 4.全局路由Mapper

除了局部路由Mapper之外，另外一种Mapper就是全局路由Mapper，它是提供了完整的路由导航功能的组件。位于Tomcat中的Connector组件中，提供对Host、Context、Wrapper容器的路由。

所以全局路由Mapper拥有Tomcat容器完整的路由映射，负责完整的请求地址路由功能；
