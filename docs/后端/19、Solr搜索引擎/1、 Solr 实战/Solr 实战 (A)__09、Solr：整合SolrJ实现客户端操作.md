# 09、Solr：整合SolrJ实现客户端操作
- 来源：https://ddkk.com/zhuanlan/search/solr/2/9.html
- 分类：搜索引擎
- 分组：Solr 实战 (A)
## 0. 引言

我们前面学习了solr的服务端基础操作，实际项目中我们还需要在客户端调用solr，就像调用数据库一样，我们可以基于`solrJ`来实现对solr的客户端操作

## 1. SolrJ简介

`SolrJ` 是 Solr官方提供的 Java 客户端库，主要用于与 Solr 服务器进行交互。内部封装了一组API，可以方便地实现对solr服务端的各类操作。

使用SolrJ，可以通过编写 Java 代码来实现对 Solr 的索引操作，比如增删改查。同时，SolrJ 还支持多种查询方式，如简单查询、复杂查询、分页查询、聚合查询等。同时也包括了对solr的索引管理、权限控制等操作

## 2. 项目引入SolrJ

**1、** 引入jar包：[https://central.sonatype.com/artifact/org.apache.solr/solr-solrj/8.2.0](https://central.sonatype.com/artifact/org.apache.solr/solr-solrj/8.2.0)；

```xml
<dependency>
    <groupId>org.apache.solr</groupId>
    <artifactId>solr-solrj</artifactId>
    <version>8.2.0</version>
</dependency>
```

**2、** 首先创建实体类，还是以我们在前几节创建的`orders`核心为例；

注意：这里需要给字段上加上`@Field`注解，其值是该字段在solr中的字段名

```java
@Data
public class Orders {
    @Field("id")
    private Long id;
    @Field("order_no")
    private String orderNo;
    @Field("address")
    private String address;
    @Field("product_name")
    private String productName;
    @Field("remarks")
    private String remarks;
    @Field("status")
    private Integer status;
    @Field("create_user")
    private String createUser;
    @Field("create_time")
    private Date createTime;
    @Field("labels")
    private List<String> labels;
}
```

**3、** 创建一个配置类`SolrProperties`，用户声明配置项；

```java
@ConfigurationProperties(prefix = "solr")
@Component
@Data
public class SolrProperties {
    private String host;
    private Integer connectionTimeout;
    private Integer socketTimeout;
}
```

**4、** 配置文件中添加对应的配置项；

```java
## solr地址
solr.host=http://192.168.244.41:8983/solr
## 连接超时
solr.connectionTimeout=10000
## 读取超时
solr.socketTimeout=3000
```

**5、** 创建bean配置类`SolrConfig`，用于创建solr连接bean，注意这里我们演示的是单机版的solr，集群版的需要使用`CloudSolrClient`；

```java
@Configuration
public class SolrConfig {
    @Resource
    private SolrProperties solrProperties;
    @Bean
    public HttpSolrClient solrClient(){
        return new HttpSolrClient.Builder(solrProperties.getHost())
                .withConnectionTimeout(solrProperties.getConnectionTimeout())
                .withSocketTimeout(solrProperties.getSocketTimeout())
                .build();
    }
}
```

**6、** 创建一个测试controller，用于演示客户端的操作，因为我们之前已经配置了通过`dataimport`自动同步mysql数据到solr所以solr本身的增删改，我们这里就不演示了，只要删除数据库后会自动同步，主要演示实现查询操作；

```java
@RestController
@RequestMapping("orders")
@AllArgsConstructor
public class OrdersController {
    private final HttpSolrClient solrClient;
    @GetMapping("search")
    public List<Orders> search(String productName, String address, String remarks, String labels) throws SolrServerException, IOException {
        SolrQuery query = new SolrQuery();
        if (!StringUtils.isEmpty(productName)) {
            query.setQuery("product_name:" + productName);
        }
        if (!StringUtils.isEmpty(address)) {
            query.setQuery("address:" + address);
        }
        if (!StringUtils.isEmpty(remarks)) {
            query.setQuery("remarks:" + remarks);
        }
        if (!StringUtils.isEmpty(labels)) {
            query.setQuery("labels:" + labels);
        }
        if(StringUtils.isEmpty(query.getQuery())){
            query.setQuery("*:*");
        }
        query.setStart(0);
        query.setRows(5);
        QueryResponse response = solrClient.query("orders",query);
        List<Orders> list = response.getBeans(Orders.class);
        return list;
    }
}
```

**7、** 调用测试，结果数据正常显示；

**8、** 如果想要实现更多的操作，可以在`SolrClient`类中看到支持的方法；

## 3. 配置集群

**1、** 配置文件中增加zookeeper集群的地址配置，；

```java
solr.zk.host=192.168.244.42:2181,192.168.244.43:2181,192.168.244.44:2181
```

**2、** 创建配置类，声明`CloudSolrClient`；

```java
@Configuration
public class SolrConfig {
    @Value("${solr.zk.host}")
    private String zkHost;
    @Bean
    public CloudSolrClient cloudSolrClient(){
        if(StringUtils.isEmpty(zkHost)){
            return null;
        }
        return new CloudSolrClient.Builder(Arrays.asList(zkHost.split(",")))
                .build();
    }
}
```

**3、** 后续使用`cloudSolrClient`bean来调用solr即可；

## 4. 总结

更多的客户端操作，还要大家自己去探索，但是直接使用`SolrJ`还是感觉有些复杂，能不能更加简易地实现客户端操作呢，那就要提到我们的`spring-data-solr`了，下一节，我们继续学习！
