# 10、Solr：整合spring-data-solr实现客户端操作
- 来源：https://ddkk.com/zhuanlan/search/solr/2/10.html
- 分类：搜索引擎
- 分组：Solr 实战 (A)
## 0. 引言

前一章介绍了官方的solr客户端`SolrJ`，但是solrJ的使用相对来说并不方便，仍然需要做一些负责的客户端操作以及语句的书写，有没有更加方便的ORM框架呢，这就提到了`spring-data-solr`了

## 1. 简介

首先如果你还不知道spring-data相关工具包如何查看官方文档的，这里给大家统一说明一下

**1、** spring-data的所有文档都可以在这个路径下看到[https://docs.spring.io/spring-data/](https://docs.spring.io/spring-data/)；

**2、** 找到solr，点击进去；

**3、** 选择`docs`，即文档，然后选择当前版本`current`，如果你要直接查看指定版本的也可根据版本号访问；

**4、** 进入后选择`reference`，再选择`html`，即可进入官方说明文档；

[spring-data-solr官方文档](https://docs.spring.io/spring-data/data-solr/docs/current/reference/html/#reference)

一定要善用官方文档，这可以帮助我们少走很多弯路。本文也简单介绍spring-data-solr的基本操作，更多的使用，还要大家结合官方文档来去拓展

`spring-data-solr`的使用步骤实际上在[github源码](https://github.com/spring-projects/spring-data-solr)中有说明，但下面我们还是详细待大家搭建一遍

## 2. 使用

**1、** 引入`spring-data-solr`依赖，`spring-data-solr`与`solr`之间的版本号对应关系如下；

spring-data-solr
solr

4.0.x
7.4.0

4.1.x
8.2.0

4.2.x
8.5.1

4.3.x
8.5.2

如果你solr使用的是7.4之前的版本，可以通过查看`spring-data-solr`文件查看对应关系

我这里因为使用的是`solr8.2.0`，所以引入依赖

```xml
<dependency>
    <groupId>org.springframework.data</groupId>
    <artifactId>spring-data-solr</artifactId>
    <version>4.1.13.RELEASE</version>
</dependency>
```

**2、** 添加配置文件`application.properties`；

```bash
spring.data.solr.host=http://192.168.244.41:8983/solr
```

**3、** 创建实体类`Orders`；

> 这里使用的是之前演示的实体，要绑定spring-data-solr的话，需要在实体类上加上@SolrDocument注解，并用collection说明核心名。

> 同时@Id表示主键字段，@Indexed表示索引字段，name、type属性与managed-schema中配置的保持一致

```java
@Data
@SolrDocument(collection = "orders")
public class Orders {
    @Field("id")
    @Id
    @Indexed(name = "id", type = "long")
    private Long id;
    @Field("order_no")
    @Indexed(name = "order_no", type = "string")
    private String orderNo;
    @Field("address")
    @Indexed(name = "address", type = "text_general")
    private String address;
    @Field("product_name")
    @Indexed(name = "product_name", type = "string")
    private String productName;
    @Field("remarks")
    @Indexed(name = "remarks", type = "string")
    private String remarks;
    @Field("status")
    @Indexed(name = "status", type = "int")
    private Integer status;
    @Field("create_user")
    @Indexed(name = "create_user", type = "string")
    private String createUser;
    @Field("create_time")
    @Indexed(name = "create_time", type = "date")
    private Date createTime;
    @Field("labels")
    @Indexed(name = "labels", type = "string")
    private List<String> labels;
}
```

**4、** 创建`Repository`类，用于声明对应核心的增删改查方法，如果用过`spring-data-es`的同学会感觉到有些熟悉，实际上两者的用法也相似；

```java
public interface OrdersRepository extends CrudRepository<Orders, Long> {
}
```

> CrudRepository自带了很多常用的增删改查接口

> 如果要实现分页查询等可以采用集成SolrCrudRepository，该类继承自PagingAndSortingRepository，该类中提供了分页接口

同时spring-data-solr，本身支持自拓语法，在[官方文档](https://docs.spring.io/spring-data/data-solr/docs/current/reference/html/#repositories.query-methods.details)中也有说明，可以通过连接符（AND,OR）以及字段名来快速实现接口方法

总体支持的关键字我在spring-data-solr中没有找到说明，但是在[spring-data-elasticsearch](https://docs.spring.io/spring-data/elasticsearch/docs/current/reference/html/#elasticsearch.query-methods.criterions)中有提到，大家可以参考

（注：如下所有语法仅在spring-data-es中验证过，未验证spring-data-solr，仅供参考，这里吐槽下solr的使用率因为不没有es高，spring-data官方给出的文档也相差甚远，很多es中有详细说明的，在solr中没有，大家可以交叉参考，很多内容都是通用的）

我们这里书写两个，同时把继承类改成`SolrCrudRepository`

```java
@Repository
public interface OrdersRepository extends SolrCrudRepository<Orders, Long> {
    List<Orders> findByAddressOrProductName(String address, String productName);
    List<Orders> findByProductName(String productName);
}
```

**5、** 启动类中添加注解`@EnableSolrRepositories(basePackages="com.example.solrdemo.dao")`，用于开启扫描Repository类，其中`basePackages`是Repository类包路径；

**6、** 书写controller层，书写测试接口；

```java
@RestController
@RequestMapping("orders/data")
public class OrdersDataController {
    @Autowired
    private OrdersRepository ordersRepository;
    @GetMapping("save2")
    public void save2(Long id){
        Orders orders = new Orders();
        orders.setId(id);
        orders.setOrderNo("20230601000"+id);
        orders.setAddress("贵州省遵义市");
        orders.setProductName("小米手机");
        orders.setRemarks("送货上门");
        orders.setCreateUser("root");
        orders.setCreateTime(new Date());
        orders.setStatus(1);
        ordersRepository.save(orders);
    }
    @GetMapping("searchByName")
    public List<Orders> searchByName(String productName){
        return ordersRepository.findByProductName(productName);
    }
    @GetMapping("searchByAddressAndName")
    public List<Orders> search2(String address, String name){
        return ordersRepository.findByAddressOrProductName(address, name);
    }
}
```

**7、** 调用新增接口：[http://localhost:8092/orders/data/save?id=10](http://localhost:8092/orders/data/save?id=10)；

**8、** solr-admin中查询发现数据新增成功；

**9、** 同时测试下查询接口；

## 3. 复杂查询

上述`Repository`接口实际上只能满足我们简单接口的实现，实际生产中可能还有更复杂的语法场景，这时就可以利用自带的`SolrTemplate`来实现

**1、** 首先创建配置类，初始化`SolrTemplate`；

```java
@Configuration
public class SolrConfig {
    @Value("${spring.data.solr.host}")
    private String host;
    @Bean
    public SolrClient solrClient(){
        return new HttpSolrClient.Builder(host).build();
    }
    @Bean
    public SolrTemplate solrTemplate(){
        return new SolrTemplate(solrClient());
    }
}
```

**2、** solrTemplate提供查询，最简单的只需要`Query.query`构造查询语句即可；

```java
 @GetMapping("save2")
    public void save2(Long id){
        Orders orders = new Orders();
        orders.setId(id);
        orders.setOrderNo("20230601000"+id);
        orders.setAddress("贵州省遵义市");
        orders.setProductName("小米手机");
        orders.setRemarks("送货上门");
        orders.setCreateUser("root");
        orders.setCreateTime(new Date());
        orders.setStatus(1);
        solrTemplate.saveBean("orders", orders);
        solrTemplate.commit("orders");
    }
    @GetMapping("search3")
    public Page<Orders> search3(String address, String name){
        Query query = Query.query("address:"+address+" AND product_name:"+name);
        Page<Orders> orders = solrTemplate.query("orders", query, Orders.class);
        return orders;
    }
```

但有时我们希望对象化的构造方式，可以看到Query.query方法参数也支持`Criteria`对象，所以也可以通过构造查询

**3、** 更多用法可在官方文档查看：

[https://docs.spring.io/spring-data/data-solr/docs/current/reference/html/#solr.misc.partialUpdates](https://docs.spring.io/spring-data/data-solr/docs/current/reference/html/#solr.misc.partialUpdates)

## 总结

本文未将比较详尽的`SolrTemplate`语法列举，更多的是提供一个学习的入口，本文的目的不在于精进研究高级语法，还在于带大家掌握基础、引领入门，更多更深的用法，还要靠大家自己结合官方文档去尝试

## 项目源码

文中演示源码如下：[https://gitee.com/wuhanxue/wu_study/tree/master/demo/solr-demo](https://gitee.com/wuhanxue/wu_study/tree/master/demo/solr-demo)
