# 02、Spring Data JPA 实战 - JPA的基本操作与保存操作
- 来源：https://ddkk.com/zhuanlan/orm/springdatajpa/5/2.html
- 分类：ORM框架
- 分组：教程目录
## 1.搭建环境过程

### 1.1 创建数据库表

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

### 1.2 创建Maven工程导入坐标

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.yy</groupId>
    <artifactId>JPA</artifactId>
    <version>1.0-SNAPSHOT</version>
    <dependencies>
        <!-- junit -->
        <dependency>
            <groupId>junit</groupId>
            <artifactId>junit</artifactId>
            <version>4.12</version>
            <scope>test</scope>
        </dependency>
        <!-- hibernate对jpa的支持包 -->
        <dependency>
            <groupId>org.hibernate</groupId>
            <artifactId>hibernate-entitymanager</artifactId>
            <version>5.0.1.Final</version>
        </dependency>
        <!-- c3p0 -->
        <dependency>
            <groupId>org.hibernate</groupId>
            <artifactId>hibernate-c3p0</artifactId>
            <version>3.6.3.Final</version>
        </dependency>
        <!-- log日志 -->
        <dependency>
            <groupId>log4j</groupId>
            <artifactId>log4j</artifactId>
            <version>1.2.17</version>
        </dependency>
        <!-- Mysql and MariaDB -->
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <version>5.1.6</version>
        </dependency>
    </dependencies>
</project>
```

### 1.3 配置JPA核心配置文件

配置要求：

> 位置：配置到类路径下的一个叫做META-INF的文件夹里面
> 命名：persistence.xml

#### 1.3.1 persistence.xml

导入约束

1.找到模板

复制该约束

配置文件大致内容如下：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<persistence xmlns="http://java.sun.com/xml/ns/persistence" version="2.0">
<!--persistence报错是因为需要配置persistence-unit节点
      persistence-unit：持久化单元
                            name：持久化单元名称
                            transaction-type：事务管理的方式
                                JTA：分布式事务管理
                                RESOURCE_LOCAL：本地事务管理
-->
    <persistence-unit name="myJpa" transaction-type="RESOURCE_LOCAL">
<!--        配置jpa的实现方式-->
<!--        数据库信息-->
<!--        这个是可选的配置:配置jpa实现方式的配置信息-->
    </persistence-unit>
</persistence>
```

#### 1.3.2 详细配置信息

```xml
<?xml version="1.0" encoding="UTF-8"?>
<persistence xmlns="http://java.sun.com/xml/ns/persistence" version="2.0">
<!--persistence报错是因为需要配置persistence-unit节点
      persistence-unit：持久化单元
                            name：持久化单元名称
                            transaction-type：事务管理的方式
                                JTA：分布式事务管理
                                RESOURCE_LOCAL：本地事务管理
-->
    <persistence-unit name="myJpa" transaction-type="RESOURCE_LOCAL">
<!--        配置jpa的实现方式：下面的是hibernate-->
        <provider>org.hibernate.jpa.HibernatePersistenceProvider</provider>
        <!-- 数据库信息-->
        <!--这个是可选的配置:配置jpa实现方的配置信息-->
<!--        上面二者的配置信息都需要配置到properties里面-->
        <properties>
<!--            数据库信息：用户名，javax.persistence.jdbc.user
                           密码，javax.persistence.jdbc.password
                           驱动，javax.persistence.jdbc.driver
                           数据库地址:javax.persistence.jdbc.url
                           -->
            <property name="javax.persistence.jdbc.user" value="root"/>
            <property name="javax.persistence.jdbc.password" value="2184021338"/>
            <property name="javax.persistence.jdbc.driver" value="com.mysql.jdbc.Driver"/>
<!--           ///,三个斜杆代表本地并且ip地址为3306 -->
            <property name="javax.persistence.jdbc.url" value="jdbc:mysql:///jpa"/>
<!--           可选配置,jpa实现方的配置 :
                    显示sql
                    自动创建数据库表
-->
            <property name="hibernate.show_sql" value="true"/>
<!--
            自动创建数据库表:hibernate.hbm2ddl.auto
                create：程序运行时创建数据库表（如果有表，先删除再创建）
                update：程序运行时创建表（如果有表，不会创建表）
                none：不会创建表
-->
            <property name="hibernate.hbm2ddl.auto" value="create"/>
        </properties>
    </persistence-unit>
</persistence>
```

### 1.4 编写客户实体类

```java
public class Customer {
    private Long custId;//客户主键
    private String custName;//客户名称
    private String custSource;//客户来源
    private String custLevel;//客户级别
    private String custIndustry;//客户所属行业
    private String custPhone;//客户联系方式
    private String custAddress;//客户地址
}
```

### 1.5 配置映射关系

```java
package cn.yy.domain;
import javax.persistence.*;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2022/12/4
 */
/*实体类与表的映射关系
    @Entity：声明实体类
    @Table(name = "cst_customer")
        @Table：配置实体类与表的映射关系
        name：配置数据库表的名称
 */
    /*
     */
@Entity
@Table(name = "cst_customer")
public class Customer {
    /**
     * @Id：声明主键的配置
     *
     * @GeneratedValue：配置主键的生成策略
     *      GenerationType.IDENTITY：自增
     *
     * @Column：配置属性和字段的映射关系
     *      name：数据库表中的字段的名称
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cust_id")
    private Long custId;//客户主键
    @Column(name = "cust_name")
    private String custName;//客户名称
    @Column(name = "cust_source")
    private String custSource;//客户来源
    @Column(name = "cust_level")
    private String custLevel;//客户级别
    @Column(name = "cust_industry")
    private String custIndustry;//客户所属行业
    @Column(name = "cust_phone")
    private String custPhone;//客户联系方式
    @Column(name = "cust_address")
    private String custAddress;//客户地址
    public Long getCustId() {
        return custId;
    }
    public void setCustId(Long custId) {
        this.custId = custId;
    }
    ....
```

## 2.测试保存

操作步骤

```java
/**
 * Jpa的操作步骤
 *      1加载配置文件创建工厂(实体管理类工厂 )对象
 *      2.通过实体管理类工厂获取实体管理器
 *      3.获取事务对象，开启事务
 *      4.完成增删改查操作
 *      5.提交事务(回滚事务)
 *      6.释放资源
 */
```

```java
package cn.yy.test;
import cn.yy.domain.Customer;
import org.junit.Test;
import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.EntityTransaction;
import javax.persistence.Persistence;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2022/12/4
 */
public class jpaTest {
    @Test
    public void testSave(){
        //1加载配置文件创建工厂(实体管理类工厂 )对象
        EntityManagerFactory factory = Persistence.createEntityManagerFactory("myJpa");
        //2.通过实体管理类工厂获取实体管理器
        EntityManager em = factory.createEntityManager();
        // 3.获取事务对象，开启事务
        EntityTransaction tx = em.getTransaction();//获取事务对象
        tx.begin();//开启事务
        //4.完成增删改查操作：保存一个括号到数据库中
        Customer customer = new Customer();
        customer.setCustName("延迟");
        customer.setCustIndustry("学习");
        //保存
        em.persist(customer);
        //5.提交事务(回滚事务)
        tx.commit();
        //6.释放资源
        em.close();
        factory.close();
    }
}
```

运行结果信息：

上面的运行有一点问题：在进行操作时，需要将表删除后再创建表再进行操作，所有我们不能在其配置文件中把自动创建数据库表的属性设置为create（上面所使用的是create）

修改为update后的运行结果

如果将该数据库表进行删除，再次运行会自动创建该表，如果是none的话就不可以了
