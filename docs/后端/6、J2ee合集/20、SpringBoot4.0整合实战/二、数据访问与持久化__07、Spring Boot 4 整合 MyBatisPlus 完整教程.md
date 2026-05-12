# 07、Spring Boot 4 整合 MyBatisPlus 完整教程
- 来源：https://ddkk.com/springboot/4-action/7.html
- 分类：Spring Boot 4 整合教程
- 分组：二、数据访问与持久化
- 日期：2025-12-08
用MyBatis写CRUD的时候,最烦的就是每个表都要写一堆重复的insert、update、select方法,虽然SQL和代码分离了,但是代码量还是不少;后来有了MyBatis-Plus,这些问题都解决了,它基于MyBatis做了增强,提供了BaseMapper、条件构造器、分页插件这些好东西,开发效率直接翻倍;现在Spring Boot 4出来了,整合MyBatis-Plus更是简单得不行,自动配置给你整得明明白白的,咱今天就聊聊Spring Boot 4咋整合MyBatis-Plus的。

其实MyBatis-Plus在Spring Boot里早就支持了,你只要加个`mybatis-plus-spring-boot4-starter`依赖,基本上就能用;但是很多兄弟不知道里面的门道,也不知道咋用BaseMapper、条件构造器、分页插件这些高级功能,所以鹏磊今天就给兄弟们掰扯掰扯。

## 项目搭建和环境准备

### 创建Maven项目

首先你得有个Maven项目,用IDEA或者Eclipse都行,或者直接用Spring Initializr生成;项目结构大概是这样:

```plaintext
spring-boot-mybatis-plus-demo/
├── pom.xml                          # Maven配置文件
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── example/
│   │   │           └── demo/
│   │   │               ├── Application.java          # 启动类
│   │   │               ├── mapper/                   # Mapper接口目录
│   │   │               ├── entity/                   # 实体类目录
│   │   │               ├── service/                  # 服务层目录
│   │   │               ├── controller/               # 控制器目录
│   │   │               └── config/                   # 配置类目录
│   │   └── resources/
│   │       ├── application.yml                       # 配置文件
│   │       └── mapper/                               # MyBatis XML映射文件目录(可选)
│   └── test/
│       └── java/                                     # 测试代码目录
```

### pom.xml完整配置

这是最关键的,依赖配置不对后面全是坑;Spring Boot 4需要Java 17以上,而且MyBatis-Plus从3.5.13版本开始支持Spring Boot 4。

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <!-- 继承Spring Boot父POM,统一管理版本 -->
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>4.0.0</version>  <!-- Spring Boot 4.0版本 -->
        <relativePath/>
    </parent>
    <groupId>com.example</groupId>
    <artifactId>spring-boot-mybatis-plus-demo</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    <name>Spring Boot 4 MyBatis-Plus Demo</name>
    <description>Spring Boot 4整合MyBatis-Plus示例项目</description>
    <properties>
        <java.version>17</java.version>  <!-- Java 17以上 -->
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <mybatis-plus.version>3.5.13</mybatis-plus.version>  <!-- MyBatis-Plus版本,3.5.13+支持Spring Boot 4 -->
    </properties>
    <dependencies>
        <!-- Spring Boot Web Starter: 包含Spring MVC、Tomcat等 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <!-- MyBatis-Plus Spring Boot 4 Starter: MyBatis-Plus自动配置支持 -->
        <dependency>
            <groupId>com.baomidou</groupId>
            <artifactId>mybatis-plus-spring-boot4-starter</artifactId>
            <version>${mybatis-plus.version}</version>
        </dependency>
        <!-- MySQL驱动: 数据库连接驱动 -->
        <dependency>
            <groupId>com.mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
            <scope>runtime</scope>
        </dependency>
        <!-- HikariCP连接池: Spring Boot默认使用HikariCP -->
        <dependency>
            <groupId>com.zaxxer</groupId>
            <artifactId>HikariCP</artifactId>
        </dependency>
        <!-- Spring Boot Test: 测试支持 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <!-- Lombok: 简化Java代码(可选,但强烈推荐) -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <!-- Spring Boot Maven插件: 打包和运行 -->
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

### 数据库准备

先创建个测试数据库和表,这里用MySQL举例:

```sql
-- 创建数据库
CREATE DATABASE IF NOT EXISTS mybatis_plus_demo DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mybatis_plus_demo;
-- 创建用户表
CREATE TABLE IF NOT EXISTS `user` (
    `id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `name` VARCHAR(50) NOT NULL COMMENT '用户名',
    `email` VARCHAR(100) NOT NULL COMMENT '邮箱',
    `age` INT(3) DEFAULT NULL COMMENT '年龄',
    `status` TINYINT(1) DEFAULT 1 COMMENT '状态:1-正常,0-禁用',
    `deleted` TINYINT(1) DEFAULT 0 COMMENT '逻辑删除:0-未删除,1-已删除',
    `version` INT(11) DEFAULT 0 COMMENT '乐观锁版本号',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_email` (`email`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';
-- 插入测试数据
INSERT INTO `user` (`name`, `email`, `age`, `status`) VALUES
('鹏磊', 'penglei@example.com', 30, 1),
('张三', 'zhangsan@example.com', 25, 1),
('李四', 'lisi@example.com', 28, 0);
```

### application.yml配置

Spring Boot 4的配置文件,数据源和MyBatis-Plus的配置都在这:

```yaml
spring:
  application:
    name: spring-boot-mybatis-plus-demo
  # 数据源配置
  datasource:
    driver-class-name: com.mysql.cj.jdbc.Driver  # MySQL 8.0+驱动
    url: jdbc:mysql://localhost:3306/mybatis_plus_demo?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true
    username: root  # 数据库用户名
    password: 123456  # 数据库密码
    # HikariCP连接池配置
    hikari:
      maximum-pool-size: 20  # 最大连接数
      minimum-idle: 5  # 最小空闲连接数
      connection-timeout: 30000  # 连接超时时间(毫秒)
      idle-timeout: 600000  # 空闲连接超时时间(毫秒)
      max-lifetime: 1800000  # 连接最大生命周期(毫秒)
# MyBatis-Plus配置
mybatis-plus:
  # XML映射文件位置(可选,如果只用BaseMapper可以不配置)
  mapper-locations: classpath:mapper/*.xml
  # 实体类包路径(用于类型别名)
  type-aliases-package: com.example.demo.entity
  # MyBatis配置项
  configuration:
    # 开启驼峰命名转换(数据库字段user_name -> Java属性userName)
    map-underscore-to-camel-case: true
    # 开启二级缓存
    cache-enabled: true
    # 日志实现(可选:SLF4J、LOG4J2、STDOUT_LOGGING等)
    log-impl: org.apache.ibatis.logging.slf4j.Slf4jImpl
  # 全局配置
  global-config:
    # 数据库配置
    db-config:
      # 主键生成策略:auto-数据库自增,assign_id-雪花算法,assign_uuid-UUID
      id-type: auto
      # 逻辑删除字段名
      logic-delete-field: deleted
      # 逻辑删除值(已删除)
      logic-delete-value: 1
      # 逻辑未删除值(未删除)
      logic-not-delete-value: 0
      # 表名下划线命名(默认false,表名user -> User)
      table-underline: false
# 日志配置
logging:
  level:
    root: INFO
    com.example.demo: DEBUG  # 项目包日志级别
    com.baomidou.mybatisplus: DEBUG  # MyBatis-Plus日志级别
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
# 服务器配置
server:
  port: 8080  # 服务端口
```

## 创建实体类和Mapper接口

### 实体类

先创建个User实体类,对应数据库的user表;MyBatis-Plus的实体类需要加一些注解:

```java
package com.example.demo.entity;
import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;
/**
 * 用户实体类
 * 对应数据库user表
 * @TableName注解指定表名(如果表名和类名不一致需要指定)
 */
@Data  // Lombok注解,自动生成getter/setter/toString等方法
@TableName("user")  // 指定表名,如果表名和类名一致可以省略
public class User {
    /**
     * 主键ID
     * @TableId注解标识主键
     * type = IdType.AUTO表示使用数据库自增主键
     */
    @TableId(type = IdType.AUTO)
    private Long id;
    /**
     * 用户名
     */
    private String name;
    /**
     * 邮箱
     */
    private String email;
    /**
     * 年龄
     */
    private Integer age;
    /**
     * 状态:1-正常,0-禁用
     */
    private Integer status;
    /**
     * 逻辑删除字段
     * @TableLogic注解标识逻辑删除字段
     * 删除时会自动更新这个字段的值
     */
    @TableLogic
    private Integer deleted;
    /**
     * 乐观锁版本号
     * @Version注解标识乐观锁字段
     * 更新时会自动检查版本号
     */
    @Version
    private Integer version;
    /**
     * 创建时间
     * @TableField注解可以指定字段映射
     * fill = FieldFill.INSERT表示插入时自动填充
     */
    @TableField(value = "created_at", fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    /**
     * 更新时间
     * fill = FieldFill.INSERT_UPDATE表示插入和更新时自动填充
     */
    @TableField(value = "updated_at", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
```

### Mapper接口(BaseMapper)

MyBatis-Plus最核心的就是BaseMapper,它提供了基本的CRUD方法,你只需要继承它就行,不用写SQL:

```java
package com.example.demo.mapper;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.demo.entity.User;
import org.apache.ibatis.annotations.Mapper;
/**
 * 用户Mapper接口
 * 继承BaseMapper后,自动拥有以下方法:
 * - insert: 插入一条记录
 * - deleteById: 根据ID删除
 * - updateById: 根据ID更新
 * - selectById: 根据ID查询
 * - selectList: 查询所有
 * - selectBatchIds: 根据ID批量查询
 * - selectCount: 查询总数
 * - 等等...
 */
@Mapper  // 标识这是一个Mapper接口
public interface UserMapper extends BaseMapper<User> {
    // 如果只需要基本的CRUD,继承BaseMapper就够了,不需要写任何方法
    // 如果需要自定义复杂查询,可以在这里定义方法,然后在XML中写SQL
    // 例如:
    // List<User> selectCustomUsers(@Param("name") String name);
}
```

### 自动填充配置

如果需要在插入和更新时自动填充创建时间、更新时间这些字段,需要配置一个MetaObjectHandler:

```java
package com.example.demo.config;
import com.baomidou.mybatisplus.core.handlers.MetaObjectHandler;
import org.apache.ibatis.reflection.MetaObject;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;
/**
 * MyBatis-Plus自动填充处理器
 * 实现MetaObjectHandler接口,在插入和更新时自动填充字段
 */
@Component
public class MyMetaObjectHandler implements MetaObjectHandler {
    /**
     * 插入时自动填充
     * 当实体类字段上有@TableField(fill = FieldFill.INSERT)时触发
     */
    @Override
    public void insertFill(MetaObject metaObject) {
        // 自动填充创建时间
        this.strictInsertFill(metaObject, "createdAt", LocalDateTime.class, LocalDateTime.now());
        // 自动填充更新时间
        this.strictInsertFill(metaObject, "updatedAt", LocalDateTime.class, LocalDateTime.now());
    }
    /**
     * 更新时自动填充
     * 当实体类字段上有@TableField(fill = FieldFill.INSERT_UPDATE)时触发
     */
    @Override
    public void updateFill(MetaObject metaObject) {
        // 自动填充更新时间
        this.strictUpdateFill(metaObject, "updatedAt", LocalDateTime.class, LocalDateTime.now());
    }
}
```

## Service层(IService)

MyBatis-Plus还提供了IService接口和ServiceImpl实现类,封装了更多业务方法:

### Service接口

```java
package com.example.demo.service;
import com.baomidou.mybatisplus.extension.service.IService;
import com.example.demo.entity.User;
/**
 * 用户服务接口
 * 继承IService后,自动拥有以下方法:
 * - save: 保存一条记录
 * - saveBatch: 批量保存
 * - removeById: 根据ID删除
 * - updateById: 根据ID更新
 * - getById: 根据ID查询
 * - list: 查询所有
 * - page: 分页查询
 * - count: 查询总数
 * - 等等...
 */
public interface UserService extends IService<User> {
    // 如果只需要基本的CRUD,继承IService就够了
    // 如果需要自定义业务方法,可以在这里定义
    // 例如:
    // List<User> getActiveUsers();
}
```

### Service实现类

```java
package com.example.demo.service.impl;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.demo.entity.User;
import com.example.demo.mapper.UserMapper;
import com.example.demo.service.UserService;
import org.springframework.stereotype.Service;
/**
 * 用户服务实现类
 * 继承ServiceImpl后,自动拥有IService的所有方法实现
 * 不需要写任何代码就能用
 */
@Service
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements UserService {
    // 如果只需要基本的CRUD,继承ServiceImpl就够了,不需要写任何代码
    // 如果需要自定义业务方法,可以在这里实现
    // 例如:
    // @Override
    // public List<User> getActiveUsers() {
    //     return this.list(new LambdaQueryWrapper<User>().eq(User::getStatus, 1));
    // }
}
```

## 条件构造器

MyBatis-Plus最强大的功能就是条件构造器,可以用链式调用的方式构建查询条件,不用写SQL:

### QueryWrapper(普通方式)

```java
package com.example.demo.service.impl;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.example.demo.entity.User;
import com.example.demo.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
@Service
public class UserQueryService {
    @Autowired
    private UserMapper userMapper;
    /**
     * 根据条件查询用户
     * QueryWrapper是普通方式,需要写字段名(字符串)
     */
    public List<User> queryUsers() {
        // 创建查询条件构造器
        QueryWrapper<User> wrapper = new QueryWrapper<>();
        // 等于条件: WHERE name = '鹏磊'
        wrapper.eq("name", "鹏磊");
        // 不等于条件: WHERE status != 0
        wrapper.ne("status", 0);
        // 大于条件: WHERE age > 18
        wrapper.gt("age", 18);
        // 大于等于条件: WHERE age >= 18
        wrapper.ge("age", 18);
        // 小于条件: WHERE age < 60
        wrapper.lt("age", 60);
        // 小于等于条件: WHERE age <= 60
        wrapper.le("age", 60);
        // LIKE条件: WHERE name LIKE '%张%'
        wrapper.like("name", "张");
        // 左LIKE: WHERE name LIKE '张%'
        wrapper.likeLeft("name", "张");
        // 右LIKE: WHERE name LIKE '%张'
        wrapper.likeRight("name", "张");
        // IN条件: WHERE id IN (1, 2, 3)
        wrapper.in("id", 1, 2, 3);
        // NOT IN条件: WHERE id NOT IN (1, 2, 3)
        wrapper.notIn("id", 1, 2, 3);
        // IS NULL条件: WHERE email IS NULL
        wrapper.isNull("email");
        // IS NOT NULL条件: WHERE email IS NOT NULL
        wrapper.isNotNull("email");
        // BETWEEN条件: WHERE age BETWEEN 18 AND 60
        wrapper.between("age", 18, 60);
        // 排序: ORDER BY id DESC
        wrapper.orderByDesc("id");
        // 限制条数: LIMIT 10
        wrapper.last("LIMIT 10");
        // 执行查询
        return userMapper.selectList(wrapper);
    }
    /**
     * 复杂条件查询示例
     */
    public List<User> complexQuery() {
        QueryWrapper<User> wrapper = new QueryWrapper<>();
        // AND条件: WHERE name = '鹏磊' AND status = 1
        wrapper.eq("name", "鹏磊")
               .eq("status", 1);
        // OR条件: WHERE name = '鹏磊' OR name = '张三'
        wrapper.eq("name", "鹏磊")
               .or()
               .eq("name", "张三");
        // 嵌套条件: WHERE (name = '鹏磊' OR name = '张三') AND status = 1
        wrapper.and(w -> w.eq("name", "鹏磊").or().eq("name", "张三"))
               .eq("status", 1);
        // 分组: GROUP BY status
        wrapper.groupBy("status");
        // HAVING: HAVING COUNT(*) > 1
        wrapper.having("COUNT(*) > 1");
        return userMapper.selectList(wrapper);
    }
}
```

### LambdaQueryWrapper(推荐方式)

LambdaQueryWrapper是类型安全的,推荐用这个,编译时就能检查字段名对不对:

```java
package com.example.demo.service.impl;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.demo.entity.User;
import com.example.demo.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
@Service
public class UserLambdaQueryService {
    @Autowired
    private UserMapper userMapper;
    /**
     * 使用LambdaQueryWrapper查询
     * 类型安全,编译时检查,推荐使用
     */
    public List<User> queryUsersWithLambda() {
        // 创建Lambda查询条件构造器
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        // 等于条件: WHERE name = '鹏磊'
        // User::getName是方法引用,类型安全
        wrapper.eq(User::getName, "鹏磊");
        // 不等于条件: WHERE status != 0
        wrapper.ne(User::getStatus, 0);
        // 大于条件: WHERE age > 18
        wrapper.gt(User::getAge, 18);
        // LIKE条件: WHERE name LIKE '%张%'
        wrapper.like(User::getName, "张");
        // IN条件: WHERE id IN (1, 2, 3)
        wrapper.in(User::getId, 1, 2, 3);
        // 排序: ORDER BY id DESC
        wrapper.orderByDesc(User::getId);
        // 执行查询
        return userMapper.selectList(wrapper);
    }
    /**
     * 复杂Lambda查询示例
     */
    public List<User> complexLambdaQuery() {
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        // AND条件: WHERE name = '鹏磊' AND status = 1 AND age > 18
        wrapper.eq(User::getName, "鹏磊")
               .eq(User::getStatus, 1)
               .gt(User::getAge, 18);
        // OR条件: WHERE (name = '鹏磊' OR name = '张三') AND status = 1
        wrapper.and(w -> w.eq(User::getName, "鹏磊")
                          .or()
                          .eq(User::getName, "张三"))
               .eq(User::getStatus, 1);
        // 多字段排序: ORDER BY status DESC, id ASC
        wrapper.orderByDesc(User::getStatus)
               .orderByAsc(User::getId);
        return userMapper.selectList(wrapper);
    }
}
```

### UpdateWrapper(更新条件)

更新时也可以用条件构造器:

```java
package com.example.demo.service.impl;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.example.demo.entity.User;
import com.example.demo.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
@Service
public class UserUpdateService {
    @Autowired
    private UserMapper userMapper;
    /**
     * 使用UpdateWrapper更新
     */
    public void updateUsers() {
        // 普通方式
        UpdateWrapper<User> wrapper = new UpdateWrapper<>();
        wrapper.eq("status", 0)
               .set("status", 1);
        userMapper.update(null, wrapper);
        // Lambda方式(推荐)
        LambdaUpdateWrapper<User> lambdaWrapper = new LambdaUpdateWrapper<>();
        lambdaWrapper.eq(User::getStatus, 0)
                    .set(User::getStatus, 1);
        userMapper.update(null, lambdaWrapper);
    }
}
```

## 分页插件配置

MyBatis-Plus提供了强大的分页插件,配置后就可以用分页功能了:

```java
package com.example.demo.config;
import com.baomidou.mybatisplus.annotation.DbType;
import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
/**
 * MyBatis-Plus配置类
 * 配置分页插件、乐观锁插件等
 */
@Configuration
public class MybatisPlusConfig {
    /**
     * 配置MyBatis-Plus拦截器
     * 可以添加多个插件:分页、乐观锁、性能分析等
     */
    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        // 添加分页插件
        // DbType.MYSQL指定数据库类型,MyBatis-Plus会根据数据库类型生成不同的分页SQL
        PaginationInnerInterceptor paginationInterceptor = new PaginationInnerInterceptor(DbType.MYSQL);
        // 设置单页分页条数限制,默认无限制
        paginationInterceptor.setMaxLimit(500L);
        // 设置溢出总页数后处理:true-继续请求,false-不再请求
        paginationInterceptor.setOverflow(false);
        interceptor.addInnerInterceptor(paginationInterceptor);
        return interceptor;
    }
}
```

### 分页查询使用

配置好分页插件后,就可以用分页功能了:

```java
package com.example.demo.service.impl;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.demo.entity.User;
import com.example.demo.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
@Service
public class UserPageService {
    @Autowired
    private UserMapper userMapper;
    /**
     * 分页查询用户
     * Page是MyBatis-Plus提供的分页对象
     */
    public IPage<User> pageUsers(int current, int size) {
        // 创建分页对象:当前页1,每页10条
        Page<User> page = new Page<>(current, size);
        // 执行分页查询
        // selectPage方法会自动进行分页,返回IPage对象
        IPage<User> result = userMapper.selectPage(page, null);
        // 获取分页数据
        List<User> records = result.getRecords();  // 当前页的数据
        long total = result.getTotal();  // 总记录数
        long pages = result.getPages();  // 总页数
        long currentPage = result.getCurrent();  // 当前页
        long pageSize = result.getSize();  // 每页条数
        return result;
    }
    /**
     * 带条件的分页查询
     */
    public IPage<User> pageUsersWithCondition(int current, int size, String name) {
        // 创建分页对象
        Page<User> page = new Page<>(current, size);
        // 创建查询条件
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(User::getName, name)
               .eq(User::getStatus, 1);
        // 执行分页查询
        IPage<User> result = userMapper.selectPage(page, wrapper);
        return result;
    }
    /**
     * 使用Service的分页方法(更简单)
     */
    @Autowired
    private UserService userService;
    public IPage<User> pageUsersWithService(int current, int size) {
        // 创建分页对象
        Page<User> page = new Page<>(current, size);
        // 使用Service的分页方法
        IPage<User> result = userService.page(page);
        return result;
    }
}
```

## Controller层

```java
package com.example.demo.controller;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.demo.entity.User;
import com.example.demo.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
/**
 * 用户控制器
 */
@RestController
@RequestMapping("/api/users")
public class UserController {
    @Autowired
    private UserService userService;
    /**
     * 根据ID查询用户
     * GET /api/users/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        User user = userService.getById(id);
        if (user != null) {
            return ResponseEntity.ok(user);
        }
        return ResponseEntity.notFound().build();
    }
    /**
     * 查询所有用户
     * GET /api/users
     */
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userService.list();
        return ResponseEntity.ok(users);
    }
    /**
     * 条件查询用户
     * GET /api/users/search?name=xxx&status=1
     */
    @GetMapping("/search")
    public ResponseEntity<List<User>> searchUsers(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Integer status) {
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        if (name != null) {
            wrapper.like(User::getName, name);
        }
        if (status != null) {
            wrapper.eq(User::getStatus, status);
        }
        List<User> users = userService.list(wrapper);
        return ResponseEntity.ok(users);
    }
    /**
     * 分页查询用户
     * GET /api/users/page?current=1&size=10
     */
    @GetMapping("/page")
    public ResponseEntity<IPage<User>> pageUsers(
            @RequestParam(defaultValue = "1") int current,
            @RequestParam(defaultValue = "10") int size) {
        Page<User> page = new Page<>(current, size);
        IPage<User> result = userService.page(page);
        return ResponseEntity.ok(result);
    }
    /**
     * 创建用户
     * POST /api/users
     */
    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User user) {
        boolean success = userService.save(user);
        if (success) {
            return ResponseEntity.ok(user);
        }
        return ResponseEntity.badRequest().build();
    }
    /**
     * 更新用户
     * PUT /api/users/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User user) {
        user.setId(id);
        boolean success = userService.updateById(user);
        if (success) {
            return ResponseEntity.ok(userService.getById(id));
        }
        return ResponseEntity.badRequest().build();
    }
    /**
     * 删除用户(逻辑删除)
     * DELETE /api/users/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        boolean success = userService.removeById(id);
        if (success) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.badRequest().build();
    }
}
```

## 启动类和Mapper扫描配置

```java
package com.example.demo;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
/**
 * Spring Boot 4应用启动类
 * @MapperScan注解扫描指定包下的所有Mapper接口
 */
@SpringBootApplication
@MapperScan("com.example.demo.mapper")
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
        System.out.println("Spring Boot 4 MyBatis-Plus应用启动成功!");
    }
}
```

## 最佳实践和注意事项

### 1. BaseMapper vs IService

- **BaseMapper**: 提供基本的CRUD方法,适合简单的数据访问层
- **IService**: 提供更多业务方法(批量操作、分页等),适合业务层

### 2. QueryWrapper vs LambdaQueryWrapper

- **QueryWrapper**: 需要写字符串字段名,容易出错,不推荐
- **LambdaQueryWrapper**: 类型安全,编译时检查,推荐使用

### 3. 逻辑删除

配置逻辑删除后,删除操作会变成更新操作,不会真正删除数据:

```java
// 配置了逻辑删除后
userService.removeById(1L);  // 实际执行: UPDATE user SET deleted = 1 WHERE id = 1
// 查询时会自动过滤已删除的数据
userService.list();  // 实际执行: SELECT * FROM user WHERE deleted = 0
```

### 4. 乐观锁

配置乐观锁后,更新时会自动检查版本号,防止并发更新冲突:

```java
// 更新时会自动检查version字段
User user = userService.getById(1L);
user.setName("新名字");
userService.updateById(user);  // 实际执行: UPDATE user SET name = '新名字', version = version + 1 WHERE id = 1 AND version = 原版本号
```

### 5. 性能优化

- 批量操作用`saveBatch`、`updateBatchById`等方法,不要循环调用单条操作
- 分页查询时合理设置`maxLimit`,避免一次查询太多数据
- 复杂查询可以考虑用XML方式,性能更好

### 6. 批量操作

MyBatis-Plus提供了高效的批量操作方法,比循环单条操作性能好得多:

```java
package com.example.demo.service.impl;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.demo.entity.User;
import com.example.demo.mapper.UserMapper;
import com.example.demo.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.List;
/**
 * 批量操作示例
 */
@Service
public class UserBatchService extends ServiceImpl<UserMapper, User> implements UserService {
    /**
     * 批量保存用户
     * saveBatch方法会自动分批处理,默认每批1000条
     */
    @Transactional
    public void batchSaveUsers() {
        List<User> users = new ArrayList<>();
        for (int i = 0; i < 5000; i++) {
            User user = new User();
            user.setName("用户" + i);
            user.setEmail("user" + i + "@example.com");
            user.setAge(20 + i % 40);
            users.add(user);
        }
        // 批量保存,自动分批处理
        // 参数说明: saveBatch(数据列表, 每批数量)
        this.saveBatch(users, 1000);  // 每批1000条
    }
    /**
     * 批量更新用户
     * updateBatchById方法会根据ID批量更新
     */
    @Transactional
    public void batchUpdateUsers(List<User> users) {
        // 批量更新,自动分批处理
        this.updateBatchById(users, 1000);
    }
    /**
     * 批量删除用户
     * removeByIds方法会根据ID批量删除(逻辑删除)
     */
    @Transactional
    public void batchDeleteUsers(List<Long> ids) {
        // 批量删除
        this.removeByIds(ids);
    }
    /**
     * 批量保存或更新
     * saveOrUpdateBatch方法会根据ID判断是新增还是更新
     */
    @Transactional
    public void batchSaveOrUpdate(List<User> users) {
        // 批量保存或更新
        this.saveOrUpdateBatch(users, 1000);
    }
}
```

### 7. 代码生成器

MyBatis-Plus提供了强大的代码生成器,可以根据数据库表自动生成实体类、Mapper、Service、Controller等代码,大大提高开发效率:

```java
package com.example.demo.generator;
import com.baomidou.mybatisplus.generator.FastAutoGenerator;
import com.baomidou.mybatisplus.generator.config.OutputFile;
import com.baomidou.mybatisplus.generator.engine.FreemarkerTemplateEngine;
import java.util.Collections;
/**
 * MyBatis-Plus代码生成器
 * 运行main方法即可生成代码
 */
public class CodeGenerator {
    public static void main(String[] args) {
        // 数据库连接配置
        String url = "jdbc:mysql://localhost:3306/mybatis_plus_demo?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai";
        String username = "root";
        String password = "123456";
        // 代码生成器配置
        FastAutoGenerator.create(url, username, password)
                // 全局配置
                .globalConfig(builder -> {
                    builder.author("鹏磊")  // 作者
                           .outputDir(System.getProperty("user.dir") + "/src/main/java")  // 输出目录
                           .fileOverride()  // 覆盖已生成文件
                           .disableOpenDir();  // 生成后不打开文件夹
                })
                // 包配置
                .packageConfig(builder -> {
                    builder.parent("com.example.demo")  // 父包名
                           .moduleName("")  // 模块名(可选)
                           .pathInfo(Collections.singletonMap(OutputFile.xml, 
                                   System.getProperty("user.dir") + "/src/main/resources/mapper"));  // XML输出目录
                })
                // 策略配置
                .strategyConfig(builder -> {
                    builder.addInclude("user", "order", "product")  // 要生成的表名
                           .entityBuilder()
                               .enableLombok()  // 启用Lombok
                               .enableFileOverride()  // 覆盖已生成文件
                               .logicDeleteColumnName("deleted")  // 逻辑删除字段
                               .versionColumnName("version")  // 乐观锁字段
                           .mapperBuilder()
                               .enableBaseResultMap()  // 启用BaseResultMap
                               .enableBaseColumnList()  // 启用BaseColumnList
                           .serviceBuilder()
                               .formatServiceFileName("%sService")  // Service文件名格式
                               .formatServiceImplFileName("%sServiceImpl")  // ServiceImpl文件名格式
                           .controllerBuilder()
                               .enableRestStyle()  // 启用REST风格
                               .enableHyphenStyle();  // 启用驼峰转连字符
                })
                // 模板引擎
                .templateEngine(new FreemarkerTemplateEngine())
                // 执行生成
                .execute();
    }
}
```

### 8. 多数据源配置

如果项目需要连接多个数据库,可以配置多数据源:

```java
package com.example.demo.config;
import com.baomidou.mybatisplus.extension.spring.MybatisSqlSessionFactoryBean;
import org.apache.ibatis.session.SqlSessionFactory;
import org.mybatis.spring.SqlSessionTemplate;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import javax.sql.DataSource;
/**
 * 多数据源配置
 */
@Configuration
public class MultiDataSourceConfig {
    /**
     * 主数据源(默认)
     */
    @Primary
    @Bean(name = "primaryDataSource")
    @ConfigurationProperties(prefix = "spring.datasource.primary")
    public DataSource primaryDataSource() {
        return DataSourceBuilder.create().build();
    }
    /**
     * 从数据源
     */
    @Bean(name = "secondaryDataSource")
    @ConfigurationProperties(prefix = "spring.datasource.secondary")
    public DataSource secondaryDataSource() {
        return DataSourceBuilder.create().build();
    }
    /**
     * 主数据源SqlSessionFactory
     */
    @Primary
    @Bean(name = "primarySqlSessionFactory")
    public SqlSessionFactory primarySqlSessionFactory(@Qualifier("primaryDataSource") DataSource dataSource) throws Exception {
        MybatisSqlSessionFactoryBean sessionFactory = new MybatisSqlSessionFactoryBean();
        sessionFactory.setDataSource(dataSource);
        sessionFactory.setMapperLocations(new PathMatchingResourcePatternResolver()
                .getResources("classpath:mapper/primary/*.xml"));
        return sessionFactory.getObject();
    }
    /**
     * 从数据源SqlSessionFactory
     */
    @Bean(name = "secondarySqlSessionFactory")
    public SqlSessionFactory secondarySqlSessionFactory(@Qualifier("secondaryDataSource") DataSource dataSource) throws Exception {
        MybatisSqlSessionFactoryBean sessionFactory = new MybatisSqlSessionFactoryBean();
        sessionFactory.setDataSource(dataSource);
        sessionFactory.setMapperLocations(new PathMatchingResourcePatternResolver()
                .getResources("classpath:mapper/secondary/*.xml"));
        return sessionFactory.getObject();
    }
    /**
     * 主数据源SqlSessionTemplate
     */
    @Primary
    @Bean(name = "primarySqlSessionTemplate")
    public SqlSessionTemplate primarySqlSessionTemplate(@Qualifier("primarySqlSessionFactory") SqlSessionFactory sqlSessionFactory) {
        return new SqlSessionTemplate(sqlSessionFactory);
    }
    /**
     * 从数据源SqlSessionTemplate
     */
    @Bean(name = "secondarySqlSessionTemplate")
    public SqlSessionTemplate secondarySqlSessionTemplate(@Qualifier("secondarySqlSessionFactory") SqlSessionFactory sqlSessionFactory) {
        return new SqlSessionTemplate(sqlSessionFactory);
    }
}
```

### 9. 字段自动填充增强

除了时间字段,还可以填充其他字段,比如创建人、更新人等:

```java
package com.example.demo.config;
import com.baomidou.mybatisplus.core.handlers.MetaObjectHandler;
import org.apache.ibatis.reflection.MetaObject;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;
/**
 * 字段自动填充处理器(增强版)
 */
@Component
public class EnhancedMetaObjectHandler implements MetaObjectHandler {
    /**
     * 获取当前用户ID(实际应该从SecurityContext或ThreadLocal获取)
     */
    private Long getCurrentUserId() {
        // 简化处理,实际应该从SecurityContext获取
        return 1L;
    }
    @Override
    public void insertFill(MetaObject metaObject) {
        // 填充创建时间
        this.strictInsertFill(metaObject, "createdAt", LocalDateTime.class, LocalDateTime.now());
        // 填充更新时间
        this.strictInsertFill(metaObject, "updatedAt", LocalDateTime.class, LocalDateTime.now());
        // 填充创建人
        this.strictInsertFill(metaObject, "createdBy", Long.class, getCurrentUserId());
        // 填充更新人
        this.strictInsertFill(metaObject, "updatedBy", Long.class, getCurrentUserId());
    }
    @Override
    public void updateFill(MetaObject metaObject) {
        // 填充更新时间
        this.strictUpdateFill(metaObject, "updatedAt", LocalDateTime.class, LocalDateTime.now());
        // 填充更新人
        this.strictUpdateFill(metaObject, "updatedBy", Long.class, getCurrentUserId());
    }
}
```

### 10. 复杂查询示例

实际项目中经常需要复杂的查询,这里给几个例子:

```java
package com.example.demo.service.impl;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.demo.entity.User;
import com.example.demo.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
/**
 * 复杂查询示例
 */
@Service
public class ComplexQueryService {
    @Autowired
    private UserMapper userMapper;
    /**
     * 多条件组合查询
     */
    public List<User> complexQuery(String name, Integer minAge, Integer maxAge, Integer status) {
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        // 姓名模糊查询
        if (name != null && !name.isEmpty()) {
            wrapper.like(User::getName, name);
        }
        // 年龄范围查询
        if (minAge != null && maxAge != null) {
            wrapper.between(User::getAge, minAge, maxAge);
        } else if (minAge != null) {
            wrapper.ge(User::getAge, minAge);
        } else if (maxAge != null) {
            wrapper.le(User::getAge, maxAge);
        }
        // 状态查询
        if (status != null) {
            wrapper.eq(User::getStatus, status);
        }
        // 排序:先按状态降序,再按ID升序
        wrapper.orderByDesc(User::getStatus)
               .orderByAsc(User::getId);
        return userMapper.selectList(wrapper);
    }
    /**
     * 子查询示例
     */
    public List<User> subQueryExample() {
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        // 使用inSql进行子查询
        // SELECT * FROM user WHERE id IN (SELECT user_id FROM orders WHERE amount > 1000)
        wrapper.inSql(User::getId, "SELECT user_id FROM orders WHERE amount > 1000");
        return userMapper.selectList(wrapper);
    }
    /**
     * 分组查询(需要自定义SQL)
     */
    public List<User> groupByQuery() {
        // 分组查询通常需要自定义SQL,在Mapper中定义方法
        // 这里只是示例,实际应该在Mapper中写SQL
        return userMapper.selectList(null);
    }
    /**
     * 批量更新示例
     */
    public void batchUpdateStatus(List<Long> ids, Integer status) {
        LambdaUpdateWrapper<User> wrapper = new LambdaUpdateWrapper<>();
        wrapper.in(User::getId, ids)
               .set(User::getStatus, status);
        userMapper.update(null, wrapper);
    }
    /**
     * 分页查询带统计
     */
    public IPage<User> pageWithStats(int current, int size) {
        Page<User> page = new Page<>(current, size);
        IPage<User> result = userMapper.selectPage(page, null);
        // 可以在这里添加统计逻辑
        // 比如统计总用户数、活跃用户数等
        return result;
    }
}
```

### 11. 性能优化建议

1. **批量操作**: 使用`saveBatch`、`updateBatchById`等方法,不要循环调用单条操作
2. **分页查询**: 合理设置`maxLimit`,避免一次查询太多数据
3. **索引优化**: 为常用查询字段添加数据库索引
4. **字段选择**: 使用`selectMaps`或`selectObjs`只查询需要的字段
5. **缓存使用**: 合理使用MyBatis二级缓存
6. **连接池配置**: 根据实际并发量配置合适的连接池大小

### 12. 常见问题解决

1. **分页不生效**: 检查是否配置了`MybatisPlusInterceptor`和`PaginationInnerInterceptor`
2. **逻辑删除不工作**: 检查`@TableLogic`注解和全局配置是否正确
3. **乐观锁不生效**: 检查`@Version`注解和拦截器配置
4. **字段自动填充不工作**: 检查`MetaObjectHandler`是否注册为Spring Bean
5. **条件构造器报错**: 检查字段名是否正确,推荐使用`LambdaQueryWrapper`

## 总结

Spring Boot 4整合MyBatis-Plus其实挺简单的,主要就这几步:

1. **加依赖**:`mybatis-plus-spring-boot4-starter`(注意版本要3.5.13+)
2. **配数据源**:在`application.yml`里配置数据库连接
3. **写实体类**:加`@TableName`、`@TableId`、`@TableLogic`等注解
4. **写Mapper**:继承`BaseMapper`,基本CRUD不用写SQL
5. **写Service**:继承`IService`和`ServiceImpl`,更多业务方法
6. **用条件构造器**:`LambdaQueryWrapper`链式调用,类型安全
7. **配分页插件**:`MybatisPlusInterceptor`添加`PaginationInnerInterceptor`
8. **批量操作**:使用`saveBatch`、`updateBatchById`提高性能
9. **代码生成**:使用代码生成器快速生成基础代码
10. **性能优化**:合理使用批量操作、分页、索引等

MyBatis-Plus最大的优势就是减少了大量重复代码,基本CRUD不用写SQL,条件查询用链式调用,分页、逻辑删除、乐观锁这些功能都内置了,开发效率直接翻倍;而且代码生成器能自动生成实体类、Mapper、Service、Controller,进一步提高了开发效率。

兄弟们要是遇到啥问题,比如分页不生效、逻辑删除不工作、条件构造器报错这些,先检查配置对不对,再看日志输出,基本上都能解决;实在不行就看看官方文档,MyBatis-Plus的文档还是挺详细的。

好了,今天就聊到这,兄弟们有啥问题欢迎留言讨论!
