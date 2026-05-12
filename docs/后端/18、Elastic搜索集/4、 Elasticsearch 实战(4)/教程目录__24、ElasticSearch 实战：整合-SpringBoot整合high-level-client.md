# 24、ElasticSearch 实战：整合-SpringBoot整合high-level-client
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/4/24.html
- 分类：搜索引擎
- 分组：教程目录
> 接第23节

## 五、Elasticsearch-Rest-Client

Java 操作 ES 的两种方式：

1）、`9300：TCP` (我们不在9300操作，官方也不建议)

- spring-data-elasticsearch:transport-api.jar;
- **springboot 版本不同，transport-api.jar不同，不能适配es版本**
- **7.x 已经不建议使用，8 以后就要废弃**

2）、`9200：HTTP`（推荐使用）

- JestClient：非官方，更新慢
- RestTemplate：模拟发 HTTP 请求，ES 很多操作需要自己封装，麻烦
- HttpClient：同上 I
- Elasticsearch-Rest-Client：官方 RestClient，封装了 ES 操作， API 层次分明，上手简单最终选择

[Elasticsearch-Rest-Client(elasticsearch-rest-high-level-client)](https://www.elastic.co/guide/en/elasticsearch/client/java-rest/current/java-rest-high.html)

### 1、SpringBoot整合

1）在`pafcmall`项目中新添加一个模块`pafcmall-search`，当然你也可以，单独创建一个项目

使用spring 启动器创建：

添加`group` 和 `artifact` 信息：

添加`web` 依赖：

2）、修改`pom`文件

添加对应的当前 `ES` 版本的 `rest-high-level-client` 依赖，我使用的是`7.4.2`，所以添加`7.4.2`的依赖

```java
<dependency>
	<groupId>org.elasticsearch.client</groupId>
	<artifactId>elasticsearch-rest-high-level-client</artifactId>
	<version>7.4.2</version>
</dependency>
```

可以看到当前 `SpingBoot（2.2.6）`版本默认管理的 `ES` 的版本和 `elasticsearch-rest-high-level-client` 的版本不一致：

需要修改一下 `pom` 文件，让 `ES` 和 `elasticsearch-rest-high-level-client` 的版本保持一致：

```java
<elasticsearch.version>7.4.2</elasticsearch.version>
```

3）、添加 ES 配置类

```java
/**
 * @description： Elasticsearch 配置文件
 * <p>
 * SpringBoot 集成 ES 的步骤：
 *  1、导入依赖
 *      https://www.elastic.co/guide/en/elasticsearch/client/java-rest/current/java-rest-high-getting-started-maven.html
 *  2、编写 ES 配置，给容器中注入一个 RestHighLevelClient，用来操作 9200 端口
 *      https://www.elastic.co/guide/en/elasticsearch/client/java-rest/current/java-rest-high-getting-started-initialization.html
 *  3、参照官方API
 */
@Configuration
public class PafcmallElasticsearchConfig {
    @Bean
    public RestHighLevelClient esRestHighLevelClient() {
        RestHighLevelClient client = new RestHighLevelClient(
                // 这里可以配置多个 es服务，我当前服务不是集群，所以目前只配置一个
                RestClient.builder(
                        new HttpHost("192.168.50.10", 9200, "http")));
        return client;
    }
}
```

`修改启动类`：

```java
@EnableDiscoveryClient // 开启服务注册与发现
// 这里需要排除一下数据库的依赖，因为引入了pafcmall-common依赖，其中包含了mybatis-plus的配置，目前我们的服务还没有依赖数据源，所以需要排除
@SpringBootApplication(exclude = DataSourceAutoConfiguration.class)
public class PafcmallSearchApplication {
    public static void main(String[] args) {
        SpringApplication.run(PafcmallSearchApplication.class, args);
    }
}
```

修改`application.properties` 文件：

```java
# nacos配置中心地址
spring.cloud.nacos.config.server-addr=127.0.0.1:8848
# 配置应用名
spring.application.name=pafcmall-search
```

使用测试类测试：

```java
@SpringBootTest
class PafcmallSearchApplicationTests {
    @Autowired
    private RestHighLevelClient client;
    @Test
    void contextLoads() {
        System.out.println(client);
    }
}
```

更多整合信息请参考 [java-rest-high-getting-started-maven](https://www.elastic.co/guide/en/elasticsearch/client/java-rest/current/java-rest-high-getting-started-maven.html) 和 [java-rest-high-getting-started-initialization](https://www.elastic.co/guide/en/elasticsearch/client/java-rest/current/java-rest-high-getting-started-initialization.html)
