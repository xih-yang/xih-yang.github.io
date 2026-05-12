# 12、Spring Boot 4 整合Elasticsearch 完整教程
- 来源：https://ddkk.com/springboot/4-action/12.html
- 分类：Spring Boot 4 整合教程
- 分组：二、数据访问与持久化
- 日期：2025-12-08
用Elasticsearch做全文搜索的时候,最烦的就是要写一堆连接管理、索引映射、查询构建这些底层代码,虽然Elasticsearch功能强大但是集成起来麻烦;后来有了Spring Data Elasticsearch,这些问题都解决了,它提供了ElasticsearchTemplate、Repository、聚合查询这些好东西,开发效率直接翻倍;现在Spring Boot 4出来了,整合Elasticsearch更是简单得不行,自动配置给你整得明明白白的,咱今天就聊聊Spring Boot 4咋整合Elasticsearch的。

其实Elasticsearch在Spring Boot里早就支持了,你只要加个`spring-boot-starter-data-elasticsearch`依赖,基本上就能用;但是很多兄弟不知道里面的门道,也不知道咋用ElasticsearchTemplate、Repository、聚合查询这些高级功能,所以鹏磊今天就给兄弟们掰扯掰扯。

## 项目搭建和环境准备

### 创建Maven项目

首先你得有个Maven项目,用IDEA或者Eclipse都行,或者直接用Spring Initializr生成;项目结构大概是这样:

```plaintext
spring-boot-elasticsearch-demo/
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

这是最关键的,依赖配置不对后面全是坑;Spring Boot 4需要Java 17以上,而且Spring Boot 4使用Elasticsearch Java Client 8.x版本。

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
    <artifactId>spring-boot-elasticsearch-demo</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    <name>Spring Boot 4 Elasticsearch Demo</name>
    <description>Spring Boot 4整合Elasticsearch示例项目</description>
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
        <!-- Spring Boot Data Elasticsearch Starter: 包含Spring Data Elasticsearch -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-elasticsearch</artifactId>
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

### Elasticsearch安装和启动

如果本地没有Elasticsearch,可以用Docker快速启动一个:

```bash
# 使用Docker启动Elasticsearch
docker run -d --name elasticsearch -p 9200:9200 -p 9300:9300 \
  -e "discovery.type=single-node" \
  -e "xpack.security.enabled=false" \
  -e "ES_JAVA_OPTS=-Xms512m -Xmx512m" \
  docker.elastic.co/elasticsearch/elasticsearch:8.18.0
# 或者使用Docker Compose
# docker-compose.yml
version: '3.8'
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.18.0
    ports:
      - "9200:9200"
      - "9300:9300"
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - ES_JAVA_OPTS=-Xms512m -Xmx512m
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
volumes:
  elasticsearch_data:
```

### application.yml配置

Spring Boot 4的配置文件,Elasticsearch连接配置都在这:

```yaml
spring:
  application:
    name: spring-boot-elasticsearch-demo
  # Elasticsearch配置
  elasticsearch:
    # Elasticsearch连接URI
    uris: http://localhost:9200
    # 连接超时时间(毫秒)
    connection-timeout: 5s
    # 套接字超时时间(毫秒)
    socket-timeout: 60s
    # 用户名和密码(如果启用了安全认证)
    # username: elastic
    # password: yourpassword
    # 是否启用SSL
    # ssl:
    #   enabled: false
    #   certificate-authorities: /path/to/ca.crt
# 日志配置
logging:
  level:
    root: INFO
    com.example.demo: DEBUG  # 项目包日志级别
    org.springframework.data.elasticsearch: DEBUG  # Elasticsearch日志级别
    org.elasticsearch: DEBUG  # Elasticsearch客户端日志
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
# 服务器配置
server:
  port: 8080  # 服务端口
```

## 创建实体类

Elasticsearch的实体类需要用注解来映射索引,和JPA类似:

### 文章实体类

```java
package com.example.demo.entity;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
/**
 * 文章实体类
 * @Document注解标识这是一个Elasticsearch文档
 * indexName指定索引名称
 * createIndex表示是否自动创建索引
 */
@Data  // Lombok注解,自动生成getter/setter/toString等方法
@Document(indexName = "articles", createIndex = true)  // 指定索引名称
public class Article {
    /**
     * 主键ID
     * @Id注解标识主键
     */
    @Id
    private String id;
    /**
     * 标题
     * @Field注解指定字段类型和属性
     * type = FieldType.Text表示文本类型,支持全文搜索
     * analyzer指定分析器
     */
    @Field(type = FieldType.Text, analyzer = "ik_max_word", searchAnalyzer = "ik_smart")
    private String title;
    /**
     * 内容
     */
    @Field(type = FieldType.Text, analyzer = "ik_max_word", searchAnalyzer = "ik_smart")
    private String content;
    /**
     * 作者
     * type = FieldType.Keyword表示关键字类型,不分词,用于精确匹配
     */
    @Field(type = FieldType.Keyword)
    private String author;
    /**
     * 分类
     */
    @Field(type = FieldType.Keyword)
    private String category;
    /**
     * 标签列表
     */
    @Field(type = FieldType.Keyword)
    private List<String> tags;
    /**
     * 浏览量
     * type = FieldType.Long表示长整型
     */
    @Field(type = FieldType.Long)
    private Long views;
    /**
     * 创建时间
     * type = FieldType.Date表示日期类型
     */
    @Field(type = FieldType.Date, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    /**
     * 更新时间
     */
    @Field(type = FieldType.Date, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
}
```

### 用户实体类

```java
package com.example.demo.entity;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;
import lombok.Data;
import java.time.LocalDateTime;
/**
 * 用户实体类
 */
@Data
@Document(indexName = "users", createIndex = true)
public class User {
    /**
     * 主键ID
     */
    @Id
    private String id;
    /**
     * 用户名
     */
    @Field(type = FieldType.Keyword)
    private String username;
    /**
     * 邮箱
     */
    @Field(type = FieldType.Keyword)
    private String email;
    /**
     * 年龄
     * type = FieldType.Integer表示整型
     */
    @Field(type = FieldType.Integer)
    private Integer age;
    /**
     * 状态:1-正常,0-禁用
     */
    @Field(type = FieldType.Integer)
    private Integer status;
    /**
     * 创建时间
     */
    @Field(type = FieldType.Date, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
}
```

## ElasticsearchTemplate基础使用

ElasticsearchTemplate是Spring Data Elasticsearch的核心类,提供了所有Elasticsearch操作的抽象:

### 基础CRUD操作

```java
package com.example.demo.service;
import com.example.demo.entity.Article;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.data.elasticsearch.core.query.Query;
import org.springframework.data.elasticsearch.core.query.StringQuery;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;
/**
 * ElasticsearchTemplate操作示例
 */
@Service
public class ElasticsearchTemplateService {
    @Autowired
    private ElasticsearchOperations elasticsearchOperations;
    /**
     * 保存文档
     */
    public Article save(Article article) {
        return elasticsearchOperations.save(article);
    }
    /**
     * 批量保存文档
     */
    public Iterable<Article> saveAll(List<Article> articles) {
        return elasticsearchOperations.save(articles);
    }
    /**
     * 根据ID查询
     */
    public Article findById(String id) {
        return elasticsearchOperations.get(id, Article.class);
    }
    /**
     * 查询所有
     */
    public List<Article> findAll() {
        // 创建匹配所有文档的查询
        Query query = org.springframework.data.elasticsearch.core.query.Query.findAll();
        SearchHits<Article> searchHits = elasticsearchOperations.search(query, Article.class);
        return searchHits.stream()
            .map(SearchHit::getContent)
            .collect(Collectors.toList());
    }
    /**
     * 条件查询
     */
    public List<Article> findByTitle(String title) {
        // 使用字符串查询
        Query query = new StringQuery("{\"match\": {\"title\": \"" + title + "\"}}");
        SearchHits<Article> searchHits = elasticsearchOperations.search(query, Article.class);
        return searchHits.stream()
            .map(SearchHit::getContent)
            .collect(Collectors.toList());
    }
    /**
     * 分页查询
     */
    public Page<Article> findWithPage(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Query query = org.springframework.data.elasticsearch.core.query.Query.findAll()
            .setPageable(pageable);
        SearchHits<Article> searchHits = elasticsearchOperations.search(query, Article.class);
        return org.springframework.data.elasticsearch.core.SearchHitSupport.searchPageFor(
            searchHits, pageable);
    }
    /**
     * 删除文档
     */
    public void deleteById(String id) {
        elasticsearchOperations.delete(id, Article.class);
    }
    /**
     * 删除所有文档
     */
    public void deleteAll() {
        elasticsearchOperations.delete(org.springframework.data.elasticsearch.core.query.Query.findAll(), Article.class);
    }
    /**
     * 统计文档数量
     */
    public long count() {
        return elasticsearchOperations.count(org.springframework.data.elasticsearch.core.query.Query.findAll(), Article.class);
    }
}
```

### 高级查询

```java
package com.example.demo.service;
import com.example.demo.entity.Article;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.data.elasticsearch.core.query.Criteria;
import org.springframework.data.elasticsearch.core.query.CriteriaQuery;
import org.springframework.data.elasticsearch.core.query.Query;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;
/**
 * Elasticsearch高级查询示例
 */
@Service
public class ElasticsearchAdvancedQueryService {
    @Autowired
    private ElasticsearchOperations elasticsearchOperations;
    /**
     * 多条件查询
     */
    public List<Article> searchArticles(String keyword, String author, String category) {
        // 创建Criteria查询
        Criteria criteria = new Criteria();
        // 如果有关键字,添加标题或内容匹配
        if (keyword != null && !keyword.isEmpty()) {
            criteria = criteria.and(
                new Criteria("title").contains(keyword)
                    .or(new Criteria("content").contains(keyword))
            );
        }
        // 如果指定作者,添加作者匹配
        if (author != null && !author.isEmpty()) {
            criteria = criteria.and(new Criteria("author").is(author));
        }
        // 如果指定分类,添加分类匹配
        if (category != null && !category.isEmpty()) {
            criteria = criteria.and(new Criteria("category").is(category));
        }
        // 创建查询
        Query query = new CriteriaQuery(criteria);
        SearchHits<Article> searchHits = elasticsearchOperations.search(query, Article.class);
        return searchHits.stream()
            .map(SearchHit::getContent)
            .collect(Collectors.toList());
    }
    /**
     * 范围查询
     */
    public List<Article> findByViewsRange(Long minViews, Long maxViews) {
        Criteria criteria = new Criteria("views")
            .greaterThanEqual(minViews)
            .lessThanEqual(maxViews);
        Query query = new CriteriaQuery(criteria);
        SearchHits<Article> searchHits = elasticsearchOperations.search(query, Article.class);
        return searchHits.stream()
            .map(SearchHit::getContent)
            .collect(Collectors.toList());
    }
    /**
     * 排序查询
     */
    public List<Article> findAllOrderByViewsDesc() {
        Query query = org.springframework.data.elasticsearch.core.query.Query.findAll()
            .addSort(org.springframework.data.domain.Sort.by(
                org.springframework.data.domain.Sort.Direction.DESC, "views"));
        SearchHits<Article> searchHits = elasticsearchOperations.search(query, Article.class);
        return searchHits.stream()
            .map(SearchHit::getContent)
            .collect(Collectors.toList());
    }
    /**
     * 高亮查询
     */
    public List<Article> searchWithHighlight(String keyword) {
        Query query = new CriteriaQuery(new Criteria("title").contains(keyword)
            .or(new Criteria("content").contains(keyword)));
        // 设置高亮字段
        query.setHighlightQuery(
            new org.springframework.data.elasticsearch.core.query.highlight.HighlightQuery.HighlightQueryBuilder()
                .withField("title")
                .withField("content")
                .build());
        SearchHits<Article> searchHits = elasticsearchOperations.search(query, Article.class);
        return searchHits.stream()
            .map(SearchHit::getContent)
            .collect(Collectors.toList());
    }
}
```

## Repository接口

Spring Data Elasticsearch提供了Repository接口,和JPA类似:

### 基础Repository

```java
package com.example.demo.repository;
import com.example.demo.entity.Article;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
/**
 * 文章Repository接口
 * 继承ElasticsearchRepository后,自动拥有以下方法:
 * - save: 保存文档
 * - findById: 根据ID查询
 * - findAll: 查询所有
 * - deleteById: 根据ID删除
 * - count: 查询总数
 * - existsById: 判断是否存在
 * - 等等...
 * 
 * ElasticsearchRepository<实体类型, 主键类型>
 */
@Repository  // 标识这是一个Repository,会被Spring管理
public interface ArticleRepository extends ElasticsearchRepository<Article, String> {
    // 如果只需要基本的CRUD,继承ElasticsearchRepository就够了,不需要写任何方法
    // 如果需要自定义查询,可以在这里定义方法,Spring Data Elasticsearch会根据方法名自动生成查询
    // 例如:
    // List<Article> findByTitle(String title);  // 根据title查询
    // List<Article> findByAuthor(String author);  // 根据author查询
}
```

### 方法名查询

Spring Data Elasticsearch支持根据方法名自动生成查询:

```java
package com.example.demo.repository;
import com.example.demo.entity.Article;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.data.elasticsearch.annotations.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
@Repository
public interface ArticleRepository extends ElasticsearchRepository<Article, String> {
    /**
     * 根据title查询
     * Spring Data Elasticsearch会根据方法名自动生成查询
     */
    List<Article> findByTitle(String title);
    /**
     * 根据title和author查询
     */
    List<Article> findByTitleAndAuthor(String title, String author);
    /**
     * 根据title模糊查询
     */
    List<Article> findByTitleContaining(String title);
    /**
     * 根据author查询
     */
    List<Article> findByAuthor(String author);
    /**
     * 根据category查询
     */
    List<Article> findByCategory(String category);
    /**
     * 根据views范围查询
     */
    List<Article> findByViewsBetween(Long minViews, Long maxViews);
    /**
     * 根据views大于等于查询
     */
    List<Article> findByViewsGreaterThanEqual(Long views);
    /**
     * 分页查询
     */
    Page<Article> findByCategory(String category, Pageable pageable);
    /**
     * 统计指定category的文章数量
     */
    long countByCategory(String category);
    /**
     * 判断指定title是否存在
     */
    boolean existsByTitle(String title);
}
```

### @Query注解查询

如果方法名查询不够用,可以用@Query注解写自定义查询:

```java
package com.example.demo.repository;
import com.example.demo.entity.Article;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.annotations.Query;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
@Repository
public interface ArticleRepository extends ElasticsearchRepository<Article, String> {
    /**
     * 使用Elasticsearch查询DSL
     * ?0表示第一个参数,?1表示第二个参数
     */
    @Query("{\"match\": {\"title\": \"?0\"}}")
    List<Article> findByTitleUsingQuery(String title);
    /**
     * 使用参数名绑定
     */
    @Query("{\"bool\": {\"must\": [{\"match\": {\"title\": \":keyword\"}}, {\"match\": {\"author\": \":author\"}}]}}")
    List<Article> searchByTitleAndAuthor(
        @Param("keyword") String keyword, 
        @Param("author") String author);
    /**
     * 复杂查询示例
     */
    @Query("{\"bool\": {\"must\": [{\"match\": {\"category\": \"?0\"}}, {\"range\": {\"views\": {\"gte\": ?1, \"lte\": ?2}}}]}}")
    List<Article> findArticlesByCategoryAndViewsRange(
        String category, 
        Long minViews, 
        Long maxViews);
    /**
     * 分页查询
     */
    @Query("{\"match\": {\"category\": \"?0\"}}")
    Page<Article> findArticlesByCategory(String category, Pageable pageable);
}
```

## Service层

```java
package com.example.demo.service;
import com.example.demo.entity.Article;
import com.example.demo.repository.ArticleRepository;
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
 * 文章服务类
 */
@Service
public class ArticleService {
    @Autowired
    private ArticleRepository articleRepository;
    /**
     * 根据ID查询文章
     */
    public Optional<Article> getArticleById(String id) {
        return articleRepository.findById(id);
    }
    /**
     * 查询所有文章
     */
    public List<Article> getAllArticles() {
        return (List<Article>) articleRepository.findAll();
    }
    /**
     * 分页查询文章
     */
    public Page<Article> getArticlesByPage(int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc") 
            ? Sort.by(sortBy).descending() 
            : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return articleRepository.findAll(pageable);
    }
    /**
     * 根据title查询文章
     */
    public List<Article> getArticlesByTitle(String title) {
        return articleRepository.findByTitleContaining(title);
    }
    /**
     * 根据author查询文章
     */
    public List<Article> getArticlesByAuthor(String author) {
        return articleRepository.findByAuthor(author);
    }
    /**
     * 根据category查询文章
     */
    public List<Article> getArticlesByCategory(String category) {
        return articleRepository.findByCategory(category);
    }
    /**
     * 保存文章
     */
    public Article saveArticle(Article article) {
        // 设置创建时间和更新时间
        if (article.getId() == null) {
            article.setCreatedAt(LocalDateTime.now());
        }
        article.setUpdatedAt(LocalDateTime.now());
        // 设置默认浏览量
        if (article.getViews() == null) {
            article.setViews(0L);
        }
        return articleRepository.save(article);
    }
    /**
     * 批量保存文章
     */
    public List<Article> saveArticles(List<Article> articles) {
        articles.forEach(article -> {
            if (article.getId() == null) {
                article.setCreatedAt(LocalDateTime.now());
            }
            article.setUpdatedAt(LocalDateTime.now());
            if (article.getViews() == null) {
                article.setViews(0L);
            }
        });
        return (List<Article>) articleRepository.saveAll(articles);
    }
    /**
     * 删除文章
     */
    public void deleteArticle(String id) {
        articleRepository.deleteById(id);
    }
    /**
     * 搜索文章
     */
    public List<Article> searchArticles(String keyword) {
        return articleRepository.findByTitleContaining(keyword);
    }
}
```

## Controller层

```java
package com.example.demo.controller;
import com.example.demo.entity.Article;
import com.example.demo.service.ArticleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;
/**
 * 文章控制器
 */
@RestController
@RequestMapping("/api/articles")
public class ArticleController {
    @Autowired
    private ArticleService articleService;
    /**
     * 根据ID查询文章
     * GET /api/articles/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<Article> getArticleById(@PathVariable String id) {
        Optional<Article> article = articleService.getArticleById(id);
        return article.map(ResponseEntity::ok)
                   .orElse(ResponseEntity.notFound().build());
    }
    /**
     * 查询所有文章
     * GET /api/articles
     */
    @GetMapping
    public ResponseEntity<List<Article>> getAllArticles() {
        List<Article> articles = articleService.getAllArticles();
        return ResponseEntity.ok(articles);
    }
    /**
     * 分页查询文章
     * GET /api/articles/page?page=0&size=10&sortBy=views&sortDir=desc
     */
    @GetMapping("/page")
    public ResponseEntity<Page<Article>> getArticlesByPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "views") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        Page<Article> result = articleService.getArticlesByPage(page, size, sortBy, sortDir);
        return ResponseEntity.ok(result);
    }
    /**
     * 搜索文章
     * GET /api/articles/search?keyword=xxx
     */
    @GetMapping("/search")
    public ResponseEntity<List<Article>> searchArticles(@RequestParam String keyword) {
        List<Article> articles = articleService.searchArticles(keyword);
        return ResponseEntity.ok(articles);
    }
    /**
     * 根据分类查询文章
     * GET /api/articles/category/{category}
     */
    @GetMapping("/category/{category}")
    public ResponseEntity<List<Article>> getArticlesByCategory(@PathVariable String category) {
        List<Article> articles = articleService.getArticlesByCategory(category);
        return ResponseEntity.ok(articles);
    }
    /**
     * 创建文章
     * POST /api/articles
     */
    @PostMapping
    public ResponseEntity<Article> createArticle(@RequestBody Article article) {
        Article savedArticle = articleService.saveArticle(article);
        return ResponseEntity.ok(savedArticle);
    }
    /**
     * 更新文章
     * PUT /api/articles/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<Article> updateArticle(@PathVariable String id, @RequestBody Article article) {
        Optional<Article> existingArticle = articleService.getArticleById(id);
        if (existingArticle.isPresent()) {
            article.setId(id);
            Article updatedArticle = articleService.saveArticle(article);
            return ResponseEntity.ok(updatedArticle);
        }
        return ResponseEntity.notFound().build();
    }
    /**
     * 删除文章
     * DELETE /api/articles/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteArticle(@PathVariable String id) {
        articleService.deleteArticle(id);
        return ResponseEntity.noContent().build();
    }
}
```

## 启动类

```java
package com.example.demo;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.elasticsearch.repository.config.EnableElasticsearchRepositories;
/**
 * Spring Boot 4应用启动类
 * @EnableElasticsearchRepositories注解启用Elasticsearch Repository支持
 * 如果不指定basePackages,默认扫描启动类所在包及其子包
 */
@SpringBootApplication
@EnableElasticsearchRepositories(basePackages = "com.example.demo.repository")
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
        System.out.println("Spring Boot 4 Elasticsearch应用启动成功!");
    }
}
```

## 最佳实践和注意事项

### 1. 索引设计

- 合理设计索引映射,选择合适的字段类型
- 为常用查询字段创建索引
- 使用`@Document`注解自动创建索引

### 2. 分词器配置

- 中文搜索推荐使用IK分词器
- 根据业务需求选择合适的分词策略
- 索引时用`ik_max_word`,搜索时用`ik_smart`

### 3. 查询优化

- 使用投影只返回需要的字段
- 合理使用分页,避免一次性查询大量数据
- 使用批量操作提高性能

### 4. 连接管理

- 合理配置连接池大小
- 生产环境使用连接池,避免频繁创建连接

### 5. 数据同步

- 考虑使用Logstash或Canal同步数据库数据到Elasticsearch
- 实现增量更新,避免全量重建索引

### 6. 性能优化

- 合理设置分片和副本数
- 定期优化索引,删除无用数据
- 监控集群状态和性能指标

## 总结

Spring Boot 4整合Elasticsearch其实挺简单的,主要就这几步:

1. **加依赖**:`spring-boot-starter-data-elasticsearch`
2. **配连接**:在`application.yml`里配置Elasticsearch连接URI
3. **写实体类**:加`@Document`、`@Id`、`@Field`等注解
4. **写Repository**:继承`ElasticsearchRepository`,基本CRUD不用写实现
5. **用方法名查询**:Spring Data Elasticsearch根据方法名自动生成查询
6. **用@Query注解**:写自定义Elasticsearch查询DSL
7. **用ElasticsearchTemplate**:处理复杂查询和操作

Elasticsearch最大的优势就是全文搜索能力强,支持复杂的查询和聚合,适合做搜索引擎、日志分析、数据分析等场景;而且Spring Boot的自动配置把大部分配置都给你整好了,基本上开箱即用。

兄弟们要是遇到啥问题,比如连接失败、查询报错、索引不生效这些,先检查配置对不对,再看日志输出,基本上都能解决;实在不行就看看官方文档,Spring Data Elasticsearch的文档还是挺详细的。

好了,今天就聊到这,兄弟们有啥问题欢迎留言讨论!
