# 02、Spring Data JPA 实战 - JPA入门案例
- 来源：https://ddkk.com/zhuanlan/orm/springdatajpa/6/2.html
- 分类：ORM框架
- 分组：Spring Data JPA 实战(A)
## JPA入门案列

## 需求介绍

我们实现的功能是保存一个客户到数据库的客户表中。

## 创建数据库

```java
 /*创建客户表*/
    CREATE TABLE cst_customer (
        cust_id bigint(32) NOT NULL AUTO_INCREMENT COMMENT '客户编号(主键)',
        cust_name varchar(32) NOT NULL COMMENT '客户名称(公司名称)',
        cust_source varchar(32) DEFAULT NULL COMMENT '客户信息来源',
        cust_industry varchar(32) DEFAULT NULL COMMENT '客户所属行业',
        cust_level varchar(32) DEFAULT NULL COMMENT '客户级别',
        cust_address varchar(128) DEFAULT NULL COMMENT '客户联系地址',
        cust_phone varchar(64) DEFAULT NULL COMMENT '客户联系电话',
        PRIMARY KEY (cust_id)
    ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;
```

## 导入依赖

```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>2.3.1.RELEASE</version>
    <relativePath/> <!-- lookup parent from repository -->
</parent>
<properties>
    <java.version>1.8</java.version>
</properties>
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-jdbc</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>mysql</groupId>
        <artifactId>mysql-connector-java</artifactId>
        <scope>runtime</scope>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-configuration-processor</artifactId>
        <optional>true</optional>
    </dependency>
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
        <exclusions>
            <exclusion>
                <groupId>org.junit.vintage</groupId>
                <artifactId>junit-vintage-engine</artifactId>
            </exclusion>
        </exclusions>
    </dependency>
    <dependency>
        <groupId>com.alibaba</groupId>
        <artifactId>druid-spring-boot-starter</artifactId>
        <version>1.1.20</version>
    </dependency>
</dependencies>
</project>
```

## 配置文件

```java
spring:
  datasource:
    username: jiang
    password: jiang
    url: jdbc:mysql://localhost:3306/learn?characterEncoding=UTF-8&serverTimezone=UTC
    type: com.alibaba.druid.pool.DruidDataSource
    initialSize: 5
    minIdle: 5
    maxActive: 20
    maxWait: 60000
    timeBetweenEvictionRunsMillis: 60000
    minEvictableIdleTimeMillis: 30000
    validationQuery: select 'x';
    testWhileIdle: true
    testOnBorrow: false
    testOnReturn: false
    poolPreparedStatements: true
    maxPoolPreparedStatementPerConnectionSize: 20
    filters: stat,wall,slf4j
    connectionProperties: druid.stat.mergeSql=true;druid.stat.slowSqlMillis=5000
    useGlobalDataSourceStat: true
  jpa:
    hibernate:
      更新或者创建数据表结构,create:程序运行时创建数据库表(如果有表,先删除表再创建); update:程序运行时创建表(如果有表,不会建表); none:不会创建表
      ddl-auto: update
    show-sql: true控制台显示SQ
logging:
  level:
    top.codekiller.test.testspringdataone: debug
```

## 实体类

- @Entity

作用：指定当前类是实体类。

- @Table

作用：指定实体类和表之间的对应关系。

属性：name：指定数据库表的名称

- @Id

作用：指定当前字段是主键。

- @GeneratedValue

作用：指定主键的生成方式。。

属性：strategy ：指定主键生成策略。通过GenerationType枚举获取值

- @Column

作用：指定实体类属性和数据库表之间的对应关系

属性：

name：指定数据库表的列名称。

unique：是否唯一

nullable：是否可以为空

inserttable：是否可以插入

updateable：是否可以更新

columnDefinition: 定义建表时创建此列的DDL

secondaryTable: 从表名。如果此列不建在主表上（默认建在主表），该属性定义该列所在从表的名字搭建开发环境[重点]

```java
package top.codekiller.test.testspringdataone.pojo;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import javax.persistence.*;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @Description 客户实体类
 */
@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name="cst_customer")
public class Customer {
    /**
     * 客户编号(主键)
     */
    @Id
    @GeneratedValue(strategy= GenerationType.IDENTITY) //自增主键，默认是Auto
    @Column(name="cust_id")  //如果可以直接映射，这个注解不需要写
    private Long custId;
    /**
     * 客户名称(公司名称)
     */
    @Column(name="cust_name")
    private String custName;
    /**
     * 客户信息来源
     */
    @Column(name="cust_source")
    private String custSource;
    /**
     * 客户所属行业
     */
    @Column(name="cust_industry")
    private String custIndustry;
    /**
     * 客户级别
     */
    @Column(name="cust_level")
    private String custLevel;
    /**
     * 客户联系地址
     */
    @Column(name="cust_address")
    private String custAddress;
    /**
     * 客户联系电话
     */
    @Column(name="cust_phone")
    private String custPhone;
}
```

## Repository类

如果不适用spring整合，那么不需要创建Repository，这一步可跳过

```java
@Repository
public interface  CustomerRepository extends JpaRepository<Customer,Long>, JpaSpecificationExecutor<Customer> {
}
```

- JpaRepository:基本CRUD操作
- JpaSpecificationExecutor:复杂CRUD操作,比如分页

## 操作

### 新增数据

不适用spring整合(不需要创建Repository)

```java
/**
* 创建实体管理类工厂，借助Persistence的静态方法获取
* 其中传递的参数为持久化单元名称，需要jpa配置文件中指定
*/
EntityManagerFactory factory = Persistence.createEntityManagerFactory("myJpa");
//创建实体管理类
EntityManager em = factory.createEntityManager();
//获取事务对象
EntityTransaction tx = em.getTransaction();
//开启事务
tx.begin();
Customer c = new Customer();
c.setCustName("传智播客");
//保存操作
em.persist(c);
//提交事务
tx.commit();
//释放资源
em.close();
factory.close();
```

spring整合操作

```java
@Autowired
private CustomerRepository customerRepository;
/**
* @Description 保存数据
* @return void
*/
@Test
@Transactional(rollbackFor = Exception.class)
public void testSave(){
    Customer customer=new Customer();
    customer.setCustId(null);
    customer.setCustName("飞飞飞");
    customer.setCustIndustry("娱乐");
    //保存
    this.customerRepository.save(customer);
}
```

### 查询数据

```java
@Test
public void testQuery(){
    Optional<Customer> optional = this.customerRepository.findById(1L);
    System.out.println(optional.get());
}
```

### 基本更新

```java
@Test
public void testUpdate(){
    Customer customer=new Customer();
    customer.setCustId(2L);
    customer.setCustName("飞飞飞走了");
    this.customerRepository.save(customer);
}
```

### 基本删除

```java
@Test
public void testDelete(){
    this.customerRepository.deleteById(3L);
}
```
