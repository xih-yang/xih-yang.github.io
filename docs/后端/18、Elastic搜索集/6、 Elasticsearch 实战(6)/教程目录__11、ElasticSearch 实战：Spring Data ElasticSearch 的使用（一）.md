# 11、ElasticSearch 实战：Spring Data ElasticSearch 的使用（一）
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/6/11.html
- 分类：搜索引擎
- 分组：教程目录
## 1、环境准备

我本地使用的环境为：

虚拟机版本：Centos 7.3 两台 IP 分别为：192.168.56.12， 192.168.56.13

Elasticsearch版本：6.4.0 （已安装IK分词器）

虚拟机中JDK版本：12.0.1

宿主机系统：Windows 10

宿主机JDK版本：1.8

Idea版本： 2019.1.3

## 2、创建工程

## 1)、在Idea中创建一个Maven工程，并导入Spring Data Elasticsearch依赖。

Spring Data Elasticsearch依赖（pom.xml）:

```java
 1 <?xml version="1.0" encoding="UTF-8"?>
 2 <project xmlns="http://maven.apache.org/POM/4.0.0"
 3          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
 4          xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
 5     <modelVersion>4.0.0</modelVersion>
 6 
 7     <groupId>com.Aiden</groupId>
 8     <artifactId>SpringData-elasticsearch</artifactId>
 9     <version>1.0-SNAPSHOT</version>
10 
11     <dependencies>
12         <dependency>
13             <groupId>org.elasticsearch</groupId>
14             <artifactId>elasticsearch</artifactId>
15             <version>5.6.8</version>
16         </dependency>
17         <dependency>
18             <groupId>org.elasticsearch.client</groupId>
19             <artifactId>transport</artifactId>
20             <version>5.6.8</version>
21         </dependency>
22         <dependency>
23             <groupId>org.apache.logging.log4j</groupId>
24             <artifactId>log4j-to-slf4j</artifactId>
25             <version>2.9.1</version>
26         </dependency>
27         <dependency>
28             <groupId>org.slf4j</groupId>
29             <artifactId>slf4j-api</artifactId>
30             <version>1.7.24</version>
31         </dependency>
32         <dependency>
33             <groupId>org.slf4j</groupId>
34             <artifactId>slf4j-simple</artifactId>
35             <version>1.7.21</version>
36         </dependency>
37         <dependency>
38             <groupId>log4j</groupId>
39             <artifactId>log4j</artifactId>
40             <version>1.2.12</version>
41         </dependency>
42         <dependency>
43             <groupId>junit</groupId>
44             <artifactId>junit</artifactId>
45             <version>4.12</version>
46         </dependency>
47 
48 
49         <dependency>
50             <groupId>com.fasterxml.jackson.core</groupId>
51             <artifactId>jackson-core</artifactId>
52             <version>2.8.1</version>
53         </dependency>
54         <dependency>
55             <groupId>com.fasterxml.jackson.core</groupId>
56             <artifactId>jackson-databind</artifactId>
57             <version>2.8.1</version>
58         </dependency>
59         <dependency>
60             <groupId>com.fasterxml.jackson.core</groupId>
61             <artifactId>jackson-annotations</artifactId>
62             <version>2.8.1</version>
63         </dependency>
64 
65 
66         <dependency>
67             <groupId>org.springframework.data</groupId>
68             <artifactId>spring-data-elasticsearch</artifactId>
69             <version>3.0.5.RELEASE</version>
70             <exclusions>
71                 <exclusion>
72                     <groupId>org.elasticsearch.plugin</groupId>
73                     <artifactId>transport-netty4-client</artifactId>
74                 </exclusion>
75             </exclusions>
76         </dependency>
77 
78         <dependency>
79             <groupId>org.springframework</groupId>
80             <artifactId>spring-test</artifactId>
81             <version>5.0.4.RELEASE</version>
82         </dependency>
83 
84     </dependencies>
85 
86 
87 </project>
```

## 2）、创建配置文件

在maven工程的resource目录下创建Spring Data Elasticsearch的配置文件 ApplicationContext.xml，并引入Elasticsearch命名空间

ApplicationContext.xml文件内容：

```java
 1 <?xml version="1.0" encoding="UTF-8"?>
 2 <beans xmlns="http://www.springframework.org/schema/beans"
 3        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
 4        xmlns:context="http://www.springframework.org/schema/context"
 5        xmlns:elasticsearch="http://www.springframework.org/schema/data/elasticsearch"
 6        xsi:schemaLocation="
 7         http://www.springframework.org/schema/beans
 8         http://www.springframework.org/schema/beans/spring-beans.xsd
 9         http://www.springframework.org/schema/context
10         http://www.springframework.org/schema/context/spring-context.xsd
11         http://www.springframework.org/schema/data/elasticsearch
12         http://www.springframework.org/schema/data/elasticsearch/spring-elasticsearch-1.0.xsd
13         ">
14 
15 
16 </beans>
```

## 3）、创建实体Film

在maven工程中创建包com.Aiden.doamin，并在此包下创建实体类Film

```java
 1 package com.Aiden.domain;
 2 
 3 import org.springframework.data.annotation.Id;
 4 import org.springframework.data.elasticsearch.annotations.Document;
 5 import org.springframework.data.elasticsearch.annotations.Field;
 6 import org.springframework.data.elasticsearch.annotations.FieldType;
 7 
 8 public class Film {
 9 
10     private Long id;
11     private String title;
12     private String content;
13     private String date;
14     private String price;
15     private String director;
16 
17     public Long getId() {
18         return id;
19     }
20 
21     public void setId(Long id) {
22         this.id = id;
23     }
24 
25     public String getTitle() {
26         return title;
27     }
28 
29     public void setTitle(String title) {
30         this.title = title;
31     }
32 
33     public String getContent() {
34         return content;
35     }
36 
37     public void setContent(String content) {
38         this.content = content;
39     }
40 
41     public String getDate() {
42         return date;
43     }
44 
45     public void setDate(String date) {
46         this.date = date;
47     }
48 
49     public String getPrice() {
50         return price;
51     }
52 
53     public void setPrice(String price) {
54         this.price = price;
55     }
56 
57     public String getDirector() {
58         return director;
59     }
60 
61     public void setDirector(String director) {
62         this.director = director;
63     }
64 
65     @Override
66     public String toString() {
67         return "Film{" +
68                 "id=" + id +
69                 ", title='" + title + '\'' +
70                 ", content='" + content + '\'' +
71                 ", date='" + date + '\'' +
72                 ", price='" + price + '\'' +
73                 ", director='" + director + '\'' +
74                 '}';
75     }
76 }
```

## 4）、创建Dao

在maven工程中创建com.Aiden.dao包，并在包中创建仓库 FilmRepository

```java
 1 package com.Aiden.dao;
 2 
 3 import com.Aiden.domain.Film;
 4 import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
 5 import org.springframework.stereotype.Repository;
 6 
 7 @Repository
 8 public interface FilmRepository extends ElasticsearchRepository<Film,Long> {
 9 
10 }
```

## 5）、创建Service

在maven工程中创建com.Aiden.service包，并在包中创建 FilmService 接口，并在其中添加save方法

```java
1 package com.Aiden.service;
2 
3 import com.Aiden.domain.Film;
4 
5 public interface FilmService {
6 
7     public void save(Film film);
8 
9 }
```

在刚创建的service包下创建Impl包（即com.Aiden.service.Impl包），并在此包中创建FilmServiceImpl类并实现FilmService接口，实现其方法

```java
 1 package com.Aiden.service.impl;
 2 
 3 import com.Aiden.dao.FilmRepository;
 4 import com.Aiden.domain.Film;
 5 import com.Aiden.service.FilmService;
 6 import org.springframework.beans.factory.annotation.Autowired;
 7 import org.springframework.stereotype.Service;
 8 
 9 @Service
10 public class FilmServiceImpl implements FilmService {
11 
12     @Autowired
13     private FilmRepository filmRepository;
14 
15     public void save(Film film) {
16         filmRepository.save(film);
17     }
18 
19 }
```

## 6）、修改Spring Data Elasticsearch配置文件ApplicationContext.xml，完成项目配置

```java
 1 <?xml version="1.0" encoding="UTF-8"?>
 2 <beans xmlns="http://www.springframework.org/schema/beans"
 3        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
 4        xmlns:context="http://www.springframework.org/schema/context"
 5        xmlns:elasticsearch="http://www.springframework.org/schema/data/elasticsearch"
 6        xsi:schemaLocation="
 7         http://www.springframework.org/schema/beans
 8         http://www.springframework.org/schema/beans/spring-beans.xsd
 9         http://www.springframework.org/schema/context
10         http://www.springframework.org/schema/context/spring-context.xsd
11         http://www.springframework.org/schema/data/elasticsearch
12         http://www.springframework.org/schema/data/elasticsearch/spring-elasticsearch-1.0.xsd
13         ">
14 
15     <!-- 扫描Dao包，自动创建实例 -->
16     <elasticsearch:repositories base-package="com.Aiden.dao"/>
17 
18     <!-- 扫描Service包，创建Service的实体 -->
19     <context:component-scan base-package="com.Aiden.service"/>
20     
21     <!-- 配置elasticSearch的连接 -->
22     <elasticsearch:transport-client id="client" cluster-nodes="192.168.56.12:9300,192.168.56.13:9300" cluster-name="my-application"/>
23 
24 
25     <!-- ElasticSearch模版对象 -->
26     <bean id="elasticsearchTemplate" class="org.springframework.data.elasticsearch.core.ElasticsearchTemplate">
27         <constructor-arg name="client" ref="client"/>
28     </bean>
29 
30 </beans>
```

## 7）、配置实体类

基于spring data elasticsearch注解配置索引、映射和实体的关系

```java
 1 package com.Aiden.domain;
 2 
 3 import org.springframework.data.annotation.Id;
 4 import org.springframework.data.elasticsearch.annotations.Document;
 5 import org.springframework.data.elasticsearch.annotations.Field;
 6 import org.springframework.data.elasticsearch.annotations.FieldType;
 7 
 8 @Document(indexName = "film",type = "action")
 9 public class Film {
10     @Id
11     private Long id;
12     @Field(index = true,analyzer = "ik_max_word",store = true,searchAnalyzer = "ik_max_word",type = FieldType.text)
13     private String title;
14     @Field(index = true,analyzer = "ik_max_word",store = true,searchAnalyzer = "ik_max_word",type = FieldType.text)
15     private String content;
16     @Field(index = true,analyzer = "ik_max_word",store = true,searchAnalyzer = "ik_max_word",type = FieldType.text)
17     private String date;
18     @Field(index = true,analyzer = "ik_max_word",store = true,searchAnalyzer = "ik_max_word",type = FieldType.text)
19     private String price;
20     @Field(index = true,analyzer = "ik_max_word",store = true,searchAnalyzer = "ik_max_word",type = FieldType.text)
21     private String director;
22 
23     public Long getId() {
24         return id;
25     }
26 
27     public void setId(Long id) {
28         this.id = id;
29     }
30 
31     public String getTitle() {
32         return title;
33     }
34 
35     public void setTitle(String title) {
36         this.title = title;
37     }
38 
39     public String getContent() {
40         return content;
41     }
42 
43     public void setContent(String content) {
44         this.content = content;
45     }
46 
47     public String getDate() {
48         return date;
49     }
50 
51     public void setDate(String date) {
52         this.date = date;
53     }
54 
55     public String getPrice() {
56         return price;
57     }
58 
59     public void setPrice(String price) {
60         this.price = price;
61     }
62 
63     public String getDirector() {
64         return director;
65     }
66 
67     public void setDirector(String director) {
68         this.director = director;
69     }
70 
71     @Override
72     public String toString() {
73         return "Film{" +
74                 "id=" + id +
75                 ", title='" + title + '\'' +
76                 ", content='" + content + '\'' +
77                 ", date='" + date + '\'' +
78                 ", price='" + price + '\'' +
79                 ", director='" + director + '\'' +
80                 '}';
81     }
82 }
```

## 8）、创建测试类

在maven工程的test文件夹下创建测试类 SpringDataElasticSearchTest，并添加测试方法

```java
 1 package com.Aiden.Test;
 2 
 3 import com.Aiden.domain.Film;
 4 import com.Aiden.service.FilmService;
 5 import org.junit.Test;
 6 import org.junit.runner.RunWith;
 7 import org.springframework.beans.factory.annotation.Autowired;
 8 import org.springframework.data.elasticsearch.core.ElasticsearchTemplate;
 9 import org.springframework.test.context.ContextConfiguration;
10 import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
11 
12 import java.util.List;
13 
14 
15 @RunWith(SpringJUnit4ClassRunner.class)
16 @ContextConfiguration(locations = "classpath:ApplicationContext.xml")
17 public class SpringDataElasticSearchTest {
18 
19     @Autowired
20     private FilmService filmService;
21 
22     @Autowired
23     private ElasticsearchTemplate elasticsearchTemplate;
24 
25     @Test
26     public void createIndex() throws Exception {
27         elasticsearchTemplate.createIndex(Film.class);
28         elasticsearchTemplate.putMapping(Film.class);
29     }
30 
31     @Test
32     public void saveFilm1() {
33         Film film = new Film();
34         film.setTitle("蜘蛛侠：英雄远征 Spider-Man: Far from Home");
35         film.setContent("在复仇者联盟众英雄的努力下，于灭霸无限手套事件中化作为灰烬的人们，重新回到了人世间，曾经消失的蜘蛛侠 彼得帕克 也回归到了普通的生活之中，数月后，蜘蛛侠彼得帕克所在的学校举行了欧洲旅游，帕克也在其中， 在欧州威尼斯旅行时，一个巨大无比的水怪袭击了威尼斯，不敌敌人的蜘蛛侠幸得一位自称神秘客的男子搭救才击退敌人，之后 神盾局局长找上正在旅游的彼得帕克并要求其加入神盾局，并安排神秘客协助帕克，神秘客自称来自其他宇宙，并告知一群名为元素众的邪恶势力已经入侵这个宇宙了，为了守护来之不易的和平，蜘蛛侠决定与神秘客联手，然而在神秘客那头罩之中，似乎隐藏着什么不为人知的真相……");
36         film.setDate("2019-06-28");
37         film.setDirector("乔·沃茨");
38         film.setPrice("78");
39         film.setId(1L);
40         filmService.save(film);
41     }
42 
43 }
```

## 9）、运行测试

执行SpringDataElasticSearchTest中的测试方法 createIndex 、saveFilm1，创建索引及加入文档。

测试方法执行完毕，在head插件中查看Elasticsearch集群中索引情况：

索引创建成功：

查看索引信息中的mapping信息，创建正常：

执行saveFilm1加入文档，文档加入成功：

至此Spring Data Elasticsearch工程创建成功！
