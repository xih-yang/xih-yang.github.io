# 06、分布式事务 实战 - TxManager 搭建
- 来源：https://ddkk.com/zhuanlan/transaction/4/6.html
- 分类：分布式事务
- 分组：教程目录
### 1.创建项目，添加依赖

- 新建项目 TxManager，并添加依赖
- 依赖包含了 Spring-boot 的依赖，版本是 2.0.5，如果希望把版本改变成 2.2.2 或其他版本只需要添加 spring-boot-starter-parent 继承即可

```java
<dependencies> 
	<dependency> 
		<groupId>com.codingapi.txlcn</groupId> 
		<artifactId>txlcn-tm</artifactId> 
		<version>5.0.2.RELEASE</version> 
	</dependency> 
</dependencies>
```

### 2.执行 SQL 文件

- 执行 tx-manager.sql 文件（在任意的数据库下执行即可）
- tx-manager.sql 在 txlcn-tm-5.0.2.RELEASE.zip 压缩包中。
- 在 MySQL 生成 tx-manager 的数据库，在数据库中新建 t_tx_exception 的表，此表用作存储事务组信息
- **注意：**
- **默认情况下 tx-manager 需要记录日志信息的**，需要在项目中配置日志连接数据库相关参数，其中日志存储数据库没有要求，可以存储到任意数据库中，当运行后会自动在数据库中生成一个日志表。**如果不希望记录日志可以直接设置 tx-lcn.logger.enabled=false**，关闭日志功能，下面的日志连接数据库参数也可以不用配置。
- 在实际案例演示中会把所有的日志记录功能关闭。如果希望记录记录日志需要把下面代码在所有引用 tx-lcn 的项目的配置文件中进行配置

```java
tx-lcn.logger.enabled=true 
tx-lcn.logger.driver-class-name=com.mysql.jdbc.Driver 
tx-lcn.logger.jdbc-url=jdbc:mysql://192.168.8.131:3306/tx-manager?characterEncoding=UTF-8 
tx-lcn.logger.username=root 
tx-lcn.logger.password=root
```

### 3.配置配置文件

- 在 TxManager 项目的 resource 下新建 application.properties。tx-lcn 在当前版本有个 bug 只能使用 properties 文件，使用 yml 文件会导致配置文件无法被加载的问题
- 配置文件中内容上半部分是 tx-manager 数据库的连接信息。中间包含 redis 连接信息（此处连接的是 redis 单机版，端口默认，没有密码），下面是关闭日志记录功能
- 小提示：
- 依赖 Redis，所以需要安装 Redis。
- 7970 是客户端访问端口，是 Txmanager 可视化界面访问端口，此端口任意。

```java
spring.application.name=TransactionManager
server.port=7970
spring.datasource.driver-class-name=com.mysql.jdbc.Driver
spring.datasource.url=jdbc:mysql://localhost:3306/tx-manager?characterEncoding=UTF-8
spring.datasource.username=root
spring.datasource.password=root
spring.redis.host=192.168.8.129
tx-lcn.logger.enabled=false
```

### 4.新建启动类

- 注意注解@EnableTrasactionManagerServer 必须有

```java
@SpringBootApplication 
@EnableTransactionManagerServer
public class MyApplication {
	public static void main(String[] args) {
		SpringApplication.run(MyApplication.class,args); 
	} 
}
```

### 5.访问管理界面

- 在浏览器输入：http://localhost:7970 访问。
- 密码默认是 codingapi
- 可以在配置文件中修改登录密码

```java
tx-lcn.manager.admin-key=dqcgm
```
