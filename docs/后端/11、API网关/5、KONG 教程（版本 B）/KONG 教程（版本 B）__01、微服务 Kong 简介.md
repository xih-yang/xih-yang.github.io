# 01、微服务 Kong 简介
- 来源：https://ddkk.com/zhuanlan/gateway/kong/d-2/1.html
- 分类：API网关
- 分组：KONG 教程（版本 B）
重要提示: **本教程是根据 KONG 0.10.x 版本进行编写的.**

## 1、什么是KONG

Kong是一个可扩展的开源API层(也称为API网关或API中间件)。它运行在任何RESTful API之前，并可通过官网提供的插件进行扩展，也可自定义插件进行用户定制的功能扩展。通过插件，可使其提供超出核心平台之外的功能和服务，譬如使用统计，用户身份验证，API授权等。

## 2、特性

- 可扩展: 通过简单地添加更多的机器，可以轻松地平行扩展，这意味着您的平台可以在一个较低负载的情况下处理任何请求。
- 模块化: 可以通过添加新的插件进行扩展，这些插件可以通过RESTful Admin API轻松配置。
- 在任何基础架构上运行: Kong可以在任何地方都能运行。您可以在云或内部部署环境中部署Kong，包括单个或多个数据中心设置，以及public，private 或invite-only APIs。

Kong是基于NGINX和Apache Cassandra或PostgreSQL构建的，能提供易于使用的RESTful API来操作和配置API管理系统。

## 3、请求流程

为了更好地理解系统，这是使用Kong的API的典型请求工作流程：

当Kong运行时，每个对API的请求将先被Kong命中，然后这个请求将会被代理到最终的API。在requests和responses之间，Kong将会执行已经事先安装和配置好的任何插件，授权您的API。Kong是每个API请求的入口点（point）。

## 4、下载安装

KONG的下载地址为 [https://getkong.org/install/](https://getkong.org/install/) ，支持多种操作系统，根据自己的操作系统来选择对应的版本来下载，但是，这玩意不支持Windows。

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> 来源：https://www.cnblogs.com/SummerinShire/category/861287.html
