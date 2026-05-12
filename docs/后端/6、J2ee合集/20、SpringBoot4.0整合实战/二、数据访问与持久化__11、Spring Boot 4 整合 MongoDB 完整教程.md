# 11、Spring Boot 4 整合 MongoDB 完整教程
- 来源：https://ddkk.com/springboot/4-action/11.html
- 分类：Spring Boot 4 整合教程
- 分组：二、数据访问与持久化
- 日期：2025-12-08
用MongoDB做数据存储的时候,最烦的就是要写一堆连接管理、文档映射、查询构建这些底层代码,虽然MongoDB灵活但是集成起来麻烦;后来有了Spring Data MongoDB,这些问题都解决了,它提供了MongoTemplate、Repository、聚合查询这些好东西,开发效率直接翻倍;现在Spring Boot 4出来了,整合MongoDB更是简单得不行,自动配置给你整得明明白白的,咱今天就聊聊Spring Boot 4咋整合MongoDB的。

其实MongoDB在Spring Boot里早就支持了,你只要加个`spring-boot-starter-data-mongodb`依赖,基本上就能用;但是很多兄弟不知道里面的门道,也不知道咋用MongoTemplate、Repository、聚合查询这些高级功能,所以鹏磊今天就给兄弟们掰扯掰扯。

## 项目搭建和环境准备

### 创建Maven项目

首先你得有个Maven项目,用IDEA或者Eclipse都行,或者直接用Spring Initializr生成;项目结构大概是这样:

```plaintext
spring-boot-mongodb-demo/
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
│   └── test/
│       └── java/                                     # 测试代码目录
```

### pom.xml完整配置

这是最关键的,依赖配置不对后面全是坑;Spring Boot 4需要Java 17以上,而且Spring Boot 4使用MongoDB Java Driver 5.x版本。

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
    <artifactId>spring-boot-mongodb-demo</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    <name>Spring Boot 4 MongoDB Demo</name>
    <description>Spring Boot 4整合MongoDB示例项目</description>
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
        <!-- Spring Boot Data MongoDB Starter: 包含Spring Data MongoDB -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-mongodb</artifactId>
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

### MongoDB安装和启动

如果本地没有MongoDB,可以用Docker快速启动一个:

```bash
# 使用Docker启动MongoDB
docker run -d --name mongodb -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=123456 \
  mongo:latest
# 或者使用Docker Compose
# docker-compose.yml
version: '3.8'
services:
  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: 123456
    volumes:
      - mongodb_data:/data/db
volumes:
  mongodb_data:
```

### application.yml配置

Spring Boot 4的配置文件,MongoDB连接配置都在这:

```yaml
spring:
  application:
    name: spring-boot-mongodb-demo
  # MongoDB配置
  data:
    mongodb:
      # MongoDB连接URI(推荐方式)
      uri: mongodb://admin:123456@localhost:27017/test?authSource=admin
      # 或者分别配置(不推荐,但更灵活)
      # host: localhost
      # port: 27017
      # database: test
      # username: admin
      # password: 123456
      # authentication-database: admin
      # 连接池配置
      # 最大连接数
      # max-connection-pool-size: 100
      # 最小连接数
      # min-connection-pool-size: 10
      # 连接超时时间(毫秒)
      # connection-timeout-ms: 30000
      # 套接字超时时间(毫秒)
      # socket-timeout-ms: 30000
      # 自动索引创建(开发环境开启,生产环境关闭)
      auto-index-creation: true
# 日志配置
logging:
  level:
    root: INFO
    com.example.demo: DEBUG  # 项目包日志级别
    org.springframework.data.mongodb: DEBUG  # MongoDB日志级别
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
# 服务器配置
server:
  port: 8080  # 服务端口
```

## 创建实体类

MongoDB的实体类需要用注解来映射文档,比JPA简单一些:

### 用户实体类

```java
package com.example.demo.entity;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
/**
 * 用户实体类
 * @Document注解标识这是一个MongoDB文档
 * collection指定集合名称(如果集合名和类名一致可以省略)
 */
@Data  // Lombok注解,自动生成getter/setter/toString等方法
@Document(collection = "users")  // 指定集合名称
public class User {
    /**
     * 主键ID
     * @Id注解标识主键
     * MongoDB会自动生成ObjectId
     */
    @Id
    private String id;
    /**
     * 用户名
     * @Indexed注解创建索引,unique = true表示唯一索引
     */
    @Indexed(unique = true)
    private String name;
    /**
     * 邮箱
     * @Field注解指定字段名(如果字段名和属性名一致可以省略)
     */
    @Field("email")
    @Indexed
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
     * 地址列表(嵌套文档)
     */
    private List<Address> addresses;
    /**
     * 创建时间
     */
    @Field("created_at")
    private LocalDateTime createdAt;
    /**
     * 更新时间
     */
    @Field("updated_at")
    private LocalDateTime updatedAt;
    /**
     * 地址内部类
     */
    @Data
    public static class Address {
        private String province;
        private String city;
        private String street;
    }
}
```

### 订单实体类

```java
package com.example.demo.entity;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
/**
 * 订单实体类
 */
@Data
@Document(collection = "orders")
public class Order {
    /**
     * 主键ID
     */
    @Id
    private String id;
    /**
     * 用户ID
     */
    @Field("user_id")
    private String userId;
    /**
     * 订单金额
     */
    private BigDecimal amount;
    /**
     * 订单状态
     */
    private String status;
    /**
     * 订单项列表
     */
    private List<OrderItem> items;
    /**
     * 创建时间
     */
    @Field("created_at")
    private LocalDateTime createdAt;
    /**
     * 订单项内部类
     */
    @Data
    public static class OrderItem {
        private String productId;
        private String productName;
        private Integer quantity;
        private BigDecimal price;
    }
}
```

## MongoTemplate基础使用

MongoTemplate是Spring Data MongoDB的核心类,提供了所有MongoDB操作的抽象:

### 基础CRUD操作

```java
package com.example.demo.service;
import com.example.demo.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import java.util.List;
/**
 * MongoTemplate操作示例
 */
@Service
public class MongoTemplateService {
    @Autowired
    private MongoTemplate mongoTemplate;
    /**
     * 保存文档
     */
    public User save(User user) {
        return mongoTemplate.save(user);
    }
    /**
     * 插入文档
     */
    public User insert(User user) {
        return mongoTemplate.insert(user);
    }
    /**
     * 根据ID查询
     */
    public User findById(String id) {
        return mongoTemplate.findById(id, User.class);
    }
    /**
     * 查询所有
     */
    public List<User> findAll() {
        return mongoTemplate.findAll(User.class);
    }
    /**
     * 条件查询
     */
    public List<User> findByName(String name) {
        Query query = new Query(Criteria.where("name").is(name));
        return mongoTemplate.find(query, User.class);
    }
    /**
     * 复杂条件查询
     */
    public List<User> findUsers(String name, Integer minAge, Integer status) {
        Query query = new Query();
        // 添加条件
        if (name != null) {
            query.addCriteria(Criteria.where("name").regex(name, "i"));  // 模糊查询,不区分大小写
        }
        if (minAge != null) {
            query.addCriteria(Criteria.where("age").gte(minAge));  // 大于等于
        }
        if (status != null) {
            query.addCriteria(Criteria.where("status").is(status));
        }
        return mongoTemplate.find(query, User.class);
    }
    /**
     * 分页查询
     */
    public List<User> findUsersWithPage(int page, int size) {
        Query query = new Query();
        // 跳过记录数
        query.skip((long) page * size);
        // 限制返回数量
        query.limit(size);
        return mongoTemplate.find(query, User.class);
    }
    /**
     * 排序查询
     */
    public List<User> findUsersWithSort() {
        Query query = new Query();
        // 按创建时间倒序
        query.with(org.springframework.data.domain.Sort.by(
            org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));
        return mongoTemplate.find(query, User.class);
    }
    /**
     * 更新文档
     */
    public void updateUser(String id, String name, Integer age) {
        Query query = new Query(Criteria.where("id").is(id));
        Update update = new Update();
        update.set("name", name);
        update.set("age", age);
        mongoTemplate.updateFirst(query, update, User.class);
    }
    /**
     * 更新多个文档
     */
    public void updateUsersByStatus(Integer oldStatus, Integer newStatus) {
        Query query = new Query(Criteria.where("status").is(oldStatus));
        Update update = new Update();
        update.set("status", newStatus);
        mongoTemplate.updateMulti(query, update, User.class);
    }
    /**
     * 删除文档
     */
    public void deleteById(String id) {
        Query query = new Query(Criteria.where("id").is(id));
        mongoTemplate.remove(query, User.class);
    }
    /**
     * 删除多个文档
     */
    public void deleteByStatus(Integer status) {
        Query query = new Query(Criteria.where("status").is(status));
        mongoTemplate.remove(query, User.class);
    }
    /**
     * 统计文档数量
     */
    public long count() {
        return mongoTemplate.count(new Query(), User.class);
    }
    /**
     * 条件统计
     */
    public long countByStatus(Integer status) {
        Query query = new Query(Criteria.where("status").is(status));
        return mongoTemplate.count(query, User.class);
    }
}
```

## Repository接口

Spring Data MongoDB提供了Repository接口,和JPA类似:

### 基础Repository

```java
package com.example.demo.repository;
import com.example.demo.entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
/**
 * 用户Repository接口
 * 继承MongoRepository后,自动拥有以下方法:
 * - save: 保存文档
 * - findById: 根据ID查询
 * - findAll: 查询所有
 * - deleteById: 根据ID删除
 * - count: 查询总数
 * - existsById: 判断是否存在
 * - 等等...
 * 
 * MongoRepository<实体类型, 主键类型>
 */
@Repository  // 标识这是一个Repository,会被Spring管理
public interface UserRepository extends MongoRepository<User, String> {
    // 如果只需要基本的CRUD,继承MongoRepository就够了,不需要写任何方法
    // 如果需要自定义查询,可以在这里定义方法,Spring Data MongoDB会根据方法名自动生成查询
    // 例如:
    // List<User> findByName(String name);  // 根据name查询
    // Optional<User> findByEmail(String email);  // 根据email查询
}
```

### 方法名查询

Spring Data MongoDB支持根据方法名自动生成查询:

```java
package com.example.demo.repository;
import com.example.demo.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
@Repository
public interface UserRepository extends MongoRepository<User, String> {
    /**
     * 根据name查询
     * Spring Data MongoDB会根据方法名自动生成查询
     */
    List<User> findByName(String name);
    /**
     * 根据name和status查询
     */
    List<User> findByNameAndStatus(String name, Integer status);
    /**
     * 根据name模糊查询
     */
    List<User> findByNameContaining(String name);
    /**
     * 根据name开头查询
     */
    List<User> findByNameStartingWith(String prefix);
    /**
     * 根据email查询单个用户
     */
    Optional<User> findByEmail(String email);
    /**
     * 根据status查询,并按id倒序
     */
    List<User> findByStatusOrderByIdDesc(Integer status);
    /**
     * 根据age范围查询
     */
    List<User> findByAgeBetween(Integer minAge, Integer maxAge);
    /**
     * 根据age大于等于查询
     */
    List<User> findByAgeGreaterThanEqual(Integer age);
    /**
     * 分页查询
     */
    Page<User> findByStatus(Integer status, Pageable pageable);
    /**
     * 统计指定status的用户数量
     */
    long countByStatus(Integer status);
    /**
     * 判断指定email是否存在
     */
    boolean existsByEmail(String email);
    /**
     * 删除指定status的用户
     */
    void deleteByStatus(Integer status);
}
```

### @Query注解查询

如果方法名查询不够用,可以用@Query注解写自定义查询:

```java
package com.example.demo.repository;
import com.example.demo.entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
@Repository
public interface UserRepository extends MongoRepository<User, String> {
    /**
     * 使用MongoDB查询语言
     * ?0表示第一个参数,?1表示第二个参数
     */
    @Query("{ 'name': ?0, 'status': ?1 }")
    List<User> findUsersByNameAndStatus(String name, Integer status);
    /**
     * 使用参数名绑定
     */
    @Query("{ 'name': :#{#name}, 'age': { $gte: :#{#minAge} } }")
    List<User> findUsersByNameAndMinAge(@Param("name") String name, @Param("minAge") Integer minAge);
    /**
     * 复杂查询示例
     */
    @Query("{ 'status': ?0, 'age': { $gte: ?1, $lte: ?2 } }")
    List<User> findActiveUsersByAgeRange(Integer status, Integer minAge, Integer maxAge);
    /**
     * 只返回指定字段
     */
    @Query(value = "{ 'status': ?0 }", fields = "{ 'name': 1, 'email': 1 }")
    List<User> findUsersByStatusWithFields(Integer status);
    /**
     * 排序查询
     */
    @Query("{ 'status': ?0 }")
    List<User> findUsersByStatusOrderByCreatedAtDesc(Integer status);
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
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
/**
 * 用户服务类
 */
@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;
    /**
     * 根据ID查询用户
     */
    public Optional<User> getUserById(String id) {
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
     */
    public Page<User> getUsersByPage(int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc") 
            ? Sort.by(sortBy).descending() 
            : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
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
     */
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
        return userRepository.saveAll(users);
    }
    /**
     * 删除用户
     */
    public void deleteUser(String id) {
        userRepository.deleteById(id);
    }
    /**
     * 根据status删除用户
     */
    public void deleteUsersByStatus(Integer status) {
        userRepository.deleteByStatus(status);
    }
}
```

## 聚合查询

MongoDB的聚合查询功能很强大,Spring Data MongoDB也提供了支持:

```java
package com.example.demo.service;
import com.example.demo.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Service;
import java.util.List;
import static org.springframework.data.mongodb.core.aggregation.Aggregation.*;
/**
 * MongoDB聚合查询示例
 */
@Service
public class UserAggregationService {
    @Autowired
    private MongoTemplate mongoTemplate;
    /**
     * 按状态分组统计用户数量
     */
    public List<StatusCount> countUsersByStatus() {
        Aggregation aggregation = newAggregation(
            group("status").count().as("count"),  // 按status分组并计数
            project("count").and("status").previousOperation(),  // 投影字段
            sort(org.springframework.data.domain.Sort.Direction.DESC, "count")  // 按count倒序
        );
        AggregationResults<StatusCount> results = mongoTemplate.aggregate(
            aggregation, "users", StatusCount.class);
        return results.getMappedResults();
    }
    /**
     * 按年龄范围分组统计
     */
    public List<AgeGroupCount> countUsersByAgeGroup() {
        Aggregation aggregation = newAggregation(
            project("age")  // 只投影age字段
                .andExpression("floor(age / 10) * 10").as("ageGroup"),  // 计算年龄组
            group("ageGroup").count().as("count"),  // 按年龄组分组
            project("count").and("ageGroup").previousOperation(),  // 投影
            sort(org.springframework.data.domain.Sort.Direction.ASC, "ageGroup")  // 排序
        );
        AggregationResults<AgeGroupCount> results = mongoTemplate.aggregate(
            aggregation, "users", AgeGroupCount.class);
        return results.getMappedResults();
    }
    /**
     * 状态统计结果类
     */
    public static class StatusCount {
        private Integer status;
        private Long count;
        // getter和setter
        public Integer getStatus() { return status; }
        public void setStatus(Integer status) { this.status = status; }
        public Long getCount() { return count; }
        public void setCount(Long count) { this.count = count; }
    }
    /**
     * 年龄组统计结果类
     */
    public static class AgeGroupCount {
        private Integer ageGroup;
        private Long count;
        // getter和setter
        public Integer getAgeGroup() { return ageGroup; }
        public void setAgeGroup(Integer ageGroup) { this.ageGroup = ageGroup; }
        public Long getCount() { return count; }
        public void setCount(Long count) { this.count = count; }
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
    public ResponseEntity<User> getUserById(@PathVariable String id) {
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
    public ResponseEntity<User> updateUser(@PathVariable String id, @RequestBody User user) {
        Optional<User> existingUser = userService.getUserById(id);
        if (existingUser.isPresent()) {
            user.setId(id);
            User updatedUser = userService.saveUser(user);
            return ResponseEntity.ok(updatedUser);
        }
        return ResponseEntity.notFound().build();
    }
    /**
     * 删除用户
     * DELETE /api/users/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable String id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
```

## 启动类

```java
package com.example.demo;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;
/**
 * Spring Boot 4应用启动类
 * @EnableMongoRepositories注解启用MongoDB Repository支持
 * 如果不指定basePackages,默认扫描启动类所在包及其子包
 */
@SpringBootApplication
@EnableMongoRepositories(basePackages = "com.example.demo.repository")
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
        System.out.println("Spring Boot 4 MongoDB应用启动成功!");
    }
}
```

## 最佳实践和注意事项

### 1. 索引设计

- 为常用查询字段创建索引
- 使用`@Indexed`注解自动创建索引
- 定期检查索引使用情况,删除无用索引

### 2. 文档设计

- 遵循MongoDB文档设计原则
- 合理使用嵌套文档和数组
- 避免文档过大(建议小于16MB)

### 3. 查询优化

- 使用投影只返回需要的字段
- 合理使用分页,避免一次性查询大量数据
- 使用聚合查询处理复杂统计

### 4. 连接管理

- 合理配置连接池大小
- 生产环境使用连接池,避免频繁创建连接

### 5. 事务支持

- MongoDB 4.0+支持多文档事务
- 需要副本集或分片集群
- 谨慎使用,影响性能

### 6. 数据迁移

- 使用MongoDB的迁移工具
- 注意数据格式兼容性
- 做好备份和回滚准备

## 总结

Spring Boot 4整合MongoDB其实挺简单的,主要就这几步:

1. **加依赖**:`spring-boot-starter-data-mongodb`
2. **配连接**:在`application.yml`里配置MongoDB连接URI
3. **写实体类**:加`@Document`、`@Id`、`@Field`等注解
4. **写Repository**:继承`MongoRepository`,基本CRUD不用写实现
5. **用方法名查询**:Spring Data MongoDB根据方法名自动生成查询
6. **用@Query注解**:写自定义MongoDB查询
7. **用聚合查询**:处理复杂统计和分析

MongoDB最大的优势就是灵活,文档模型适合快速开发,支持复杂查询和聚合;而且Spring Boot的自动配置把大部分配置都给你整好了,基本上开箱即用。

兄弟们要是遇到啥问题,比如连接失败、查询报错、索引不生效这些,先检查配置对不对,再看日志输出,基本上都能解决;实在不行就看看官方文档,Spring Data MongoDB的文档还是挺详细的。

好了,今天就聊到这,兄弟们有啥问题欢迎留言讨论!
