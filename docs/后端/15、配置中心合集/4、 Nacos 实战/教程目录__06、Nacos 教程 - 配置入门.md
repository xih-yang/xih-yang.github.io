# 06、Nacos 教程 - 配置入门
- 来源：https://ddkk.com/zhuanlan/registered/nacos/1/6.html
- 分类：注册中心
- 分组：教程目录
## 前言

如何发布配置 Nacos 客户端如何获取配置？

## 第一节 发布配置

**1、** 打开nacos控制台，点击配置管理>>配置列表，点击+号添加配置；

**1、** 填写配置信息，并发布，此时查看配置列表，就会出现刚刚的配置内容；

## 第二节 nacos客户端获取配置

**1、** 新建maven项目；

**2、** 引入依赖；

```java
<dependency>
    <groupId>com.alibaba.nacos</groupId>
    <artifactId>nacos-client</artifactId>
    <version>1.3.2</version>
</dependency>
```

**1、** 编写java代码；

```java
package com.it2;
import com.alibaba.nacos.api.NacosFactory;
import com.alibaba.nacos.api.config.ConfigService;
import com.alibaba.nacos.api.exception.NacosException;
import java.util.Properties;
public class NacosDemo01 {
    public static void main(String[] args) throws NacosException {
        String dataId="nacos-demo.yaml";
        String group="DEFAULT_GROUP";
        String serverAddr="127.0.0.1:8848";
        Properties properties=new Properties();
        properties.put("serverAddr",serverAddr);
        ConfigService configService=  NacosFactory.createConfigService(properties);
        String config=configService.getConfig(dataId,group,3000);
        System.out.println(config);
    }
}
```

**1、** 运行代码,这时我们就可以看到前面nacos里刚刚配置的内容；
