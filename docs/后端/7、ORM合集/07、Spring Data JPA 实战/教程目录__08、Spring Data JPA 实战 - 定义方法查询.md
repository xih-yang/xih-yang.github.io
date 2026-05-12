# 08、Spring Data JPA 实战 - 定义方法查询
- 来源：https://ddkk.com/zhuanlan/orm/springdatajpa/1/8.html
- 分类：ORM框架
- 分组：教程目录
1、查询策略

spring-data一共有三种方法查询策略：
QueryLookupStrategy.Key.CREATE，尝试根据方法名进行创建。通用方法是从方法名中删除一组特定的前缀，然后解析该方法的其余部分。如果方法名不符合规则，则抛出异常。
QueryLookupStrategy.Key.USE_DECLARED_QUERY，尝试查找已声明的查询，如果找不到则抛出异常。该查询可以通过某处的注释定义，也可以通过其他方式声明。
QueryLookupStrategy.Key.CREATE_IF_NOT_FOUND，（默认）组合CREATE和USE_DECLARED_QUERY。它首先查找一个声明的查询，如果找不到声明的查询，它将创建一个基于名称的自定义方法查询。

如果我们想要修改查询策略，可以通过@EnableJpaRepositories的queryLookupStrategy属性设置。

```java
@EnableJpaRepositories(queryLookupStrategy = QueryLookupStrategy.Key.CREATE_IF_NOT_FOUND)
public class StudySpringDataJpaApplication {
    public static void main(String[] args) {
        SpringApplication.run(StudySpringDataJpaApplication.class, args);
    }
}
```

2、查询创建

2.1、spring-data内置了根据方法名创建查询的构建器，对于在存储库的实体上构建约束查询很有用。该机制的方法前缀有find…By，read…By，query…By，count…By，和get…By，从这些方法可以解析它的其余部分。引入子句可以包含其他表达式，例如Distinct，以在要创建的查询上设置不同的标志。但是，第一个By充当分隔符以指示实际标准的开始。在最基本
的级别上，可以定制实体属性条件，并使用AND和OR进行串连。

2.2、解析该方法的实际结果取决与创建查询的持久性存储。但是，需要注意一些一般事项：

2.2.1、表达式通常时可以连接的运算符的属性遍历。可以使用组合属性表达式AND和OR，也可以使用运算关键字Between，LessThan，GreaterThan，和Like作为属性表达式。支持的运算符可能因数据库而异，需要参阅官方文档。

2.2.2、方法解析器支持为单个属性忽略大小写（IgnoreCase），或全部忽略大小写（AllIgnoreCase），是否支持忽略大小写因数据库而异，需要参阅数据库支持。

2.2.3、可以通过OrderBy子句附加引用属性，为查询方法提供排序方向（Asc或Desc）。

2.2.4、当实体中的属性也是一个实体时，我们一般使用下划线_来手动定义遍历点（所以我们的属性命名要规范，使用驼峰）。

2.3、关键字列表

3、特殊参数处理

框架可以识别Pageable和Sort，动态的将分页和排序应用到查询中。可以返回Page`` 、Slice`` 、List``。

3.1、Sort和Pageable不能传null值，如果不想应用排序或分页，使用Sort.unsorted()和Pageable.unpaged()。

3.2、返回Page``,可以知道一些附加信息，如页面总数。他会额外执行一条count语句去查询总数，如果数据量很大，会很消耗资源，可以使用下面的来替代。

3.3、返回Slice``,Slice的作用是，只知道是否有下一个Slice可用，不会执行count语句，所以当查询较大的数据量时，也没必要关心页数。

3.4、返回List``,分页也可以返回List，这种情况下，也不会额外执行count语句，仅仅是将范围内的结果装入List。

4、限制查询结果

可以通过使用first或者top关键字来限制查询方法的返回结果，可以互换使用。可以将可选的数值追加到它们后面，指定返回结果大小。如果省略数字，则假定结果大小为1。限制表达式也支持Distinct关键字。对于结果集限制为1个的示例查询，支持将结果包装到Optional中。如果将分页或切片 应用于限制查询分页（以及对可用页面数的计算），则会在限制结果内应用分页或切片(不建议分页和限制同使使用)。

5、常用的返回结果的不同形式

5.1、void，对于我们不关乎结果的操作，可以选择不返回结果，一般用作更新。

5.2、Primitives，Java的基本类型，一般用作统计返回，（如long,boolean）。

5.3、Wrapper types，Java的包装类型。

5.4、T，返回一个实体，没有查询结果，返回null，如果超过一个返回结果，抛出IncorrectResultSizeDataAccessException异常。

5.5、Iterator``、Collection``、List``，Set``,返回多个结果时，可以使用迭代器，集合，List及其子类,Set及其子类。

5.6、Optional``，Java8或者Guava的Optional类，查询方法最多返回一个结果，如果不存在返回Optional.empty()或Optional.absent()，如果超出一个结果，抛出IncorrectResultSizeDataAccessException异常。

5.7、Stream``，Java8的Stream。必须在使用后关闭流。可以使用try-with-resources，也可以使用Stream的close()方法。

5.7、Streamable``，Spring-Data提供的Streamable，可以作为Iterator或任何集合类型的替代。

5.8、自定义Streamable的类型，实现Streamable并提供一个将Streamable作为参数的公开的构造方法或方法名为of(…) or valueOf(…)的静态工厂方法。

5.9、Slice``、Page``,分页相关，需要提供一个Pageable入参。Page继承自Slice，Slice继承自Streamable。

5.10、Future``，查询方法上需要添加@Async注解，并开启Spring异步执行方法功能。

5.11、CompletableFuture``，Java8的CompletableFuture，需要在方法上添加@Async注解，并开启Spring异步执行方法功能。

5.12、ListenableFuture，返回org.springframework.util.concurrent.ListenableFuture，需要在方法上添加@Async注解，并开启Spring异步执行方法功能。

5.13、关联查询时，可返回Object[] 和 Map

源码地址：https://github.com/caofanqi/study-spring-data-jpa
