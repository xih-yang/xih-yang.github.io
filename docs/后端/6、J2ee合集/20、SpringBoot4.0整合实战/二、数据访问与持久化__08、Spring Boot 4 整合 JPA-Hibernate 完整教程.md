# 08、Spring Boot 4 整合 JPA/Hibernate 完整教程
- 来源：https://ddkk.com/springboot/4-action/8.html
- 分类：Spring Boot 4 整合教程
- 分组：二、数据访问与持久化
- 日期：2025-12-08
用JPA/Hibernate写数据持久化的时候,最烦的就是要写一堆EntityManager、Transaction这些底层API,虽然功能强大但是代码复杂;后来有了Spring Data JPA,这些问题都解决了,它基于JPA做了封装,提供了Repository、方法名查询、Specification这些好东西,开发效率直接翻倍;现在Spring Boot 4出来了,整合JPA/Hibernate更是简单得不行,自动配置给你整得明明白白的,咱今天就聊聊Spring Boot 4咋整合JPA/Hibernate的。

其实JPA/Hibernate在Spring Boot里早就支持了,你只要加个`spring-boot-starter-data-jpa`依赖,基本上就能用;但是很多兄弟不知道里面的门道,也不知道咋用Repository、方法名查询、Specification这些高级功能,所以鹏磊今天就给兄弟们掰扯掰扯。

## 项目搭建和环境准备

### 创建Maven项目

首先你得有个Maven项目,用IDEA或者Eclipse都行,或者直接用Spring Initializr生成;项目结构大概是这样:

```plaintext
spring-boot-jpa-demo/
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
│   │       └── META-INF/
│   │           └── persistence.xml                  # JPA配置(可选)
│   └── test/
│       └── java/                                     # 测试代码目录
```

### pom.xml完整配置

这是最关键的,依赖配置不对后面全是坑;Spring Boot 4需要Java 17以上,而且JPA在Spring Boot 4中使用Jakarta Persistence API(不再是javax.persistence)。

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
    <artifactId>spring-boot-jpa-demo</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    <name>Spring Boot 4 JPA Demo</name>
    <description>Spring Boot 4整合JPA/Hibernate示例项目</description>
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
        <!-- Spring Boot Data JPA Starter: 包含Spring Data JPA、Hibernate等 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
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
CREATE DATABASE IF NOT EXISTS jpa_demo DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE jpa_demo;
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

Spring Boot 4的配置文件,数据源和JPA的配置都在这:

```yaml
spring:
  application:
    name: spring-boot-jpa-demo
  # 数据源配置
  datasource:
    driver-class-name: com.mysql.cj.jdbc.Driver  # MySQL 8.0+驱动
    url: jdbc:mysql://localhost:3306/jpa_demo?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true
    username: root  # 数据库用户名
    password: 123456  # 数据库密码
    # HikariCP连接池配置
    hikari:
      maximum-pool-size: 20  # 最大连接数
      minimum-idle: 5  # 最小空闲连接数
      connection-timeout: 30000  # 连接超时时间(毫秒)
      idle-timeout: 600000  # 空闲连接超时时间(毫秒)
      max-lifetime: 1800000  # 连接最大生命周期(毫秒)
  # JPA配置
  jpa:
    # Hibernate配置
    hibernate:
      # DDL策略:none-不自动创建,update-更新表结构,create-每次启动删除重建,create-drop-启动创建关闭删除
      ddl-auto: update  # 开发环境用update,生产环境用none或validate
      # 命名策略:物理命名策略,将驼峰命名转换为下划线命名
      naming:
        physical-strategy: org.hibernate.boot.model.naming.PhysicalNamingStrategyStandardImpl
        # 或者用Spring的命名策略
        # physical-strategy: org.springframework.boot.orm.jpa.hibernate.SpringPhysicalNamingStrategy
    # 显示SQL语句(开发环境开启,生产环境关闭)
    show-sql: true
    # 格式化SQL语句
    properties:
      hibernate:
        # 格式化SQL输出
        format_sql: true
        # 显示SQL注释
        use_sql_comments: true
        # 方言配置(通常自动检测,但可以手动指定)
        # dialect: org.hibernate.dialect.MySQL8Dialect
        # 批量操作配置
        jdbc:
          batch_size: 50  # 批量插入/更新大小
        order_inserts: true  # 排序插入语句
        order_updates: true  # 排序更新语句
        batch_versioned_data: true  # 批量版本化数据
# 日志配置
logging:
  level:
    root: INFO
    com.example.demo: DEBUG  # 项目包日志级别
    org.hibernate: DEBUG  # Hibernate日志级别
    org.hibernate.SQL: DEBUG  # SQL语句日志
    org.hibernate.type.descriptor.sql.BasicBinder: TRACE  # SQL参数日志
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
# 服务器配置
server:
  port: 8080  # 服务端口
```

## 创建实体类

JPA的实体类需要用注解来映射数据库表,Spring Boot 4使用Jakarta Persistence API:

### 用户实体类

```java
package com.example.demo.entity;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
/**
 * 用户实体类
 * @Entity注解标识这是一个JPA实体
 * @Table注解指定表名(如果表名和类名一致可以省略)
 */
@Data  // Lombok注解,自动生成getter/setter/toString等方法
@Entity
@Table(name = "user", indexes = {
    @Index(name = "idx_status", columnList = "status"),
    @Index(name = "uk_email", columnList = "email", unique = true)
})
public class User {
    /**
     * 主键ID
     * @Id注解标识主键
     * @GeneratedValue注解指定主键生成策略
     * strategy = GenerationType.IDENTITY表示使用数据库自增主键
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    /**
     * 用户名
     * @Column注解指定列名和约束
     */
    @Column(name = "name", nullable = false, length = 50)
    private String name;
    /**
     * 邮箱
     * unique = true表示唯一约束
     */
    @Column(name = "email", nullable = false, unique = true, length = 100)
    private String email;
    /**
     * 年龄
     */
    @Column(name = "age")
    private Integer age;
    /**
     * 状态:1-正常,0-禁用
     */
    @Column(name = "status", columnDefinition = "TINYINT(1) DEFAULT 1")
    private Integer status;
    /**
     * 创建时间
     * @CreationTimestamp注解在插入时自动填充(需要Hibernate 5.2+)
     * 或者用@PrePersist回调方法
     */
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    /**
     * 更新时间
     * @UpdateTimestamp注解在更新时自动填充
     * 或者用@PreUpdate回调方法
     */
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    /**
     * 一对多关联:一个用户有多个订单
     * @OneToMany注解定义一对多关系
     * mappedBy指定关联的维护方(在Order实体中)
     * cascade = CascadeType.ALL表示级联操作
     * fetch = FetchType.LAZY表示懒加载
     */
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private java.util.List<Order> orders;
    /**
     * 插入前回调:自动设置创建时间
     */
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    /**
     * 更新前回调:自动设置更新时间
     */
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

### 订单实体类

```java
package com.example.demo.entity;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
/**
 * 订单实体类
 */
@Data
@Entity
@Table(name = "order")
public class Order {
    /**
     * 主键ID
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    /**
     * 订单金额
     * @Column注解指定列类型和精度
     */
    @Column(name = "amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;
    /**
     * 订单状态
     */
    @Column(name = "status", length = 20)
    private String status;
    /**
     * 创建时间
     */
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    /**
     * 多对一关联:多个订单属于一个用户
     * @ManyToOne注解定义多对一关系
     * @JoinColumn注解指定外键列名
     * fetch = FetchType.LAZY表示懒加载
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    /**
     * 插入前回调:自动设置创建时间
     */
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = "PENDING";  // 默认状态
        }
    }
}
```

## Repository接口

Spring Data JPA最核心的就是Repository接口,它提供了基本的CRUD方法,你只需要继承它就行,不用写实现:

### 基础Repository

```java
package com.example.demo.repository;
import com.example.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
/**
 * 用户Repository接口
 * 继承JpaRepository后,自动拥有以下方法:
 * - save: 保存实体
 * - findById: 根据ID查询
 * - findAll: 查询所有
 * - deleteById: 根据ID删除
 * - count: 查询总数
 * - existsById: 判断是否存在
 * - 等等...
 * 
 * JpaRepository<实体类型, 主键类型>
 */
@Repository  // 标识这是一个Repository,会被Spring管理
public interface UserRepository extends JpaRepository<User, Long> {
    // 如果只需要基本的CRUD,继承JpaRepository就够了,不需要写任何方法
    // 如果需要自定义查询,可以在这里定义方法,Spring Data JPA会根据方法名自动生成查询
    // 例如:
    // List<User> findByName(String name);  // 根据name查询
    // Optional<User> findByEmail(String email);  // 根据email查询
}
```

### 方法名查询

Spring Data JPA支持根据方法名自动生成查询,非常方便:

```java
package com.example.demo.repository;
import com.example.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    /**
     * 根据name查询
     * Spring Data JPA会根据方法名自动生成: SELECT * FROM user WHERE name = ?
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
     * 根据name结尾查询
     * 自动生成: SELECT * FROM user WHERE name LIKE %?
     */
    List<User> findByNameEndingWith(String suffix);
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
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    /**
     * 使用JPQL查询(面向对象查询语言)
     * @Query注解定义查询语句
     * value是JPQL语句,使用实体类名和属性名
     */
    @Query("SELECT u FROM User u WHERE u.name = :name")
    List<User> findUsersByName(@Param("name") String name);
    /**
     * 使用原生SQL查询
     * nativeQuery = true表示使用原生SQL
     */
    @Query(value = "SELECT * FROM user WHERE name = :name AND status = :status", nativeQuery = true)
    List<User> findUsersByNameAndStatus(@Param("name") String name, @Param("status") Integer status);
    /**
     * 复杂查询示例
     */
    @Query("SELECT u FROM User u WHERE u.age >= :minAge AND u.status = :status ORDER BY u.createdAt DESC")
    List<User> findActiveUsersByMinAge(@Param("minAge") Integer minAge, @Param("status") Integer status);
    /**
     * 更新操作
     * @Modifying注解标识这是一个修改操作
     * @Transactional注解开启事务(也可以加在Service层)
     */
    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.status = :status WHERE u.id = :id")
    int updateUserStatus(@Param("id") Long id, @Param("status") Integer status);
    /**
     * 删除操作
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM User u WHERE u.status = :status")
    int deleteUsersByStatus(@Param("status") Integer status);
    /**
     * 统计查询
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.status = :status")
    long countUsersByStatus(@Param("status") Integer status);
}
```

## Service层

```java
package com.example.demo.service;
import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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
        return userRepository.findAll();
    }
    /**
     * 分页查询用户
     * Pageable是Spring Data的分页对象
     */
    public Page<User> getUsersByPage(Pageable pageable) {
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
        return userRepository.save(user);
    }
    /**
     * 批量保存用户
     */
    @Transactional
    public List<User> saveUsers(List<User> users) {
        return userRepository.saveAll(users);
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
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
     * GET /api/users/page?page=0&size=10&sort=id,desc
     */
    @GetMapping("/page")
    public ResponseEntity<Page<User>> getUsersByPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        // 创建排序对象
        Sort sort = sortDir.equalsIgnoreCase("desc") 
            ? Sort.by(sortBy).descending() 
            : Sort.by(sortBy).ascending();
        // 创建分页对象
        Pageable pageable = PageRequest.of(page, size, sort);
        // 执行分页查询
        Page<User> result = userService.getUsersByPage(pageable);
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

## 启动类配置

```java
package com.example.demo;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
/**
 * Spring Boot 4应用启动类
 * @EnableJpaRepositories注解启用JPA Repository支持
 * 如果不指定basePackages,默认扫描启动类所在包及其子包
 */
@SpringBootApplication
@EnableJpaRepositories(basePackages = "com.example.demo.repository")
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
        System.out.println("Spring Boot 4 JPA应用启动成功!");
    }
}
```

## 高级特性

### Specification动态查询

如果查询条件很复杂,可以用Specification来构建动态查询:

```java
package com.example.demo.repository;
import com.example.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
/**
 * 继承JpaSpecificationExecutor后,可以使用Specification进行动态查询
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {
    // 现在可以使用findAll(Specification)等方法
}
```

```java
package com.example.demo.service;
import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
@Service
public class UserSpecificationService {
    @Autowired
    private UserRepository userRepository;
    /**
     * 动态查询用户
     * 根据传入的条件动态构建查询
     */
    public Page<User> searchUsers(String name, String email, Integer status, Pageable pageable) {
        // 创建Specification对象
        Specification<User> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            // 如果name不为空,添加name条件
            if (name != null && !name.isEmpty()) {
                predicates.add(cb.like(root.get("name"), "%" + name + "%"));
            }
            // 如果email不为空,添加email条件
            if (email != null && !email.isEmpty()) {
                predicates.add(cb.equal(root.get("email"), email));
            }
            // 如果status不为空,添加status条件
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            // 组合所有条件(AND关系)
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        // 执行查询
        return userRepository.findAll(spec, pageable);
    }
}
```

### 关联查询

JPA支持关联查询,可以一次性查询关联的实体:

```java
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    /**
     * 查询用户及其订单
     * 使用JOIN FETCH可以避免N+1查询问题
     */
    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.orders WHERE u.id = :id")
    Optional<User> findByIdWithOrders(@Param("id") Long id);
    /**
     * 查询所有用户及其订单
     */
    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.orders")
    List<User> findAllWithOrders();
}
```

## 最佳实践和注意事项

### 1. DDL策略选择

- **开发环境**: 用`update`,自动更新表结构
- **生产环境**: 用`none`或`validate`,不要自动修改表结构

### 2. 懒加载和N+1问题

- 关联关系默认懒加载,避免一次性加载太多数据
- 使用`JOIN FETCH`可以避免N+1查询问题

### 3. 事务管理

- Service层方法加`@Transactional`注解
- 只读操作可以用`@Transactional(readOnly = true)`优化性能

### 4. 批量操作

- 配置`hibernate.jdbc.batch_size`提高批量插入/更新性能
- 大批量操作考虑用原生SQL或JDBC

### 5. 方法名查询规范

- 方法名要符合Spring Data JPA的命名规范
- 复杂查询建议用`@Query`注解,更清晰

### 6. 实体类设计

- 实体类要有无参构造函数
- 避免循环依赖
- 合理使用`@OneToMany`、`@ManyToOne`等关联注解

## 总结

Spring Boot 4整合JPA/Hibernate其实挺简单的,主要就这几步:

1. **加依赖**:`spring-boot-starter-data-jpa`
2. **配数据源**:在`application.yml`里配置数据库连接
3. **写实体类**:加`@Entity`、`@Id`、`@Column`等注解
4. **写Repository**:继承`JpaRepository`,基本CRUD不用写实现
5. **用方法名查询**:Spring Data JPA根据方法名自动生成查询
6. **用@Query注解**:写自定义JPQL或SQL查询
7. **配JPA**:在`application.yml`里配置Hibernate相关属性

JPA/Hibernate最大的优势就是面向对象,不用写SQL,实体类和数据库表自动映射,关联查询也很方便;Spring Data JPA又在此基础上做了封装,Repository接口不用写实现,方法名查询、分页、排序这些功能都内置了,开发效率直接翻倍。

兄弟们要是遇到啥问题,比如实体映射不对、懒加载异常、N+1查询问题这些,先检查注解配置对不对,再看日志输出,基本上都能解决;实在不行就看看官方文档,JPA和Hibernate的文档还是挺详细的。

好了,今天就聊到这,兄弟们有啥问题欢迎留言讨论!
