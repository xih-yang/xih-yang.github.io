# 04、Nacos 教程 - OPEN API配置管理测试与关闭 Nacos 服务
- 来源：https://ddkk.com/zhuanlan/registered/nacos/1/4.html
- 分类：注册中心
- 分组：教程目录
## 前言

Nacos 配置测试

## 第一节 配置管理测试

### 发布配置

```java
curl -X POST "http://127.0.0.1:8848/nacos/v1/cs/configs?dataId=nacos.cfg.dataId&group=test&content=HelloWorld"
```

使用postman发起了请求

查看配置管理下配置列表，发现了配置数据，这样配置数据就成功了。

### 获取配置

```java
curl -X GET "http://127.0.0.1:8848/nacos/v1/cs/configs?dataId=nacos.cfg.dataId&group=test"
```

通过获取配置的接口，我们就拿到了配置的数据。

## 第二节 关闭服务

直接双击运行shutdown.cmd，或者命令

```java
cmd shutdown.cmd
```
