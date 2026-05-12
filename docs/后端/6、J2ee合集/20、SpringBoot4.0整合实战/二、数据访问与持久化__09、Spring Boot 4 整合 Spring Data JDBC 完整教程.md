# 09、Spring Boot 4 整合 Spring Data JDBC 完整教程
- 来源：https://ddkk.com/springboot/4-action/9.html
- 分类：Spring Boot 4 整合教程
- 分组：二、数据访问与持久化
- 日期：2025-12-08
用JPA/Hibernate写数据持久化的时候,最烦的就是那些懒加载、缓存、代理对象这些复杂玩意儿,虽然功能强大但是学习成本高,而且有时候性能还不好;后来有了Spring Data JDBC,这些问题都解决了,它比JPA更轻量级,没有那些复杂特性,就是简单的CRUD,代码清晰性能好;现在Spring Boot 4出来了,整合Spring Data JDBC更是简单得不行,自动配置给你整得明明白白的,咱今天就聊聊Spring Boot 4咋整合Spring Data JDBC的。

其实Spring Data JDBC在Spring Boot里早就支持了,你只要加个`spring-boot-starter-data-jdbc`依赖,基本上就能用;但是很多兄弟不知道里面的门道,也不知道咋用Repository、聚合根、自定义查询这些功能,所以鹏磊今天就给兄弟们掰扯掰扯。

## 项目搭建和环境准备

### 创建Maven项目

首先你得有个Maven项目,用IDEA或者Eclipse都行,或者直接用Spring Initializr生成;项目结构大概是这样:

```plaintext
spring-boot-jdbc-demo/
├── pom.xml                          # Maven配置文件
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── example/
│   │   │           └── demo/
│   │   │               ├── Application.java          # 启动类
│   │   │               ├── entity/                   # 实体类目录
│   │   │               ├── repository/              # Repository接口目录
│   │   │               ├── service/                  # 服务层目录
│   │   │               ├── controller/               # 控制器目录
│   │   │               └── config/                   # 配置类目录
│   │   └── resources/
│   │       ├── application.yml                       # 配置文件
│   │       └── schema.sql                            # 数据库脚本(可选)
│   └── test/
│       └── java/                                     # 测试代码目录
```

### pom.xml完整配置

这是最关键的,依赖配置不对后面全是坑;Spring Boot 4需要Java 17以上,而且Spring Data JDBC比JPA更轻量级,不需要Hibernate这些重量级框架。

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
    <artifactId>spring-boot-jdbc-demo</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    <name>Spring Boot 4 JDBC Demo</name>
    <description>Spring Boot 4整合Spring Data JDBC示例项目</description>
    <properties>
        <java.version>17</java.version>  <!-- Java 17以上 -->
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>
    <dependencies>
        <!-- Spring Boot Web Starter: 包含Spring MVC、Tomcat等 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <!-- Spring Boot Data JDBC Starter: 包含Spring Data JDBC -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jdbc</artifactId>
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
CREATE DATABASE IF NOT EXISTS jdbc_demo DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE jdbc_demo;
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
-- 创建订单表(用于演示关联关系)
CREATE TABLE IF NOT EXISTS `order` (
    `id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `user_id` BIGINT(20) NOT NULL COMMENT '用户ID',
    `amount` DECIMAL(10,2) NOT NULL COMMENT '订单金额',
    `status` VARCHAR(20) DEFAULT 'PENDING' COMMENT '订单状态',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    CONSTRAINT `fk_order_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单表';
```

### application.yml配置

Spring Boot 4的配置文件,数据源和JDBC的配置都在这:

```yaml
spring:
  application:
    name: spring-boot-jdbc-demo
  # 数据源配置
  datasource:
    driver-class-name: com.mysql.cj.jdbc.Driver  # MySQL 8.0+驱动
    url: jdbc:mysql://localhost:3306/jdbc_demo?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true
    username: root  # 数据库用户名
    password: 123456  # 数据库密码
    # HikariCP连接池配置
    hikari:
      maximum-pool-size: 20  # 最大连接数
      minimum-idle: 5  # 最小空闲连接数
      connection-timeout: 30000  # 连接超时时间(毫秒)
      idle-timeout: 600000  # 空闲连接超时时间(毫秒)
      max-lifetime: 1800000  # 连接最大生命周期(毫秒)
  # JDBC配置
  jdbc:
    # 初始化数据库脚本(可选)
    # initialize: true
    # schema: classpath:schema.sql
    # data: classpath:data.sql
# 日志配置
logging:
  level:
    root: INFO
    com.example.demo: DEBUG  # 项目包日志级别
    org.springframework.jdbc: DEBUG  # JDBC日志级别,可以看到SQL语句
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
# 服务器配置
server:
  port: 8080  # 服务端口
```

## 创建实体类

Spring Data JDBC的实体类比JPA简单,注解更少,但是功能也够用:

### 用户实体类

```java
package com.example.demo.entity;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;
import lombok.Data;
import java.time.LocalDateTime;
/**
 * 用户实体类
 * @Table注解指定表名(如果表名和类名一致可以省略)
 * Spring Data JDBC使用@Table而不是JPA的@Entity
 */
@Data  // Lombok注解,自动生成getter/setter/toString等方法
@Table("user")  // 指定表名
public class User {
    /**
     * 主键ID
     * @Id注解标识主键
     * Spring Data JDBC会自动处理自增主键
     */
    @Id
    private Long id;
    /**
     * 用户名
     * @Column注解指定列名(如果列名和属性名一致可以省略)
     */
    @Column("name")
    private String name;
    /**
     * 邮箱
     */
    @Column("email")
    private String email;
    /**
     * 年龄
     */
    @Column("age")
    private Integer age;
    /**
     * 状态:1-正常,0-禁用
     */
    @Column("status")
    private Integer status;
    /**
     * 创建时间
     */
    @Column("created_at")
    private LocalDateTime createdAt;
    /**
     * 更新时间
     */
    @Column("updated_at")
    private LocalDateTime updatedAt;
}
```

### 订单实体类

```java
package com.example.demo.entity;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
/**
 * 订单实体类
 */
@Data
@Table("order")
public class Order {
    /**
     * 主键ID
     */
    @Id
    private Long id;
    /**
     * 用户ID(外键)
     */
    @Column("user_id")
    private Long userId;
    /**
     * 订单金额
     */
    @Column("amount")
    private BigDecimal amount;
    /**
     * 订单状态
     */
    @Column("status")
    private String status;
    /**
     * 创建时间
     */
    @Column("created_at")
    private LocalDateTime createdAt;
}
```

## Repository接口

Spring Data JDBC的Repository接口和JPA类似,但是更简单,没有那些复杂特性:

### 基础Repository

```java
package com.example.demo.repository;
import com.example.demo.entity.User;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
/**
 * 用户Repository接口
 * 继承CrudRepository后,自动拥有以下方法:
 * - save: 保存实体
 * - findById: 根据ID查询
 * - findAll: 查询所有
 * - deleteById: 根据ID删除
 * - count: 查询总数
 * - existsById: 判断是否存在
 * - 等等...
 * 
 * CrudRepository<实体类型, 主键类型>
 */
@Repository  // 标识这是一个Repository,会被Spring管理
public interface UserRepository extends CrudRepository<User, Long> {
    // 如果只需要基本的CRUD,继承CrudRepository就够了,不需要写任何方法
    // 如果需要自定义查询,可以在这里定义方法,Spring Data JDBC会根据方法名自动生成查询
    // 例如:
    // List<User> findByName(String name);  // 根据name查询
    // Optional<User> findByEmail(String email);  // 根据email查询
}
```

### 方法名查询

Spring Data JDBC支持根据方法名自动生成查询,和JPA类似:

```java
package com.example.demo.repository;
import com.example.demo.entity.User;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.PagingAndSortingRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
/**
 * 继承PagingAndSortingRepository后,还支持分页和排序
 */
@Repository
public interface UserRepository extends PagingAndSortingRepository<User, Long> {
    /**
     * 根据name查询
     * Spring Data JDBC会根据方法名自动生成: SELECT * FROM user WHERE name = ?
     */
    List<User> findByName(String name);
    /**
     * 根据name和status查询
     * 自动生成: SELECT * FROM user WHERE name = ? AND status = ?
     */
    List<User> findByNameAndStatus(String name, Integer status);
    /**
     * 根据name模糊查询
     * 自动生成: SELECT * FROM user WHERE name LIKE ?
     */
    List<User> findByNameContaining(String name);
    /**
     * 根据name开头查询
     * 自动生成: SELECT * FROM user WHERE name LIKE ?%
     */
    List<User> findByNameStartingWith(String prefix);
    /**
     * 根据email查询单个用户
     * 返回Optional,避免空指针异常
     */
    Optional<User> findByEmail(String email);
    /**
     * 根据status查询,并按id倒序
     * 自动生成: SELECT * FROM user WHERE status = ? ORDER BY id DESC
     */
    List<User> findByStatusOrderByIdDesc(Integer status);
    /**
     * 根据age范围查询
     * 自动生成: SELECT * FROM user WHERE age BETWEEN ? AND ?
     */
    List<User> findByAgeBetween(Integer minAge, Integer maxAge);
    /**
     * 根据age大于等于查询
     * 自动生成: SELECT * FROM user WHERE age >= ?
     */
    List<User> findByAgeGreaterThanEqual(Integer age);
    /**
     * 统计指定status的用户数量
     * 自动生成: SELECT COUNT(*) FROM user WHERE status = ?
     */
    long countByStatus(Integer status);
    /**
     * 判断指定email是否存在
     * 自动生成: SELECT COUNT(*) > 0 FROM user WHERE email = ?
     */
    boolean existsByEmail(String email);
    /**
     * 删除指定status的用户
     * 自动生成: DELETE FROM user WHERE status = ?
     */
    void deleteByStatus(Integer status);
}
```

### @Query注解查询

如果方法名查询不够用,可以用@Query注解写自定义查询:

```java
package com.example.demo.repository;
import com.example.demo.entity.User;
import org.springframework.data.jdbc.repository.query.Modifying;
import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
@Repository
public interface UserRepository extends CrudRepository<User, Long> {
    /**
     * 使用原生SQL查询
     * @Query注解定义查询语句
     * value是SQL语句,使用:参数名绑定参数
     */
    @Query("SELECT * FROM user WHERE name = :name")
    List<User> findUsersByName(@Param("name") String name);
    /**
     * 复杂查询示例
     */
    @Query("SELECT * FROM user WHERE age >= :minAge AND status = :status ORDER BY created_at DESC")
    List<User> findActiveUsersByMinAge(@Param("minAge") Integer minAge, @Param("status") Integer status);
    /**
     * 更新操作
     * @Modifying注解标识这是一个修改操作
     * @Transactional注解开启事务(也可以加在Service层)
     */
    @Modifying
    @Transactional
    @Query("UPDATE user SET status = :status WHERE id = :id")
    int updateUserStatus(@Param("id") Long id, @Param("status") Integer status);
    /**
     * 删除操作
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM user WHERE status = :status")
    int deleteUsersByStatus(@Param("status") Integer status);
    /**
     * 统计查询
     */
    @Query("SELECT COUNT(*) FROM user WHERE status = :status")
    long countUsersByStatus(@Param("status") Integer status);
}
```

### 分页和排序

Spring Data JDBC支持分页和排序,需要继承`PagingAndSortingRepository`:

```java
package com.example.demo.repository;
import com.example.demo.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.repository.PagingAndSortingRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
@Repository
public interface UserRepository extends PagingAndSortingRepository<User, Long> {
    /**
     * 分页查询
     * Pageable是Spring Data的分页对象
     */
    Page<User> findByStatus(Integer status, Pageable pageable);
    /**
     * 排序查询
     * Sort是Spring Data的排序对象
     */
    List<User> findByStatus(Integer status, Sort sort);
    /**
     * 分页和排序组合
     */
    Page<User> findByNameContaining(String name, Pageable pageable);
}
```

## Service层

```java
package com.example.demo.service;
import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
/**
 * 用户服务类
 * @Service注解标识这是一个服务类,会被Spring管理
 */
@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;
    /**
     * 根据ID查询用户
     */
    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }
    /**
     * 查询所有用户
     */
    public List<User> getAllUsers() {
        return (List<User>) userRepository.findAll();
    }
    /**
     * 分页查询用户
     * Pageable是Spring Data的分页对象
     */
    public Page<User> getUsersByPage(int page, int size, String sortBy, String sortDir) {
        // 创建排序对象
        Sort sort = sortDir.equalsIgnoreCase("desc") 
            ? Sort.by(sortBy).descending() 
            : Sort.by(sortBy).ascending();
        // 创建分页对象
        Pageable pageable = PageRequest.of(page, size, sort);
        // 执行分页查询
        return userRepository.findAll(pageable);
    }
    /**
     * 根据name查询用户
     */
    public List<User> getUsersByName(String name) {
        return userRepository.findByName(name);
    }
    /**
     * 根据email查询用户
     */
    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }
    /**
     * 保存用户
     * @Transactional注解开启事务,如果方法抛出异常会自动回滚
     */
    @Transactional
    public User saveUser(User user) {
        // 设置创建时间和更新时间
        if (user.getId() == null) {
            user.setCreatedAt(LocalDateTime.now());
        }
        user.setUpdatedAt(LocalDateTime.now());
        // 设置默认状态
        if (user.getStatus() == null) {
            user.setStatus(1);  // 默认正常状态
        }
        return userRepository.save(user);
    }
    /**
     * 批量保存用户
     */
    @Transactional
    public List<User> saveUsers(List<User> users) {
        users.forEach(user -> {
            if (user.getId() == null) {
                user.setCreatedAt(LocalDateTime.now());
            }
            user.setUpdatedAt(LocalDateTime.now());
            if (user.getStatus() == null) {
                user.setStatus(1);
            }
        });
        return (List<User>) userRepository.saveAll(users);
    }
    /**
     * 更新用户状态
     */
    @Transactional
    public int updateUserStatus(Long id, Integer status) {
        return userRepository.updateUserStatus(id, status);
    }
    /**
     * 删除用户
     */
    @Transactional
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
    /**
     * 根据status删除用户
     */
    @Transactional
    public void deleteUsersByStatus(Integer status) {
        userRepository.deleteByStatus(status);
    }
}
```

## Controller层

```java
package com.example.demo.controller;
import com.example.demo.entity.User;
import com.example.demo.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;
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
        Optional<User> user = userService.getUserById(id);
        return user.map(ResponseEntity::ok)
                   .orElse(ResponseEntity.notFound().build());
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
     * 分页查询用户
     * GET /api/users/page?page=0&size=10&sortBy=id&sortDir=desc
     */
    @GetMapping("/page")
    public ResponseEntity<Page<User>> getUsersByPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        Page<User> result = userService.getUsersByPage(page, size, sortBy, sortDir);
        return ResponseEntity.ok(result);
    }
    /**
     * 根据name查询用户
     * GET /api/users/search?name=xxx
     */
    @GetMapping("/search")
    public ResponseEntity<List<User>> searchUsers(@RequestParam String name) {
        List<User> users = userService.getUsersByName(name);
        return ResponseEntity.ok(users);
    }
    /**
     * 创建用户
     * POST /api/users
     */
    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User user) {
        User savedUser = userService.saveUser(user);
        return ResponseEntity.ok(savedUser);
    }
    /**
     * 更新用户
     * PUT /api/users/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User user) {
        Optional<User> existingUser = userService.getUserById(id);
        if (existingUser.isPresent()) {
            user.setId(id);
            User updatedUser = userService.saveUser(user);
            return ResponseEntity.ok(updatedUser);
        }
        return ResponseEntity.notFound().build();
    }
    /**
     * 更新用户状态
     * PATCH /api/users/{id}/status?status=1
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<Void> updateUserStatus(
            @PathVariable Long id, 
            @RequestParam Integer status) {
        int rows = userService.updateUserStatus(id, status);
        if (rows > 0) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
    /**
     * 删除用户
     * DELETE /api/users/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
```

## 启动类和配置

### 启动类

```java
package com.example.demo;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jdbc.repository.config.EnableJdbcRepositories;
/**
 * Spring Boot 4应用启动类
 * @EnableJdbcRepositories注解启用JDBC Repository支持
 * 如果不指定basePackages,默认扫描启动类所在包及其子包
 */
@SpringBootApplication
@EnableJdbcRepositories(basePackages = "com.example.demo.repository")
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
        System.out.println("Spring Boot 4 Spring Data JDBC应用启动成功!");
    }
}
```

### 自定义配置(可选)

如果需要自定义配置,可以继承`AbstractJdbcConfiguration`:

```java
package com.example.demo.config;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jdbc.repository.config.AbstractJdbcConfiguration;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcOperations;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import javax.sql.DataSource;
/**
 * JDBC配置类
 * 继承AbstractJdbcConfiguration可以自定义JDBC相关配置
 */
@Configuration
public class JdbcConfig extends AbstractJdbcConfiguration {
    /**
     * 配置NamedParameterJdbcOperations
     * Spring Data JDBC使用这个来执行SQL
     */
    @Bean
    public NamedParameterJdbcOperations namedParameterJdbcOperations(DataSource dataSource) {
        return new NamedParameterJdbcTemplate(dataSource);
    }
}
```

## Spring Data JDBC vs JPA

### 主要区别

1. **轻量级**: Spring Data JDBC没有懒加载、缓存、代理对象等复杂特性
2. **简单**: 注解更少,配置更简单,学习成本低
3. **性能**: 没有ORM的额外开销,性能更好
4. **控制**: 对SQL有更好的控制,更接近原生JDBC
5. **聚合根**: 遵循DDD的聚合根概念,聚合是持久化的原子单位

### 适用场景

- **适合**: 简单的CRUD操作、微服务、需要高性能、不需要复杂关联查询
- **不适合**: 复杂的关联查询、需要懒加载、需要二级缓存

## 最佳实践和注意事项

### 1. 聚合根设计

Spring Data JDBC遵循DDD的聚合根概念,聚合是持久化的原子单位:

```java
// 好的设计: 聚合根包含所有相关实体
@Table("user")
public class User {
    @Id
    private Long id;
    private String name;
    // 关联的订单作为聚合的一部分
    @MappedCollection(idColumn = "user_id")
    private List<Order> orders;
}
// 不好的设计: 跨聚合的关联
// Spring Data JDBC不支持跨聚合的懒加载
```

### 2. 主键生成

Spring Data JDBC支持多种主键生成策略:

```java
@Table("user")
public class User {
    @Id
    @GeneratedValue  // 使用数据库自增
    private Long id;
    // 或者手动设置ID
    // @Id
    // private UUID id;  // 使用UUID
}
```

### 3. 事务管理

- Service层方法加`@Transactional`注解
- 只读操作可以用`@Transactional(readOnly = true)`优化性能

### 4. 批量操作

- 使用`saveAll`方法进行批量保存
- 大批量操作考虑用原生SQL或JDBC

### 5. 方法名查询规范

- 方法名要符合Spring Data的命名规范
- 复杂查询建议用`@Query`注解,更清晰

### 6. 实体类设计

- 实体类要有无参构造函数
- 避免复杂的关联关系
- 遵循聚合根设计原则

## 总结

Spring Boot 4整合Spring Data JDBC其实挺简单的,主要就这几步:

1. **加依赖**:`spring-boot-starter-data-jdbc`
2. **配数据源**:在`application.yml`里配置数据库连接
3. **写实体类**:加`@Table`、`@Id`、`@Column`等注解
4. **写Repository**:继承`CrudRepository`或`PagingAndSortingRepository`,基本CRUD不用写实现
5. **用方法名查询**:Spring Data JDBC根据方法名自动生成查询
6. **用@Query注解**:写自定义SQL查询
7. **配Repository**:用`@EnableJdbcRepositories`启用Repository支持

Spring Data JDBC最大的优势就是轻量级,没有JPA那些复杂特性,代码清晰性能好,适合简单的CRUD操作;而且Spring Boot的自动配置把大部分配置都给你整好了,基本上开箱即用。

兄弟们要是遇到啥问题,比如实体映射不对、查询报错、事务不生效这些,先检查注解配置对不对,再看日志输出,基本上都能解决;实在不行就看看官方文档,Spring Data JDBC的文档还是挺详细的。

好了,今天就聊到这,兄弟们有啥问题欢迎留言讨论!
