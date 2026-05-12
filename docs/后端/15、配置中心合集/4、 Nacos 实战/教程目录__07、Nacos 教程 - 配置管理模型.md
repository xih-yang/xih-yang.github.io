# 07、Nacos 教程 - 配置管理模型
- 来源：https://ddkk.com/zhuanlan/registered/nacos/1/7.html
- 分类：注册中心
- 分组：教程目录
## 前言

Nacos的配置管理模型。

## 第一节 配置管理模型

nacos配置管理模型，对于nacos配置管理，通过Namespace，group，Data Id能够定位到一个配置集。

### 配置集 Data ID

在系统中，一个配置文件通常就是一个配置集，一个配置集可以包含系统的各种配置信息。例如，一个配置集可能包含了数据源，线程池，日志级别等配置项。每个配置集都可以定义一个有意义的名称，就是配置集的ID(Data ID)

### 配置项

配置集中包含的一个个配置内容就是配置项。它代表一个具体的可配置的参数与其域值，通常以key=value的形式存在。例如常用配置的日志输出级别(logLevel=INFO|WARN|ERROR)就是一个配置项。如下可支持的配置信息的格式

### 配置分组 group

配置分组是对配置集进行分组，通过一个有意义的字符串来表示，不同的配置分组下可以有相同的配置集。当在nacos上创建一个配置时，如果未填写配置分组的名称，则配置分组的名称默认采用DEFAULT_GROUP。配置分组的常见常见:可用于区分不同的项目或应用。

### 命名空间Namespace

命名空间可用于进行不同环境的配置隔离。例如可以隔离开发环境，测试环境和生产环境，因为它们的配置各不相同，或者隔离不同的用户，不同的开发人员使用同一个nacos管理各自的配置，可通过namespace隔离。不同的命名空间下，可以存在相同名称的配置分组或配置集。

### 实践

Namespace: 代表不同的环境，例如 开发，测试，生产。

Group:代表某项目，例如外卖项目，打车项目

DataId:每个项目下往往存在若干个工程，每个配置集代是一个工程的主配置文件。

## 第二节 命名空间管理

### namespace隔离设计

namespace 的设计是nacos基于此做多环境以及多租户(多个用户共享使用nacos)数据(配置和服务)隔离的。

- 从一个租户的角度来看，如果多套不同的环境，那么这个时候可以根据指定的环境来创建不同的命名空间，以此来实现多环境的隔离。例如 ：你可能有开发，测试和生产三套不同的环境，那么使用一套nacos集群可以分别一下三个不同的namespace。

### 命名空间管理和配置数据获取

如何创建命名空间

**1、** 打开左侧命名空间，点击新建命名空间；

此时进入配置列表就可以切换新建的命名空间。

**2、** 此时在dev下新建数据集；

**3、** 编写代码；

这里我们获取dev命名空间下的配置，也就需要传递namespace的id(从命名空间那里可以查看到namespace id),

如果不传namespace,默认的就是public,也就是系统自带的命名空间。

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
        //这是从非public的命名空间获取配置集，就需要命名空间的id
        properties.put("namespace","d0f32411-9568-4cd3-a595-a1d98989bbeb");
        ConfigService configService=  NacosFactory.createConfigService(properties);
        String config=configService.getConfig(dataId,group,3000);
        System.out.println(config);
    }
}
```

**1、** 运行代码；
