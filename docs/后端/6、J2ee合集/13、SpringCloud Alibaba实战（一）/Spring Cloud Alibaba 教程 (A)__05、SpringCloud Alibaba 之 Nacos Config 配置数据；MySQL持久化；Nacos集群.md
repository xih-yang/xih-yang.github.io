# 05、SpringCloud Alibaba 之 Nacos Config 配置数据；MySQL持久化；Nacos集群
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/1/5.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
## 一、Nacos Config 服务配置数据

Nacos 服务配置数据模型主要由如下三部分组成

**1、** 命名空间（类似Java中的包package：com.company.service/controller）；

用于配置隔离，不同命名空间下，可以存在相同的Group或Data ID配置，Namespace的常用场景之一是不同环境的配置进行区分隔离，例如开发环境、测试环境和生产环境的资源（如配置、服务）隔离等；

**2、** Group；

Nacos中的一组配置集合，是组织配置的维度之一，通过一个有意义的字符串（如 Buy 或 Trade）对一组配置集合进行分组，从而区分Data ID相同的配置集合，当在 Nacos 上创建一个配置时，如果未填写配置分组的名称，则配置分组的名称默认采用 DEFAULT_GROUP，配置分组的常见场景：不同的应用或组件使用了相同的配置类型，如 database_url配置和MQ_topic配置；

**3、** DataId；

Nacos中的某个配置集合的ID，配置集合ID是组织划分配置的维度之一，Data ID通常用于组织划分系统的配置集合，一个系统或者应用可以包含多个配置集合，每个配置集都可以被一个有意义的名称标识；

因此Nacos Config 也可以出现 3 种组合方案

Java中 配置文件 bootstrap.properties 主要配置如下：

```bash
#通过nacos config 配置中心配置
#指定命名空间（复制命名空间的ID）
spring.cloud.nacos.config.namespace=4609e54c-da0d-482e-b4f9-ea97ee19049c
#nacos配置文件的扩展后缀(默认.properties) .properties 或者 .yaml
spring.cloud.nacos.config.file-extension=yaml
#GROUP不配置默认使用DEFAULT_GROUP，可自定义 DEV_GROUP
spring.cloud.nacos.config.group=DEV_GROUP
#通过nacos discovery 服务注册发现中心配置
#指定命名空间（复制命名空间的ID）
#spring.cloud.nacos.discovery.namespace=4609e54c-da0d-482e-b4f9-ea97ee19049c
#spring.cloud.nacos.discovery.group=DEV_GROUP
#激活使用哪一份配置，原来在springboot中代表：application-dev.properties
#现在在nacos config中代表： serviceName-test.propertoes
# ${spring.application.name}-${spring.profiles.active}.${file-extension:properties}
spring.profiles.active=dev
```

**1、** 默认命名空间(public)+默认Group分组(DEFAULT_GROUP)+自定义DataId（没有默认值）；

默认命名空间：public

默认Group：DEFAULT_GROUP

自定义Data Id：

${spring.application.name}-${spring.profiles.active}.${file-extension}

**2、** 默认命名空间（public）+自定义Group分组（DEV_GROUP）+自定义的DataId（没有默认值）；

默认命名空间：public

自定义Group：DEV_GROUP

自定义Data Id：

${spring.application.name}-${spring.profiles.active}.${file-extension}

**3、** 自定义命名空间（dev）+自定义Group分组（DEV_GROUP）+自定义的DataId（没有默认值）；

注：创建命名空间之后，会自动生成一个命名空间ID

自定义命名空间：dev

自定义Group：DEV_GROUP

自定义Data Id：

${spring.application.name}-${spring.profiles.active}.${file-extension}

## 二、Nacos 使用MySQL数据持久化

Nacos默认情况下是采用apache derby内嵌数据库进行数据存储，在单机模式时可以使用nacos嵌入式数据库实现数据存储

Derby数据库存放数据 位置 （nacos安装位置路径下的 **/nacos/data/derby-data/log/log1.dat** ）

```bash
/xx/nacos/data/derby-data/log/log1.dat
```

derby数据库不方便观察数据存储的基本情况，从nacos 0.7版本开始增加了支持mysql数据源能力

**1、** 安装MySQL数据库，版本要求：5.6.5+；

**2、** 启动MySQL服务，手动安装，或者Docker安装皆可（需要先启动Docker）；

**3、** 初始化MySQL数据库，创建数据库nacos_conf，该sql文件nacos-mysql.sql存放在nacos安装包下的conf目录下；

**4、** 修改nacos安装包下conf目录下的application.properties文件（/xx/conf/application.properties文件）；

增加支持MySQL数据源配置，添加（目前只支持mysql）数据源的url、用户名和密码，文件原文内容如下：

修改后：

```bash
#*************** Config Module Related Configurations ***************#
### If use MySQL as datasource:
spring.datasource.platform=mysql
### Count of DB:
db.num=1
### Connect URL of DB:
db.url.0=jdbc:mysql://127.0.0.1:3306/nacos_config?characterEncoding=utf8&connectTimeout=1000&socketTimeout=3000&autoReconnect=true&useUnicode=true&useSSL=false&serverTimezone=UTC
db.user=root
db.password=admin123456
```

注：

配置了nacos的数据库信息，一定要启动mysql服务，并且保证数据库以及表存在，不然报错如下

**5、** 关闭nacosserver，重启，重新在配置列表中新建配置，发现config_info表中存放最新的配置列表数据；

## 三、Nacos集群部署

Nacos Server 集群化部署的基本架构如下：

**1、** 准备三个nacos，3个或3个以上Nacos节点才能构成集群；

**2、** 在Nacos的conf目录下有一个cluster.conf.example，可以直接把example扩展名去掉来使用，也可以单独创建一个cluster.conf文件，然后在该文件中每行配置一个ip:port；

**192、** 168.133.128:8801；

**192、** 168.133.128:8802；

**192、** 168.133.128:8803；

博主条件有限，配置相同IP 下 不同端口号来测试 nacos集群

**3、** 分别编辑三台机器application.properties改端口分别为8801,8802,8803；

**4、** 修改三台机器内存大小；

**5、** 按照nacos持久化的方式配置好数据持久化到MySQL；

**6、** 在Java代码中的bootstrap.properties文件中配置；

```bash
#将Nacos设置为服务注册发现，默认为true
spring.cloud.nacos.discovery.enabled=true
#nacos注册中心的连接地址
#nacos单机
#spring.cloud.nacos.discovery.server-addr=192.168.133.129:8848
#nacos集群
spring.cloud.nacos.discovery.server-addr=192.168.133.129:8801,192.168.133.129:8802,192.168.133.129:8803
#nginx部署访问nacos集群
#spring.cloud.nacos.discovery.server-addr=192.168.133.129:80
#nacos配置中心的连接地址
#spring.cloud.nacos.config.server-addr配置的方式为,域名:port，如 Nacos的域名为nacos.com，监听的端口为80
#则spring.cloud.nacos.config.server-addr=nacos.com:80，注 80 端口不能省略
#nacos单机
#spring.cloud.nacos.config.server-addr=192.168.133.129:8848
#nacos集群
spring.cloud.nacos.config.server-addr=192.168.133.129:8801,192.168.133.129:8802,192.168.133.129:8803
#nginx部署访问nacos集群
#spring.cloud.nacos.config.server-addr=192.168.133.129:80
```

### Nginx代理Nacos集群

**1、** 修改Nginx安装包下的nginx.conf配置文件；

**2、** 在Java代码中的bootstrap.properties文件中配置；

```bash
#将Nacos设置为服务注册发现，默认为true
spring.cloud.nacos.discovery.enabled=true
#nacos注册中心的连接地址
#nacos单机
#spring.cloud.nacos.discovery.server-addr=192.168.133.129:8848
#nacos集群
#spring.cloud.nacos.discovery.server-addr=192.168.133.129:8801,192.168.133.129:8802,192.168.133.129:8803
#nginx部署访问nacos集群
spring.cloud.nacos.discovery.server-addr=192.168.133.129:80
#nacos的用户名和密码
spring.cloud.nacos.username=nacos
spring.cloud.nacos.password=nacos
#是否开启配置的自动刷新，默认是true表示自动刷新
spring.cloud.nacos.config.refresh-enabled=true
#nacos配置中心的连接地址
#spring.cloud.nacos.config.server-addr配置的方式为,域名:port，如 Nacos的域名为nacos.com，监听的端口为80
#则spring.cloud.nacos.config.server-addr=nacos.com:80，注 80 端口不能省略
#nacos单机
#spring.cloud.nacos.config.server-addr=192.168.133.129:8848
#nacos集群
#spring.cloud.nacos.config.server-addr=192.168.133.129:8801,192.168.133.129:8802,192.168.133.129:8803
#nginx部署访问nacos集群
spring.cloud.nacos.config.server-addr=192.168.133.129:80
```
