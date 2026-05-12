# 06、Spring Boot 4 整合 MyBatis 完整教程
- 来源：https://ddkk.com/springboot/4-action/6.html
- 分类：Spring Boot 4 整合教程
- 分组：二、数据访问与持久化
- 日期：2025-12-08
搞Java开发的时候,最烦的就是写JDBC那一堆模板代码,什么Connection、PreparedStatement、ResultSet,整得人头大;后来有了MyBatis,SQL和Java代码分离,写起来舒服多了;现在Spring Boot 4出来了,整合MyBatis更是简单得不行,自动配置给你整得明明白白的,咱今天就聊聊Spring Boot 4咋整合MyBatis的。

其实MyBatis在Spring Boot里早就支持了,你只要加个`mybatis-spring-boot-starter`依赖,基本上就能用;但是很多兄弟不知道里面的门道,也不知道咋配置XML映射文件、事务管理这些高级功能,所以鹏磊今天就给兄弟们掰扯掰扯。

## 项目搭建和环境准备

### 创建Maven项目

首先你得有个Maven项目,用IDEA或者Eclipse都行,或者直接用Spring Initializr生成;项目结构大概是这样:

```plaintext
spring-boot-mybatis-demo/
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
│   │   │               └── controller/               # 控制器目录
│   │   └── resources/
│   │       ├── application.yml                       # 配置文件
│   │       ├── mapper/                               # MyBatis XML映射文件目录
│   │       │   └── UserMapper.xml
│   │       └── mybatis-config.xml                    # MyBatis全局配置(可选)
│   └── test/
│       └── java/                                     # 测试代码目录
```

### pom.xml完整配置

这是最关键的,依赖配置不对后面全是坑;Spring Boot 4需要Java 17以上,JDK版本别搞错了。

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
    <artifactId>spring-boot-mybatis-demo</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    <name>Spring Boot 4 MyBatis Demo</name>
    <description>Spring Boot 4整合MyBatis示例项目</description>
    <properties>
        <java.version>17</java.version>  <!-- Java 17以上 -->
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <mybatis.version>3.5.16</mybatis.version>  <!-- MyBatis版本 -->
    </properties>
    <dependencies>
        <!-- Spring Boot Web Starter: 包含Spring MVC、Tomcat等 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <!-- MyBatis Spring Boot Starter: MyBatis自动配置支持 -->
        <dependency>
            <groupId>org.mybatis.spring.boot</groupId>
            <artifactId>mybatis-spring-boot-starter</artifactId>
            <version>3.0.3</version>  <!-- 适配Spring Boot 4 -->
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
CREATE DATABASE IF NOT EXISTS mybatis_demo DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mybatis_demo;
-- 创建用户表
CREATE TABLE IF NOT EXISTS `user` (
    `id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `name` VARCHAR(50) NOT NULL COMMENT '用户名',
    `email` VARCHAR(100) NOT NULL COMMENT '邮箱',
    `age` INT(3) DEFAULT NULL COMMENT '年龄',
    `status` TINYINT(1) DEFAULT 1 COMMENT '状态:1-正常,0-禁用',
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

Spring Boot 4的配置文件,数据源和MyBatis的配置都在这:

```yaml
spring:
  application:
    name: spring-boot-mybatis-demo
  # 数据源配置
  datasource:
    driver-class-name: com.mysql.cj.jdbc.Driver  # MySQL 8.0+驱动
    url: jdbc:mysql://localhost:3306/mybatis_demo?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true
    username: root  # 数据库用户名
    password: 123456  # 数据库密码
    # HikariCP连接池配置
    hikari:
      maximum-pool-size: 20  # 最大连接数
      minimum-idle: 5  # 最小空闲连接数
      connection-timeout: 30000  # 连接超时时间(毫秒)
      idle-timeout: 600000  # 空闲连接超时时间(毫秒)
      max-lifetime: 1800000  # 连接最大生命周期(毫秒)
# MyBatis配置
mybatis:
  # XML映射文件位置
  mapper-locations: classpath:mapper/*.xml
  # 实体类包路径(用于类型别名)
  type-aliases-package: com.example.demo.entity
  # MyBatis全局配置文件(可选)
  config-location: classpath:mybatis-config.xml
  # MyBatis配置项
  configuration:
    # 开启驼峰命名转换(数据库字段user_name -> Java属性userName)
    map-underscore-to-camel-case: true
    # 开启二级缓存
    cache-enabled: true
    # 延迟加载开关
    lazy-loading-enabled: true
    # 积极延迟加载开关
    aggressive-lazy-loading: false
    # 日志实现(可选:SLF4J、LOG4J2、STDOUT_LOGGING等)
    log-impl: org.apache.ibatis.logging.slf4j.Slf4jImpl
# 日志配置
logging:
  level:
    root: INFO
    com.example.demo: DEBUG  # 项目包日志级别
    org.mybatis: DEBUG  # MyBatis日志级别
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
# 服务器配置
server:
  port: 8080  # 服务端口
```

## 创建实体类和Mapper接口

### 实体类

先创建个User实体类,对应数据库的user表:

```java
package com.example.demo.entity;
import lombok.Data;
import java.time.LocalDateTime;
/**
 * 用户实体类
 * 对应数据库user表
 */
@Data  // Lombok注解,自动生成getter/setter/toString等方法
public class User {
    /**
     * 主键ID
     */
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
     * 创建时间
     */
    private LocalDateTime createdAt;
    /**
     * 更新时间
     */
    private LocalDateTime updatedAt;
}
```

### Mapper接口(注解方式)

MyBatis支持两种方式:注解和XML;先看注解方式,简单查询用这个就够了:

```java
package com.example.demo.mapper;
import com.example.demo.entity.User;
import org.apache.ibatis.annotations.*;
import java.util.List;
/**
 * 用户Mapper接口
 * @Mapper注解告诉MyBatis这是一个Mapper接口
 * 也可以在主类上加@MapperScan("com.example.demo.mapper")批量扫描
 */
@Mapper
public interface UserMapper {
    /**
     * 根据ID查询用户
     * @Select注解定义SQL查询语句
     * #{id}是参数占位符,会自动防止SQL注入
     */
    @Select("SELECT id, name, email, age, status, created_at, updated_at FROM user WHERE id = #{id}")
    User selectById(Long id);
    /**
     * 查询所有用户
     * 返回List集合
     */
    @Select("SELECT id, name, email, age, status, created_at, updated_at FROM user ORDER BY id DESC")
    List<User> selectAll();
    /**
     * 根据邮箱查询用户
     * @Param注解指定参数名称,用于SQL中引用
     */
    @Select("SELECT id, name, email, age, status, created_at, updated_at FROM user WHERE email = #{email}")
    User selectByEmail(@Param("email") String email);
    /**
     * 根据状态查询用户列表
     */
    @Select("SELECT id, name, email, age, status, created_at, updated_at FROM user WHERE status = #{status}")
    List<User> selectByStatus(@Param("status") Integer status);
    /**
     * 插入用户
     * @Insert注解定义插入语句
     * @Options注解配置主键生成策略
     * useGeneratedKeys=true表示使用数据库自增主键
     * keyProperty指定Java对象中哪个属性接收生成的主键值
     */
    @Insert("INSERT INTO user (name, email, age, status) VALUES (#{name}, #{email}, #{age}, #{status})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(User user);
    /**
     * 更新用户
     * @Update注解定义更新语句
     */
    @Update("UPDATE user SET name = #{name}, email = #{email}, age = #{age}, status = #{status} WHERE id = #{id}")
    int update(User user);
    /**
     * 删除用户
     * @Delete注解定义删除语句
     */
    @Delete("DELETE FROM user WHERE id = #{id}")
    int deleteById(Long id);
    /**
     * 动态查询:根据条件查询用户
     * 使用<script>标签支持动态SQL
     */
    @Select({
        "<script>",
        "SELECT id, name, email, age, status, created_at, updated_at FROM user",
        "<where>",
        "  <if test='name != null and name != \"\"'>AND name LIKE CONCAT('%', #{name}, '%')</if>",
        "  <if test='email != null and email != \"\"'>AND email = #{email}</if>",
        "  <if test='status != null'>AND status = #{status}</if>",
        "</where>",
        "ORDER BY id DESC",
        "</script>"
    })
    List<User> selectByCondition(@Param("name") String name, 
                                 @Param("email") String email, 
                                 @Param("status") Integer status);
}
```

### Mapper接口(XML方式)

复杂查询建议用XML方式,SQL写在XML文件里,更清晰:

```java
package com.example.demo.mapper;
import com.example.demo.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;
/**
 * 用户Mapper接口(XML方式)
 * 方法对应的SQL定义在UserMapper.xml中
 */
@Mapper
public interface UserMapper {
    /**
     * 根据ID查询用户
     * 对应的SQL在UserMapper.xml中定义
     */
    User selectById(Long id);
    /**
     * 查询所有用户
     */
    List<User> selectAll();
    /**
     * 根据条件查询用户(支持动态SQL)
     */
    List<User> selectByCondition(@Param("name") String name, 
                                 @Param("email") String email, 
                                 @Param("status") Integer status);
    /**
     * 插入用户
     */
    int insert(User user);
    /**
     * 批量插入用户
     */
    int insertBatch(@Param("users") List<User> users);
    /**
     * 更新用户
     */
    int update(User user);
    /**
     * 根据ID删除用户
     */
    int deleteById(Long id);
    /**
     * 统计用户数量
     */
    int count();
}
```

### XML映射文件

在`src/main/resources/mapper/`目录下创建`UserMapper.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" 
"http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<!-- 
    mapper标签的namespace必须对应Mapper接口的全限定名
    这样MyBatis才能把XML中的SQL和方法关联起来
-->
<mapper namespace="com.example.demo.mapper.UserMapper">
    <!-- 
        结果映射:定义数据库字段和Java属性的对应关系
        id是映射的唯一标识,type是实体类(因为配置了type-aliases-package,可以直接写类名)
    -->
    <resultMap id="userResultMap" type="User">
        <!-- id标签映射主键字段 -->
        <id property="id" column="id"/>
        <!-- result标签映射普通字段 -->
        <result property="name" column="name"/>
        <result property="email" column="email"/>
        <result property="age" column="age"/>
        <result property="status" column="status"/>
        <!-- 数据库字段是created_at,Java属性是createdAt,开启驼峰转换后会自动映射 -->
        <result property="createdAt" column="created_at"/>
        <result property="updatedAt" column="updated_at"/>
    </resultMap>
    <!-- 
        根据ID查询用户
        id对应Mapper接口中的方法名
        resultMap指定使用上面定义的映射关系
    -->
    <select id="selectById" resultMap="userResultMap">
        SELECT id, name, email, age, status, created_at, updated_at 
        FROM user 
        WHERE id = #{id}
    </select>
    <!-- 查询所有用户 -->
    <select id="selectAll" resultMap="userResultMap">
        SELECT id, name, email, age, status, created_at, updated_at 
        FROM user 
        ORDER BY id DESC
    </select>
    <!-- 
        动态查询:根据条件查询用户
        使用<where>和<if>标签实现动态SQL
        <where>标签会自动处理WHERE子句,去掉多余的AND/OR
    -->
    <select id="selectByCondition" resultMap="userResultMap">
        SELECT id, name, email, age, status, created_at, updated_at 
        FROM user
        <where>
            <!-- 如果name不为空,添加name条件 -->
            <if test="name != null and name != ''">
                AND name LIKE CONCAT('%', #{name}, '%')
            </if>
            <!-- 如果email不为空,添加email条件 -->
            <if test="email != null and email != ''">
                AND email = #{email}
            </if>
            <!-- 如果status不为空,添加status条件 -->
            <if test="status != null">
                AND status = #{status}
            </if>
        </where>
        ORDER BY id DESC
    </select>
    <!-- 插入用户 -->
    <insert id="insert" useGeneratedKeys="true" keyProperty="id">
        INSERT INTO user (name, email, age, status) 
        VALUES (#{name}, #{email}, #{age}, #{status})
    </insert>
    <!-- 
        批量插入用户
        使用<foreach>标签遍历集合
        collection指定集合参数名,item指定遍历的元素变量名
        separator指定分隔符
    -->
    <insert id="insertBatch">
        INSERT INTO user (name, email, age, status) VALUES
        <foreach collection="users" item="user" separator=",">
            (#{user.name}, #{user.email}, #{user.age}, #{user.status})
        </foreach>
    </insert>
    <!-- 更新用户 -->
    <update id="update">
        UPDATE user 
        <set>
            <if test="name != null">name = #{name},</if>
            <if test="email != null">email = #{email},</if>
            <if test="age != null">age = #{age},</if>
            <if test="status != null">status = #{status},</if>
        </set>
        WHERE id = #{id}
    </update>
    <!-- 根据ID删除用户 -->
    <delete id="deleteById">
        DELETE FROM user WHERE id = #{id}
    </delete>
    <!-- 统计用户数量 -->
    <select id="count" resultType="int">
        SELECT COUNT(*) FROM user
    </select>
</mapper>
```

## Service层和Controller层

### Service接口和实现

```java
package com.example.demo.service;
import com.example.demo.entity.User;
import java.util.List;
/**
 * 用户服务接口
 */
public interface UserService {
    /**
     * 根据ID查询用户
     */
    User getUserById(Long id);
    /**
     * 查询所有用户
     */
    List<User> getAllUsers();
    /**
     * 根据条件查询用户
     */
    List<User> searchUsers(String name, String email, Integer status);
    /**
     * 创建用户
     */
    User createUser(User user);
    /**
     * 更新用户
     */
    User updateUser(User user);
    /**
     * 删除用户
     */
    void deleteUser(Long id);
}
```

```java
package com.example.demo.service.impl;
import com.example.demo.entity.User;
import com.example.demo.mapper.UserMapper;
import com.example.demo.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
/**
 * 用户服务实现类
 * @Service注解标识这是一个服务类,会被Spring管理
 */
@Service
public class UserServiceImpl implements UserService {
    /**
     * 注入UserMapper
     * @Autowired自动注入,Spring Boot会自动创建Mapper的代理对象
     */
    @Autowired
    private UserMapper userMapper;
    @Override
    public User getUserById(Long id) {
        // 调用Mapper方法查询用户
        return userMapper.selectById(id);
    }
    @Override
    public List<User> getAllUsers() {
        // 查询所有用户
        return userMapper.selectAll();
    }
    @Override
    public List<User> searchUsers(String name, String email, Integer status) {
        // 根据条件查询用户
        return userMapper.selectByCondition(name, email, status);
    }
    @Override
    @Transactional  // 开启事务,如果方法抛出异常会自动回滚
    public User createUser(User user) {
        // 设置默认状态
        if (user.getStatus() == null) {
            user.setStatus(1);  // 默认正常状态
        }
        // 插入用户,主键会自动填充到user对象中
        userMapper.insert(user);
        // 返回插入后的用户(包含生成的ID)
        return user;
    }
    @Override
    @Transactional  // 更新操作也需要事务
    public User updateUser(User user) {
        // 更新用户
        int rows = userMapper.update(user);
        if (rows > 0) {
            // 更新成功,重新查询返回最新数据
            return userMapper.selectById(user.getId());
        }
        throw new RuntimeException("更新用户失败");
    }
    @Override
    @Transactional  // 删除操作也需要事务
    public void deleteUser(Long id) {
        // 删除用户
        int rows = userMapper.deleteById(id);
        if (rows == 0) {
            throw new RuntimeException("用户不存在或删除失败");
        }
    }
}
```

### Controller层

```java
package com.example.demo.controller;
import com.example.demo.entity.User;
import com.example.demo.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
/**
 * 用户控制器
 * @RestController = @Controller + @ResponseBody
 * 所有方法返回的数据都会自动转成JSON
 */
@RestController
@RequestMapping("/api/users")  // 定义基础路径
public class UserController {
    @Autowired
    private UserService userService;
    /**
     * 根据ID查询用户
     * GET /api/users/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        User user = userService.getUserById(id);
        if (user != null) {
            return ResponseEntity.ok(user);  // 返回200状态码和用户数据
        }
        return ResponseEntity.notFound().build();  // 返回404
    }
    /**
     * 查询所有用户
     * GET /api/users
     */
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }
    /**
     * 根据条件搜索用户
     * GET /api/users/search?name=xxx&email=xxx&status=1
     */
    @GetMapping("/search")
    public ResponseEntity<List<User>> searchUsers(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) Integer status) {
        List<User> users = userService.searchUsers(name, email, status);
        return ResponseEntity.ok(users);
    }
    /**
     * 创建用户
     * POST /api/users
     */
    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User user) {
        User createdUser = userService.createUser(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdUser);  // 返回201状态码
    }
    /**
     * 更新用户
     * PUT /api/users/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User user) {
        user.setId(id);  // 设置ID
        User updatedUser = userService.updateUser(user);
        return ResponseEntity.ok(updatedUser);
    }
    /**
     * 删除用户
     * DELETE /api/users/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();  // 返回204状态码
    }
}
```

## 启动类和Mapper扫描配置

### 启动类

```java
package com.example.demo;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
/**
 * Spring Boot 4应用启动类
 * @MapperScan注解扫描指定包下的所有Mapper接口
 * 这样就不需要在每个Mapper接口上加@Mapper注解了
 */
@SpringBootApplication
@MapperScan("com.example.demo.mapper")  // 扫描mapper包下的所有Mapper接口
public class Application {
    public static void main(String[] args) {
        // 启动Spring Boot应用
        SpringApplication.run(Application.class, args);
        System.out.println("Spring Boot 4 MyBatis应用启动成功!");
    }
}
```

## MyBatis高级特性

### 动态SQL详解

MyBatis提供了强大的动态SQL功能,可以根据条件动态生成SQL语句:

#### if标签

```xml
<!-- 根据条件动态查询 -->
<select id="selectByCondition" resultMap="userResultMap">
    SELECT id, name, email, age, status, created_at, updated_at 
    FROM user
    <where>
        <!-- if标签:如果条件成立,就添加对应的SQL片段 -->
        <if test="name != null and name != ''">
            AND name LIKE CONCAT('%', #{name}, '%')
        </if>
        <if test="email != null and email != ''">
            AND email = #{email}
        </if>
        <if test="status != null">
            AND status = #{status}
        </if>
        <if test="minAge != null">
            AND age >= #{minAge}
        </if>
        <if test="maxAge != null">
            AND age <= #{maxAge}
        </if>
    </where>
    ORDER BY id DESC
</select>
```

#### choose、when、otherwise标签

```xml
<!-- 类似Java的switch-case,只选择一个条件 -->
<select id="selectByChoose" resultMap="userResultMap">
    SELECT id, name, email, age, status, created_at, updated_at 
    FROM user
    <where>
        <choose>
            <!-- 如果name不为空,优先用name查询 -->
            <when test="name != null and name != ''">
                AND name LIKE CONCAT('%', #{name}, '%')
            </when>
            <!-- 如果email不为空,用email查询 -->
            <when test="email != null and email != ''">
                AND email = #{email}
            </when>
            <!-- 否则查询所有正常状态的用户 -->
            <otherwise>
                AND status = 1
            </otherwise>
        </choose>
    </where>
</select>
```

#### trim、set标签

```xml
<!-- trim标签可以自定义前缀后缀,去掉多余的AND/OR -->
<select id="selectWithTrim" resultMap="userResultMap">
    SELECT id, name, email, age, status, created_at, updated_at 
    FROM user
    <trim prefix="WHERE" prefixOverrides="AND |OR ">
        <if test="name != null">
            AND name = #{name}
        </if>
        <if test="email != null">
            AND email = #{email}
        </if>
    </trim>
</select>
<!-- set标签用于UPDATE语句,自动去掉多余的逗号 -->
<update id="updateWithSet">
    UPDATE user
    <set>
        <if test="name != null">name = #{name},</if>
        <if test="email != null">email = #{email},</if>
        <if test="age != null">age = #{age},</if>
        <if test="status != null">status = #{status},</if>
    </set>
    WHERE id = #{id}
</update>
```

#### foreach标签

```xml
<!-- foreach标签用于遍历集合,常用于IN查询和批量操作 -->
<select id="selectByIds" resultMap="userResultMap">
    SELECT id, name, email, age, status, created_at, updated_at 
    FROM user
    WHERE id IN
    <foreach collection="ids" item="id" open="(" separator="," close=")">
        #{id}
    </foreach>
</select>
<!-- 批量插入 -->
<insert id="insertBatch">
    INSERT INTO user (name, email, age, status) VALUES
    <foreach collection="users" item="user" separator=",">
        (#{user.name}, #{user.email}, #{user.age}, #{user.status})
    </foreach>
</insert>
<!-- 批量更新(MySQL语法) -->
<update id="updateBatch">
    <foreach collection="users" item="user" separator=";">
        UPDATE user 
        SET name = #{user.name}, email = #{user.email}
        WHERE id = #{user.id}
    </foreach>
</update>
```

#### bind标签

```xml
<!-- bind标签可以创建变量,用于SQL中 -->
<select id="selectWithBind" resultMap="userResultMap">
    <!-- 创建pattern变量,用于LIKE查询 -->
    <bind name="pattern" value="'%' + name + '%'"/>
    SELECT id, name, email, age, status, created_at, updated_at 
    FROM user
    WHERE name LIKE #{pattern}
</select>
```

### 结果映射详解

#### 基础结果映射

```xml
<!-- resultMap定义数据库字段和Java属性的映射关系 -->
<resultMap id="userResultMap" type="User">
    <!-- id标签映射主键字段,提高性能 -->
    <id property="id" column="id"/>
    <!-- result标签映射普通字段 -->
    <result property="name" column="name"/>
    <result property="email" column="email"/>
    <result property="age" column="age"/>
    <result property="status" column="status"/>
    <!-- 字段名和属性名不一致时需要显式映射 -->
    <result property="createdAt" column="created_at"/>
    <result property="updatedAt" column="updated_at"/>
</resultMap>
```

#### 一对一关联映射

```xml
<!-- 用户和用户详情一对一关系 -->
<resultMap id="userWithDetailMap" type="User">
    <id property="id" column="id"/>
    <result property="name" column="name"/>
    <result property="email" column="email"/>
    <!-- association标签映射一对一关系 -->
    <!-- property:Java对象中的属性名 -->
    <!-- javaType:关联对象的类型 -->
    <!-- column:用于关联查询的字段 -->
    <association property="userDetail" javaType="UserDetail">
        <id property="id" column="detail_id"/>
        <result property="userId" column="user_id"/>
        <result property="address" column="address"/>
        <result property="phone" column="phone"/>
    </association>
</resultMap>
<!-- 关联查询SQL -->
<select id="selectUserWithDetail" resultMap="userWithDetailMap">
    SELECT 
        u.id, u.name, u.email,
        d.id as detail_id, d.user_id, d.address, d.phone
    FROM user u
    LEFT JOIN user_detail d ON u.id = d.user_id
    WHERE u.id = #{id}
</select>
<!-- 或者使用嵌套查询(分步查询) -->
<resultMap id="userWithDetailNestedMap" type="User">
    <id property="id" column="id"/>
    <result property="name" column="name"/>
    <!-- select属性指定另一个查询方法 -->
    <!-- column属性指定传递给嵌套查询的参数 -->
    <association property="userDetail" 
                 select="com.example.demo.mapper.UserDetailMapper.selectByUserId"
                 column="id"/>
</resultMap>
```

#### 一对多关联映射

```xml
<!-- 用户和订单一对多关系 -->
<resultMap id="userWithOrdersMap" type="User">
    <id property="id" column="id"/>
    <result property="name" column="name"/>
    <result property="email" column="email"/>
    <!-- collection标签映射一对多关系 -->
    <!-- property:Java对象中的集合属性名 -->
    <!-- ofType:集合中元素的类型 -->
    <collection property="orders" ofType="Order">
        <id property="id" column="order_id"/>
        <result property="userId" column="user_id"/>
        <result property="orderNo" column="order_no"/>
        <result property="amount" column="amount"/>
        <result property="status" column="order_status"/>
    </collection>
</resultMap>
<!-- 关联查询SQL -->
<select id="selectUserWithOrders" resultMap="userWithOrdersMap">
    SELECT 
        u.id, u.name, u.email,
        o.id as order_id, o.user_id, o.order_no, o.amount, o.status as order_status
    FROM user u
    LEFT JOIN orders o ON u.id = o.user_id
    WHERE u.id = #{id}
</select>
<!-- 或者使用嵌套查询 -->
<resultMap id="userWithOrdersNestedMap" type="User">
    <id property="id" column="id"/>
    <result property="name" column="name"/>
    <collection property="orders" 
                select="com.example.demo.mapper.OrderMapper.selectByUserId"
                column="id"/>
</resultMap>
```

#### 多对多关联映射

```xml
<!-- 用户和角色多对多关系 -->
<resultMap id="userWithRolesMap" type="User">
    <id property="id" column="id"/>
    <result property="name" column="name"/>
    <!-- 多对多关系也用collection,但需要关联中间表 -->
    <collection property="roles" ofType="Role">
        <id property="id" column="role_id"/>
        <result property="name" column="role_name"/>
        <result property="code" column="role_code"/>
    </collection>
</resultMap>
<!-- 多对多关联查询 -->
<select id="selectUserWithRoles" resultMap="userWithRolesMap">
    SELECT 
        u.id, u.name,
        r.id as role_id, r.name as role_name, r.code as role_code
    FROM user u
    LEFT JOIN user_role ur ON u.id = ur.user_id
    LEFT JOIN role r ON ur.role_id = r.id
    WHERE u.id = #{id}
</select>
```

### 分页查询

MyBatis本身不提供分页功能,需要配合PageHelper插件或者手动实现:

#### 手动分页

```java
package com.example.demo.mapper;
import com.example.demo.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;
@Mapper
public interface UserMapper {
    /**
     * 手动分页查询
     * @param offset 偏移量
     * @param limit 每页条数
     */
    @Select("SELECT id, name, email, age, status, created_at, updated_at FROM user ORDER BY id DESC LIMIT #{offset}, #{limit}")
    List<User> selectByPage(@Param("offset") int offset, @Param("limit") int limit);
    /**
     * 查询总数
     */
    @Select("SELECT COUNT(*) FROM user")
    int count();
}
```

#### 使用PageHelper插件

```xml
<!-- pom.xml添加PageHelper依赖 -->
<dependency>
    <groupId>com.github.pagehelper</groupId>
    <artifactId>pagehelper-spring-boot-starter</artifactId>
    <version>1.4.7</version>
</dependency>
```

```yaml
# application.yml配置PageHelper
pagehelper:
  helper-dialect: mysql  # 数据库方言
  reasonable: true  # 分页参数合理化
  support-methods-arguments: true  # 支持通过Mapper接口参数传递分页参数
```

```java
package com.example.demo.service.impl;
import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageInfo;
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
     * 使用PageHelper分页查询
     */
    public PageInfo<User> pageUsers(int pageNum, int pageSize) {
        // 开启分页,会自动拦截下一个查询
        PageHelper.startPage(pageNum, pageSize);
        // 执行查询(会被自动分页)
        List<User> users = userMapper.selectAll();
        // 封装分页信息
        PageInfo<User> pageInfo = new PageInfo<>(users);
        return pageInfo;
    }
}
```

### 缓存配置

MyBatis提供了一级缓存和二级缓存:

#### 一级缓存

一级缓存是SqlSession级别的,默认开启,同一个SqlSession中相同查询会使用缓存:

```java
// 第一次查询,会执行SQL
User user1 = userMapper.selectById(1L);
// 第二次查询,直接从缓存获取,不会执行SQL
User user2 = userMapper.selectById(1L);
// user1 == user2 为true(同一个对象)
// 如果执行了更新操作,缓存会被清空
userMapper.update(user);
// 再次查询会重新执行SQL
User user3 = userMapper.selectById(1L);
```

#### 二级缓存

二级缓存是Mapper级别的,需要手动开启:

```xml
<!-- 在Mapper.xml中开启二级缓存 -->
<mapper namespace="com.example.demo.mapper.UserMapper">
    <!-- 开启二级缓存 -->
    <cache eviction="FIFO"  <!-- 缓存淘汰策略:FIFO、LRU、SOFT、WEAK -->
           flushInterval="60000"  <!-- 刷新间隔(毫秒) -->
           size="512"  <!-- 缓存对象数量 -->
           readOnly="true"/>  <!-- 只读缓存 -->
    <!-- 或者在application.yml中全局开启 -->
</mapper>
```

```yaml
# application.yml配置二级缓存
mybatis:
  configuration:
    cache-enabled: true  # 开启二级缓存
```

```java
// 实体类需要实现Serializable接口
public class User implements Serializable {
    // ...
}
```

### 事务管理详解

Spring Boot自动配置了事务管理器,支持声明式事务:

```java
package com.example.demo.service.impl;
import com.example.demo.entity.User;
import com.example.demo.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Isolation;
@Service
public class UserTransactionService {
    @Autowired
    private UserMapper userMapper;
    /**
     * 基本事务使用
     * @Transactional注解开启事务
     */
    @Transactional
    public void basicTransaction(User user) {
        userMapper.insert(user);
        // 如果这里抛出异常,上面的insert会回滚
        if (user.getAge() < 0) {
            throw new RuntimeException("年龄不能为负数");
        }
    }
    /**
     * 指定回滚异常类型
     */
    @Transactional(rollbackFor = Exception.class)  // 任何异常都回滚
    public void rollbackForException(User user) {
        userMapper.insert(user);
    }
    /**
     * 指定不回滚的异常
     */
    @Transactional(noRollbackFor = RuntimeException.class)  // RuntimeException不回滚
    public void noRollbackForException(User user) {
        userMapper.insert(user);
    }
    /**
     * 事务传播行为
     */
    @Transactional(propagation = Propagation.REQUIRED)  // 默认:如果存在事务就加入,不存在就创建
    public void requiredTransaction(User user) {
        userMapper.insert(user);
    }
    @Transactional(propagation = Propagation.REQUIRES_NEW)  // 总是创建新事务
    public void requiresNewTransaction(User user) {
        userMapper.insert(user);
    }
    @Transactional(propagation = Propagation.NESTED)  // 嵌套事务
    public void nestedTransaction(User user) {
        userMapper.insert(user);
    }
    /**
     * 事务隔离级别
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)  // 读已提交
    public void readCommittedTransaction(User user) {
        userMapper.insert(user);
    }
    @Transactional(isolation = Isolation.REPEATABLE_READ)  // 可重复读(MySQL默认)
    public void repeatableReadTransaction(User user) {
        userMapper.insert(user);
    }
    @Transactional(isolation = Isolation.SERIALIZABLE)  // 串行化
    public void serializableTransaction(User user) {
        userMapper.insert(user);
    }
    /**
     * 只读事务(优化性能)
     */
    @Transactional(readOnly = true)
    public User readOnlyTransaction(Long id) {
        return userMapper.selectById(id);
    }
    /**
     * 事务超时时间(秒)
     */
    @Transactional(timeout = 30)
    public void timeoutTransaction(User user) {
        userMapper.insert(user);
    }
}
```

### 多数据源配置

如果项目需要连接多个数据库,可以配置多数据源:

```java
package com.example.demo.config;
import org.apache.ibatis.session.SqlSessionFactory;
import org.mybatis.spring.SqlSessionFactoryBean;
import org.mybatis.spring.SqlSessionTemplate;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
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
        SqlSessionFactoryBean sessionFactory = new SqlSessionFactoryBean();
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
        SqlSessionFactoryBean sessionFactory = new SqlSessionFactoryBean();
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
    /**
     * 主数据源事务管理器
     */
    @Primary
    @Bean(name = "primaryTransactionManager")
    public DataSourceTransactionManager primaryTransactionManager(@Qualifier("primaryDataSource") DataSource dataSource) {
        return new DataSourceTransactionManager(dataSource);
    }
    /**
     * 从数据源事务管理器
     */
    @Bean(name = "secondaryTransactionManager")
    public DataSourceTransactionManager secondaryTransactionManager(@Qualifier("secondaryDataSource") DataSource dataSource) {
        return new DataSourceTransactionManager(dataSource);
    }
}
```

```yaml
# application.yml多数据源配置
spring:
  datasource:
    primary:
      driver-class-name: com.mysql.cj.jdbc.Driver
      url: jdbc:mysql://localhost:3306/db1
      username: root
      password: 123456
    secondary:
      driver-class-name: com.mysql.cj.jdbc.Driver
      url: jdbc:mysql://localhost:3306/db2
      username: root
      password: 123456
```

```java
// 使用不同数据源的Mapper
@Mapper
@Qualifier("primarySqlSessionFactory")
public interface PrimaryUserMapper {
    // ...
}
@Mapper
@Qualifier("secondarySqlSessionFactory")
public interface SecondaryUserMapper {
    // ...
}
```

### 自定义TypeHandler

如果数据库字段类型和Java类型不匹配,可以自定义TypeHandler:

```java
package com.example.demo.handler;
import org.apache.ibatis.type.BaseTypeHandler;
import org.apache.ibatis.type.JdbcType;
import org.apache.ibatis.type.MappedJdbcTypes;
import org.apache.ibatis.type.MappedTypes;
import java.sql.CallableStatement;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
/**
 * 自定义TypeHandler:将数据库的DATETIME转换为LocalDateTime
 */
@MappedTypes(LocalDateTime.class)
@MappedJdbcTypes(JdbcType.TIMESTAMP)
public class LocalDateTimeTypeHandler extends BaseTypeHandler<LocalDateTime> {
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    @Override
    public void setNonNullParameter(PreparedStatement ps, int i, LocalDateTime parameter, JdbcType jdbcType) throws SQLException {
        ps.setString(i, parameter.format(FORMATTER));
    }
    @Override
    public LocalDateTime getNullableResult(ResultSet rs, String columnName) throws SQLException {
        String value = rs.getString(columnName);
        return value != null ? LocalDateTime.parse(value, FORMATTER) : null;
    }
    @Override
    public LocalDateTime getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
        String value = rs.getString(columnIndex);
        return value != null ? LocalDateTime.parse(value, FORMATTER) : null;
    }
    @Override
    public LocalDateTime getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
        String value = cs.getString(columnIndex);
        return value != null ? LocalDateTime.parse(value, FORMATTER) : null;
    }
}
```

```xml
<!-- 在mybatis-config.xml中注册TypeHandler -->
<typeHandlers>
    <typeHandler handler="com.example.demo.handler.LocalDateTimeTypeHandler"/>
</typeHandlers>
```

### 插件开发

MyBatis提供了插件机制,可以拦截SQL执行过程:

```java
package com.example.demo.plugin;
import org.apache.ibatis.executor.Executor;
import org.apache.ibatis.mapping.MappedStatement;
import org.apache.ibatis.plugin.*;
import org.apache.ibatis.session.ResultHandler;
import org.apache.ibatis.session.RowBounds;
import java.util.Properties;
/**
 * 自定义MyBatis插件:记录SQL执行时间
 * @Intercepts注解指定要拦截的方法
 */
@Intercepts({
    @Signature(type = Executor.class, method = "query", 
               args = {MappedStatement.class, Object.class, RowBounds.class, ResultHandler.class})
})
public class SqlExecuteTimePlugin implements Interceptor {
    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        long startTime = System.currentTimeMillis();
        // 执行原方法
        Object result = invocation.proceed();
        long endTime = System.currentTimeMillis();
        long executeTime = endTime - startTime;
        // 记录执行时间
        MappedStatement mappedStatement = (MappedStatement) invocation.getArgs()[0];
        String sqlId = mappedStatement.getId();
        System.out.println("SQL执行耗时: " + sqlId + " - " + executeTime + "ms");
        return result;
    }
    @Override
    public Object plugin(Object target) {
        return Plugin.wrap(target, this);
    }
    @Override
    public void setProperties(Properties properties) {
        // 可以读取配置参数
    }
}
```

```java
// 注册插件
@Configuration
public class MyBatisConfig {
    @Bean
    public SqlExecuteTimePlugin sqlExecuteTimePlugin() {
        return new SqlExecuteTimePlugin();
    }
}
```

### 复杂查询示例

实际项目中经常需要复杂的查询,这里给几个例子:

```xml
<!-- 复杂条件查询 -->
<select id="complexQuery" resultMap="userResultMap">
    SELECT id, name, email, age, status, created_at, updated_at 
    FROM user
    <where>
        <!-- 姓名模糊查询 -->
        <if test="name != null and name != ''">
            AND name LIKE CONCAT('%', #{name}, '%')
        </if>
        <!-- 年龄范围查询 -->
        <if test="minAge != null and maxAge != null">
            AND age BETWEEN #{minAge} AND #{maxAge}
        </if>
        <!-- 状态查询 -->
        <if test="statusList != null and statusList.size() > 0">
            AND status IN
            <foreach collection="statusList" item="status" open="(" separator="," close=")">
                #{status}
            </foreach>
        </if>
        <!-- 时间范围查询 -->
        <if test="startTime != null and endTime != null">
            AND created_at BETWEEN #{startTime} AND #{endTime}
        </if>
    </where>
    ORDER BY 
    <choose>
        <when test="orderBy != null and orderBy == 'name'">
            name ASC
        </when>
        <when test="orderBy != null and orderBy == 'age'">
            age DESC
        </when>
        <otherwise>
            id DESC
        </otherwise>
    </choose>
    LIMIT #{offset}, #{limit}
</select>
```

```java
// Mapper接口
List<User> complexQuery(@Param("name") String name,
                        @Param("minAge") Integer minAge,
                        @Param("maxAge") Integer maxAge,
                        @Param("statusList") List<Integer> statusList,
                        @Param("startTime") LocalDateTime startTime,
                        @Param("endTime") LocalDateTime endTime,
                        @Param("orderBy") String orderBy,
                        @Param("offset") int offset,
                        @Param("limit") int limit);
```

### 批量操作优化

```xml
<!-- 批量插入优化:使用VALUES子句 -->
<insert id="insertBatchOptimized">
    INSERT INTO user (name, email, age, status) VALUES
    <foreach collection="users" item="user" separator=",">
        (#{user.name}, #{user.email}, #{user.age}, #{user.status})
    </foreach>
</insert>
<!-- 批量更新:使用CASE WHEN -->
<update id="updateBatchOptimized">
    UPDATE user
    SET 
        name = CASE id
            <foreach collection="users" item="user">
                WHEN #{user.id} THEN #{user.name}
            </foreach>
        END,
        email = CASE id
            <foreach collection="users" item="user">
                WHEN #{user.id} THEN #{user.email}
            </foreach>
        END
    WHERE id IN
    <foreach collection="users" item="user" open="(" separator="," close=")">
        #{user.id}
    </foreach>
</update>
```

## 最佳实践和注意事项

### 1. Mapper接口命名规范

- Mapper接口名:实体类名 + Mapper,如`UserMapper`
- XML文件名:和Mapper接口名一致,如`UserMapper.xml`
- XML的namespace:必须是Mapper接口的全限定名
- 方法名要有意义,见名知意

### 2. 参数传递

- 单个参数:可以直接用`#{参数名}`,但建议用`@Param`明确指定
- 多个参数:必须用`@Param`注解指定参数名,否则会报错
- 对象参数:直接用`#{属性名}`访问对象属性
- Map参数:用`#{key}`访问Map的value
- 集合参数:用``标签遍历

```java
// 单个参数
@Select("SELECT * FROM user WHERE id = #{id}")
User selectById(Long id);
// 多个参数(必须用@Param)
@Select("SELECT * FROM user WHERE name = #{name} AND status = #{status}")
User selectByNameAndStatus(@Param("name") String name, @Param("status") Integer status);
// 对象参数
@Insert("INSERT INTO user (name, email) VALUES (#{name}, #{email})")
int insert(User user);
// Map参数
@Select("SELECT * FROM user WHERE name = #{name} AND status = #{status}")
User selectByMap(Map<String, Object> params);
```

### 3. SQL注入防护

MyBatis使用`#{}`占位符会自动防止SQL注入,不要用`${}`拼接SQL(除非确定安全):

```java
// 安全:使用#{}会自动转义,防止SQL注入
@Select("SELECT * FROM user WHERE name = #{name}")
// 危险:使用${}会直接拼接,可能被SQL注入
@Select("SELECT * FROM user WHERE name = '${name}'")  // 不要这样做!
// ${}的正确用法:用于动态表名、列名等(需要确保安全)
@Select("SELECT * FROM ${tableName} WHERE id = #{id}")  // 表名必须是安全的
```

### 4. 性能优化

#### 4.1 查询优化

- **复杂查询用XML方式**:XML支持更复杂的动态SQL,性能更好
- **简单查询用注解方式**:代码更简洁,适合单表简单查询
- **避免SELECT ***:只查询需要的字段,减少数据传输
- **合理使用索引**:为常用查询字段添加数据库索引
- **分页查询**:大结果集必须分页,避免一次性加载太多数据

#### 4.2 批量操作优化

```java
// 错误:循环单条插入,性能差
for (User user : users) {
    userMapper.insert(user);  // 每次都要建立连接,性能差
}
// 正确:批量插入,性能好
userMapper.insertBatch(users);  // 一次SQL插入多条,性能好
```

#### 4.3 缓存优化

- **一级缓存**:SqlSession级别,默认开启,适合单次会话
- **二级缓存**:Mapper级别,需要手动开启,注意缓存失效问题
- **缓存策略**:读多写少的数据适合缓存,频繁更新的数据不适合

#### 4.4 连接池优化

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20  # 根据并发量调整
      minimum-idle: 5  # 保持最小空闲连接
      connection-timeout: 30000  # 连接超时时间
      idle-timeout: 600000  # 空闲连接超时
      max-lifetime: 1800000  # 连接最大生命周期
```

### 5. 日志配置

开发环境可以开启MyBatis的SQL日志,方便调试:

```yaml
mybatis:
  configuration:
    # 控制台输出SQL(开发环境用)
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl
    # 或者用SLF4J(生产环境用)
    # log-impl: org.apache.ibatis.logging.slf4j.Slf4jImpl
# 日志级别配置
logging:
  level:
    com.example.demo.mapper: DEBUG  # Mapper包日志级别
    org.mybatis: DEBUG  # MyBatis日志级别
```

### 6. 延迟加载

MyBatis支持延迟加载,关联对象只有在使用时才查询:

```xml
<!-- 配置延迟加载 -->
<settings>
    <setting name="lazyLoadingEnabled" value="true"/>
    <setting name="aggressiveLazyLoading" value="false"/>
</settings>
```

```xml
<!-- 关联查询使用延迟加载 -->
<resultMap id="userWithOrdersMap" type="User">
    <id property="id" column="id"/>
    <result property="name" column="name"/>
    <!-- fetchType="lazy"表示延迟加载 -->
    <collection property="orders" 
                select="com.example.demo.mapper.OrderMapper.selectByUserId"
                column="id"
                fetchType="lazy"/>
</resultMap>
```

### 7. 结果映射优化

```xml
<!-- 使用autoMapping自动映射(字段名和属性名一致时) -->
<resultMap id="userAutoMap" type="User" autoMapping="true">
    <id property="id" column="id"/>
    <!-- 其他字段会自动映射 -->
</resultMap>
<!-- 使用columnPrefix避免列名冲突 -->
<resultMap id="userWithDetailMap" type="User">
    <id property="id" column="u_id"/>
    <result property="name" column="u_name"/>
    <association property="userDetail" 
                 columnPrefix="d_"
                 resultMap="userDetailMap"/>
</resultMap>
```

### 8. 常见问题解决

#### 8.1 Mapper扫描不到

**问题**:启动时报错找不到Mapper接口

**解决方案**:

1. 检查`@MapperScan`注解路径是否正确
2. 检查Mapper接口是否在扫描路径下
3. 检查XML文件路径配置是否正确

```java
// 方式1:使用@MapperScan
@SpringBootApplication
@MapperScan("com.example.demo.mapper")
public class Application {
    // ...
}
// 方式2:每个Mapper接口加@Mapper
@Mapper
public interface UserMapper {
    // ...
}
```

#### 8.2 XML映射文件找不到

**问题**:执行SQL时报错找不到XML映射文件

**解决方案**:

1. 检查`mapper-locations`配置路径是否正确
2. 检查XML文件是否在resources目录下
3. 检查XML的namespace是否和Mapper接口全限定名一致

```yaml
mybatis:
  mapper-locations: classpath:mapper/*.xml  # 路径要正确
```

#### 8.3 参数绑定错误

**问题**:执行SQL时报错参数绑定失败

**解决方案**:

1. 多个参数必须用`@Param`注解
2. 检查参数名是否和SQL中的占位符一致
3. 对象参数检查属性名是否正确

```java
// 错误:多个参数没用@Param
@Select("SELECT * FROM user WHERE name = #{name} AND status = #{status}")
User selectByNameAndStatus(String name, Integer status);  // 会报错
// 正确:使用@Param
@Select("SELECT * FROM user WHERE name = #{name} AND status = #{status}")
User selectByNameAndStatus(@Param("name") String name, @Param("status") Integer status);
```

#### 8.4 事务不生效

**问题**:方法加了`@Transactional`但事务不生效

**解决方案**:

1. 检查方法是否是public(Spring AOP只对public方法生效)
2. 检查是否在同一个类中调用(内部调用不会走代理)
3. 检查异常类型是否会被回滚

```java
// 错误:private方法事务不生效
@Transactional
private void updateUser(User user) {  // 不会生效
    userMapper.update(user);
}
// 正确:public方法事务生效
@Transactional
public void updateUser(User user) {  // 会生效
    userMapper.update(user);
}
```

#### 8.5 二级缓存不生效

**问题**:配置了二级缓存但不生效

**解决方案**:

1. 检查实体类是否实现了`Serializable`接口
2. 检查`cache-enabled`配置是否为true
3. 检查XML中是否配置了``标签
4. 检查是否在事务中(二级缓存只在事务提交后生效)

```java
// 实体类必须实现Serializable
public class User implements Serializable {
    // ...
}
```

## 总结

Spring Boot 4整合MyBatis其实挺简单的,主要就这几步:

1. **加依赖**:`mybatis-spring-boot-starter`(版本3.0.3+适配Spring Boot 4)
2. **配数据源**:在`application.yml`里配置数据库连接和连接池
3. **写实体类**:对应数据库表结构
4. **写Mapper**:接口+XML或者纯注解都行,复杂查询推荐XML
5. **扫描Mapper**:用`@MapperScan`或者`@Mapper`注解
6. **写Service**:注入Mapper,加`@Transactional`事务注解
7. **写Controller**:提供RESTful API接口

MyBatis最大的优势就是SQL和Java代码分离,复杂查询写XML,简单查询用注解,灵活得很;而且支持动态SQL、结果映射、缓存、插件这些高级功能,能满足各种复杂场景;Spring Boot的自动配置把大部分配置都给你整好了,基本上开箱即用。

兄弟们要是遇到啥问题,比如Mapper扫描不到、SQL执行报错、事务不生效、缓存不工作这些,先检查配置对不对,再看日志输出,基本上都能解决;实在不行就看看官方文档,MyBatis的文档还是挺详细的;或者看看鹏磊今天写的这些例子,基本上覆盖了大部分使用场景。

好了,今天就聊到这,兄弟们有啥问题欢迎留言讨论!
