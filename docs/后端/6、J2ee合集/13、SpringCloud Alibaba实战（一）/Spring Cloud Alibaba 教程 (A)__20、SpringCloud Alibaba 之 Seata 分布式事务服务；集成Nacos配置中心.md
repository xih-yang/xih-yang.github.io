# 20、SpringCloud Alibaba 之 Seata 分布式事务服务；集成Nacos配置中心
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/1/20.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
## 一、Seata 配置中心

“配置中心”，内部存放着各种各样的配置文件，我们可以根据自己的需要从其中获取指定的配置文件，加载到对应的客户端中

Seata 支持多种配置中心：

- nacos
- consul
- apollo
- etcd
- zookeeper
- file （读本地文件，包含 conf、properties、yml 等配置文件）

## 二、Seata 整合 Nacos 配置中心

**1、** 创建一个SpringBoot项目，将seata-client和nacos-client的Maven依赖添加到项目的pom.xml文件；

```xml
<!-- spring-cloud-starter-alibaba-seata
    在 Spring Cloud 项目中，spring-cloud依赖 也会引入 seata-spring-boot-starter 依赖，在此排除
 -->
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-seata</artifactId>
    <exclusions>
        <exclusion>
            <groupId>io.seata</groupId>
            <artifactId>seata-spring-boot-starter</artifactId>
        </exclusion>
    </exclusions>
</dependency>
<!-- seata-spring-boot-starter
    注：服务端和客户端版本要一致，不然报错：
    no available service 'default' found, please make sure registry config correct
 -->
<dependency>
    <groupId>io.seata</groupId>
    <artifactId>seata-spring-boot-starter</artifactId>
    <version>1.4.2/version>
</dependency>
<dependency>
    <groupId>com.alibaba.nacos</groupId>
    <artifactId>nacos-client</artifactId>
    <version>1.2.0及以上版本</version>
</dependency>
```

注：！！！

seata-spring-boot-starter 服务端和客户端版本要一致，不然报错：

```bash
no available service 'default' found, please make sure registry config correct
```

博主使用 1.4.2 版本

在Spring Cloud 项目中，通常只需要在 pom.xml 中添加 spring-cloud-starter-alibaba-seata 依赖即可

```xml
<!--引入 seata 依赖-->
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-seata</artifactId>
</dependency>
```

**2、** SeataServer配置；

### Seata Server 配置

在Seata Server 安装目录下的 **config/registry.conf** 中，将配置方式（config.type）修改为 Nacos，并对 Nacos 配置中心的相关信息进行配置

如果使用了 注册中心 ，如 type="nacos"等要检查nacos的 应用名application、服务注册地址serverAddr、分组group、命名空间namespace、集群cluster、用户名username、密码password是否正确等

```bash
config {
  Seata 支持 file、nacos 、apollo、zk、consul、etcd3 等多种配置中心
 配置方式修改为 nacos
  type = "nacos"
  nacos {
   修改为使用的 nacos 服务器地址
    serverAddr = "127.0.0.1:8848"
   配置中心的命名空间
    namespace = ""
   配置中心所在的分组
    group = "SEATA_GROUP"
   Nacos 配置中心的用户名
    username = "nacos"
   Nacos 配置中心的密码
    password = "nacos"
  }
}
```

不然报错：

```bash
no available service found in cluster 'default', please make sure registry config correct and keep your seata server running
```

3、Seata Client 配置

### Seata Client 配置

在Seata Client（即微服务架构中的服务）中，通过 application.yml 等配置文件对 Nacos 配置中心进行配置

```bash
#-----------------------------------------------------------
#单机版 tc server 配置
# Seata应用编号，默认为 ${spring.application.name}
seata.application-id=springcloud-order-seata
# Seata事务组编号，用于TC集群名，一般格式为：${spring.application.name}-group
seata.tx-service-group=springcloud-order-seata-group
# 注：虚拟组和分组的映射要写对，不然报错：
# no available service 'null' found, please make sure registry config correct
# 虚拟组和分组的映射 seata.service.vgroup-mapping.${seata.tx-service-group}=default
seata.service.vgroup-mapping.springcloud-order-seata-group=default
# 分组和Seata服务的映射，此处default指上面 seata.service.vgroup-mapping.springboot-seata-group 的值 default
#seata.service.grouplist.default=192.168.133.129:8091
# 存储模式 默认 file模式
seata.config.type=file
# 默认为 file
#seata.registry.type=file
#------------------------------------------------------------
#设置使用注册中心
#seata-spring-boot-starter 1.1版本少一些配置项
seata.enabled=true
seata.registry.type=nacos
# 集群
seata.registry.nacos.cluster=default
# 分组
seata.registry.nacos.group=SEATA_GROUP
# 应用名
seata.registry.nacos.application=seata-server
# 服务注册地址
seata.registry.nacos.server-addr=192.168.133.129:8848
```

注：！！！

Seata应用编号 seata.application-id，默认为 ${spring.application.name}

Seata事务组编号 seata.tx-service-group，用于TC集群名，一般格式为：${spring.application.name}-group

Seata虚拟组和分组的映射 seata.service.vgroup-mapping.${seata.tx-service-group}=default

三者对应关系要写对，不然会报错：

```bash
no available service 'null' found, please make sure registry config correct
```

**4、** 先启动Nacos，再启动Seata-Server，此时查看Nacos服务列表；

（1）临时关闭Linux上防火墙，或者设置端口访问权限

```bash
systemctl stop firewalld
```

（2）因Nacos使用mysql持久化，需要先开启 mysql服务（手动安装或者docker启动，docker启动需要先启动docker和挂载mysql服务，不然重启docker或者mysql导致mysql数据丢失）

（3）先启动nacos服务

```bash
sh startup.sh -m standalone
```

> 单机环境必须带-m standalone参数启动；不带参数启动的是集群环境
