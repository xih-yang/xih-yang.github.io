# 04、Sharding-JDBC 实战；Sharding-JDBC实现读写分离
- 来源：https://ddkk.com/zhuanlan/sharding/shardingjdbc/4/4.html
- 分类：分库分表
- 分组：教程目录
## 1、读写分离简介

对于同一时刻有大量并发读操作和较少写操作类型的应用系统来说，将数据库拆分为主库和从库，**主库负责处理事务性的增删改操作，从库负责处理查询操作**，能够有效的避免由数据更新导致的行锁，使得整个系统的查询性能得到极大的改善。

通过一主多从的配置方式，可以将查询请求均匀的分散到多个数据副本，能够进一步的提升系统的处理能力。 使用多主多从的方式，不但能够提升系统的吞吐量，还能够提升系统的可用性，可以达到在任何一个数据库宕机，甚至磁盘物理损坏的情况下仍然不影响系统的正常运行。

读写分离的数据节点中的数据内容是一致的，而水平分片的每个数据节点的数据内容却并不相同。将水平分片和读

写分离联合使用，能够更加有效的提升系统的性能。

**Sharding-JDBC读写分离则是根据SQL语义的分析，将读操作和写操作分别路由至主库与从库。** 它提供透明化读写

分离，让使用方尽量像使用一个数据库一样使用主从数据库集群。

Sharding-JDBC提供**一主多从**的读写分离配置，可独立使用，也可配合分库分表使用，同一线程且同一数据库连接内，如有写入操作，以后的读操作均从主库读取，用于保证数据一致性。**Sharding-JDBC不提供主从数据库的数据同步功能，需要采用其他机制支持。**

## 2、读写分离实现

模拟系统使用，读写分离

将数据库分为：3306中的`test` 与 3307中的`test`

表名称：user

**1、SQL：**

```java
//创建数据表
CREATE TABLE user (
    id BIGINT(20) NOT NULL COMMENT 'Id',
    name VARCHAR(20) NOT NULL COMMENT '名称',
    phone VARCHAR(20) NOT NULL COMMENT '电话',
    email VARCHAR(20) NOT NULL COMMENT '邮箱',
    PRIMARY KEY (id)
) 
```

**2、properties配置：**

```java
#sharding-jdbc 水平分库规则配置
# 数据源名称，多数据源逗号隔开
spring.shardingsphere.datasource.names=ds0,ds1
# 配置第一个库
spring.shardingsphere.datasource.ds0.type=com.zaxxer.hikari.HikariDataSource
spring.shardingsphere.datasource.ds0.driver-class-name=com.mysql.cj.jdbc.Driver
spring.shardingsphere.datasource.ds0.jdbc-url=jdbc:mysql://127.0.0.1:3306/test?useUnicode=true&useSSL=false&zeroDateTimeBehavior=convertToNull&characterEncoding=UTF-8&allowMultiQueries=true&serverTimezone=Asia/Shanghai
spring.shardingsphere.datasource.ds0.username=root
spring.shardingsphere.datasource.ds0.password=123456
# 配置第二个库
spring.shardingsphere.datasource.ds1.type=com.zaxxer.hikari.HikariDataSource
spring.shardingsphere.datasource.ds1.driver-class-name=com.mysql.cj.jdbc.Driver
spring.shardingsphere.datasource.ds1.jdbc-url=jdbc:mysql://127.0.0.1:3307/test?useUnicode=true&useSSL=false&zeroDateTimeBehavior=convertToNull&characterEncoding=UTF-8&allowMultiQueries=true&serverTimezone=Asia/Shanghai
spring.shardingsphere.datasource.ds1.username=root
spring.shardingsphere.datasource.ds1.password=123456
# 配置主从规则
# 指定主库，ms为任意值，表主从同步别名
spring.shardingsphere.sharding.master-slave-rules.ms.master-data-source-name=ds0
# 指定从库，ms为任意值，表主从同步别名
spring.shardingsphere.sharding.master-slave-rules.ms.slave-data-source-names=ds1
# 如果既有读写分离又有数据分片，则配置规则如下：
# actual-data-nodes节点后的数据源名称要写成，主从同步数据源的别名 : ms
# spring.shardingsphere.sharding.tables.user.actual-data-nodes = ms.t_user
## 打开sql输出日志
spring.shardingsphere.props.sql.show=true
```

**3、代码实现**

> 实体：

```java
public class User implements Serializable {
    private Long id;
    private String name;
    private String phone;
    private String email;
    .....
}
```

**Controller：**

```java
@RestController
@RequestMapping("test")
public class TestController {
    // TODO DEMO配置文件中，存在多种配置策略，如何只需要对某一种类型进行测试，则需要修改配置文件配置
    @Resource
    private TestService testService;
    @GetMapping("/read/write")
    public Object dataReadWrite() {
        return testService.dataReadWrite();
    }
}
```

**Service：**

```java
@Service
public class TestService {
    @Resource
    private MasterSlaveMapper masterSlaveMapper;
    public Object dataReadWrite() {
        // 插入
        User user = new User();
        user.setId(1L);
        user.setName("Name");
        user.setPhone("phone");
        user.setEmail("email");
        masterSlaveMapper.insertMasterSlave(user);
        // 修改
        masterSlaveMapper.updateMasterSlaveById(1L, "修改名称");
        // 删除
        masterSlaveMapper.deleteMasterSlaveById(2L);
        // 查询
        List<User> users = masterSlaveMapper.listAllMasterSlave();
        return users;
    }
}
```

**Mapper**

```java
@Mapper
public interface MasterSlaveMapper {
    int insertMasterSlave(User user);
    int deleteMasterSlaveById(Long id);
    int updateMasterSlaveById(@Param("id") Long id, @Param("name") String name);
    List<User> listAllMasterSlave();
}
```

**Mapping**

```java
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.lhz.sharding.mapper.MasterSlaveMapper">
    <insert id="insertMasterSlave" parameterType="com.lhz.sharding.model.entity.User">
        insert into user(id, name, phone, email)
        values (#{id},{name},{phone},{email})
    </insert>
    <delete id="deleteMasterSlaveById">
        delete
        from user
        where id ={id}
    </delete>
    <update id="updateMasterSlaveById">
        update
            user
         set name ={name}
        where id ={id}
    </update>
    <select id="listAllMasterSlave"
            resultType="com.lhz.sharding.model.entity.User">
        select *
        from user
        order by id desc
    </select>
</mapper>
```

**4、效果：**

根据`properties`的配置内容，`ds0`对于3306端口的主库，`ds1`对于3306端口的从库，以下运行截图可以看到，新增、修改、删除操作的`ds0(主库)`，查询操作的`ds1(从库)`，所以Sharding-JDBC会字段根据SQL语义自动区分是操作主库还是从库。

**新增、修改、删除：**

**查询：**
