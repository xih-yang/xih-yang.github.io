# 06、Spring Data JPA 实战 - 概述与使用SpringDataJPA进行CRUD操作
- 来源：https://ddkk.com/zhuanlan/orm/springdatajpa/5/6.html
- 分类：ORM框架
- 分组：教程目录
## 1. SpringDataJPA概述

### 1.1 概述

官网：[链接](https://spring.io/projects/spring-data-jpa)

SpringDataJPA是一种访问数据库层的一种技术手段，操作起来非常简单

`特性`：

**1、** 对spring和JPA进行统一的整合，可以很方便的操作数据库；

**2、** SpringDataJPA是Spring基于ORM框架、JPA规范的基础上封装的一套JPA应用框架；

> 可使开发者用极简的代码即可实现对数据库的访问和操作。

**3、** 它提供了包括增删改查等在内的常用功能，且易于扩展！使用SpringDataJPA可以极大提高开发效率！；

**4、** SpringDataJPA让我们解脱了DAO层的操作，基本上所有CRUD都可以依赖于它来实现；

> 在实际的工作工程中，推荐使用Spring Data JPA + ORM（如：hibernate）完成操作，这样在切换不同的ORM框架时提供了极大的方便，同时也使数据库层操作更加简单，方便解耦

**5、**`使用了SpringDataJpa，我们的dao层中只需要写接口，就自动具有了增删改查、分页查询等方法`；

### 1.2 关系

**JPA**是一套`规范`，内部是由`接口和抽象类组成`的。

**hibernate**是一套成熟的`ORM框架`，而且Hibernate`实现了JPA规范`，所以也可以称hibernate为JPA的一种实现方式，我们使用JPA的API编程，意味着站在更高的角度上看待问题（面向接口编程）

**Spring Data JPA**是Spring提供的一套`对JPA操作更加高级的封装`，是在JPA规范下的专门用来进行数据持久化的解决方案。

**1、** SpringDataJPA将使用jpa规范中实现数据库操作逻辑进行了封装，在这里也只是进行了规范和接口，不真正的干活，；

**2、** 真正干活的还是Hibernate框架，在hibernate框架里面封装了jdbc操作，；

**3、** 然后去对数据库进行操作（如CRUD操作等）；

>

## 2. SpringDataJPA入门操作

实现数据库表基本的CRUD操作

### 2.1 搭建环境

#### 2.1.1 创建工程导入坐标

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.yy</groupId>
    <artifactId>jpa-data</artifactId>
    <version>1.0-SNAPSHOT</version>
    <properties>
        <spring.version>4.2.4.RELEASE</spring.version>
        <hibernate.version>5.0.7.Final</hibernate.version>
        <slf4j.version>1.6.6</slf4j.version>
        <log4j.version>1.2.12</log4j.version>
        <c3p0.version>0.9.1.2</c3p0.version>
        <mysql.version>5.1.6</mysql.version>
    </properties>
    <dependencies>
        <!-- junit单元测试 -->
        <dependency>
            <groupId>junit</groupId>
            <artifactId>junit</artifactId>
            <version>4.9</version>
            <scope>test</scope>
        </dependency>
        <!-- spring beg -->
<!--        spring aop相对的坐标-->
        <dependency>
            <groupId>org.aspectj</groupId>
            <artifactId>aspectjweaver</artifactId>
            <version>1.6.8</version>
        </dependency>
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-aop</artifactId>
            <version>${spring.version}</version>
        </dependency>
        <!--springIOC坐标-->
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-context</artifactId>
            <version>${spring.version}</version>
        </dependency>
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-context-support</artifactId>
            <version>${spring.version}</version>
        </dependency>
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-beans</artifactId>
            <version>${spring.version}</version>
        </dependency>
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-core</artifactId>
            <version>${spring.version}</version>
        </dependency>
<!--        spring对orm框架的支持包-->
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-orm</artifactId>
            <version>${spring.version}</version>
        </dependency>
        <!-- spring end -->
        <!-- hibernate beg -->
        <dependency>
            <groupId>org.hibernate</groupId>
            <artifactId>hibernate-core</artifactId>
            <version>${hibernate.version}</version>
        </dependency>
        <dependency>
            <groupId>org.hibernate</groupId>
            <artifactId>hibernate-entitymanager</artifactId>
            <version>${hibernate.version}</version>
        </dependency>
        <dependency>
            <groupId>org.hibernate</groupId>
            <artifactId>hibernate-validator</artifactId>
            <version>5.2.1.Final</version>
        </dependency>
        <!-- hibernate end -->
        <!-- c3p0 beg -->
        <dependency>
            <groupId>c3p0</groupId>
            <artifactId>c3p0</artifactId>
            <version>${c3p0.version}</version>
        </dependency>
        <!-- c3p0 end -->
        <!-- log end -->
        <dependency>
            <groupId>log4j</groupId>
            <artifactId>log4j</artifactId>
            <version>${log4j.version}</version>
        </dependency>
        <dependency>
            <groupId>org.slf4j</groupId>
            <artifactId>slf4j-api</artifactId>
            <version>${slf4j.version}</version>
        </dependency>
        <dependency>
            <groupId>org.slf4j</groupId>
            <artifactId>slf4j-log4j12</artifactId>
            <version>${slf4j.version}</version>
        </dependency>
        <!-- log end -->
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <version>${mysql.version}</version>
        </dependency>
<!--        spring data jpa坐标-->
        <dependency>
            <groupId>org.springframework.data</groupId>
            <artifactId>spring-data-jpa</artifactId>
            <version>1.9.0.RELEASE</version>
        </dependency>
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-test</artifactId>
            <version>${spring.version}</version>
        </dependency>
        <!-- el beg 使用spring data jpa 必须引入 -->
        <dependency>
            <groupId>javax.el</groupId>
            <artifactId>javax.el-api</artifactId>
            <version>2.2.4</version>
        </dependency>
        <dependency>
            <groupId>org.glassfish.web</groupId>
            <artifactId>javax.el</artifactId>
            <version>2.2.4</version>
        </dependency>
        <!-- el end -->
    </dependencies>
</project>
```

#### 2.1.2 配置spring的配置文件

配置spring data jpa的整合

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:aop="http://www.springframework.org/schema/aop"
       xmlns:context="http://www.springframework.org/schema/context"
       xmlns:jdbc="http://www.springframework.org/schema/jdbc" xmlns:tx="http://www.springframework.org/schema/tx"
       xmlns:jpa="http://www.springframework.org/schema/data/jpa" xmlns:task="http://www.springframework.org/schema/task"
       xsi:schemaLocation="
		http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd
		http://www.springframework.org/schema/aop http://www.springframework.org/schema/aop/spring-aop.xsd
		http://www.springframework.org/schema/context http://www.springframework.org/schema/context/spring-context.xsd
		http://www.springframework.org/schema/jdbc http://www.springframework.org/schema/jdbc/spring-jdbc.xsd
		http://www.springframework.org/schema/tx http://www.springframework.org/schema/tx/spring-tx.xsd
		http://www.springframework.org/schema/data/jpa
		http://www.springframework.org/schema/data/jpa/spring-jpa.xsd">
    <!--spring 和 spring data jpa的配置-->
    <!-- 1.创建entityManagerFactory对象交给spring容器管理-->
    <bean id="entityManagerFactoty" class="org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean">
        <property name="dataSource" ref="dataSource" />
        <!--配置的扫描的包（实体类所在的包） -->
        <property name="packagesToScan" value="cn.yy.domain" />
        <!-- jpa的实现厂家（实现方式：hibernate） -->
        <property name="persistenceProvider">
            <bean class="org.hibernate.jpa.HibernatePersistenceProvider"/>
        </property>
        <!--jpa的供应商适配器 -->
        <property name="jpaVendorAdapter">
            <bean class="org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter">
                <!--配置是否自动创建数据库表 -->
                <property name="generateDdl" value="false" />
                <!--指定数据库类型，如果需要使用其他的数据库，可以更换数据库如：使用Oracle，则修改为ORACLE -->
                <property name="database" value="MYSQL" />
                <!--数据库方言：支持的特有语法 -->
                <property name="databasePlatform" value="org.hibernate.dialect.MySQLDialect" />
                <!--是否显示sql -->
                <property name="showSql" value="true" />
            </bean>
        </property>
        <!--jpa的方言 ：高级的特性，这些特性可以不写。
                   在使用不同的jpa实现方时，会有一些不同的高级特性
                        比如：使用的是hibernate，其有一些高级特性（如一级缓存二级缓存等），
                             如果配置了这些，springDataJpa就默认也有了hibernate这些高级特性
                   -->
        <property name="jpaDialect" >
            <bean class="org.springframework.orm.jpa.vendor.HibernateJpaDialect" />
        </property>
    </bean>
    <!--2.创建数据库连接池 -->
    <bean id="dataSource" class="com.mchange.v2.c3p0.ComboPooledDataSource">
        <property name="user" value="root"></property>
        <property name="password" value="2184021338"></property>
        <property name="jdbcUrl" value="jdbc:mysql:///myday17" ></property>
        <property name="driverClass" value="com.mysql.jdbc.Driver"></property>
    </bean>
    <!--3.整合spring dataJpa-->
<!--
    transaction-manager-ref：事务操作，事务管理器
    base-package：指定要写的dao接口所在的包
    entity-manager-factory-ref：对象。。。
-->
    <jpa:repositories base-package="cn.yy.dao" transaction-manager-ref="transactionManager"
                   entity-manager-factory-ref="entityManagerFactoty" ></jpa:repositories>
    <!--4.配置事务管理器 -->
    <bean id="transactionManager" class="org.springframework.orm.jpa.JpaTransactionManager">
        <property name="entityManagerFactory" ref="entityManagerFactoty"></property>
    </bean>
    <!-- 4.txAdvice-->
    <tx:advice id="txAdvice" transaction-manager="transactionManager">
        <tx:attributes>
            <tx:method name="save*" propagation="REQUIRED"/>
            <tx:method name="insert*" propagation="REQUIRED"/>
            <tx:method name="update*" propagation="REQUIRED"/>
            <tx:method name="delete*" propagation="REQUIRED"/>
            <tx:method name="get*" read-only="true"/>
            <tx:method name="find*" read-only="true"/>
            <tx:method name="*" propagation="REQUIRED"/>
        </tx:attributes>
    </tx:advice>
    <!--5.声明式事务 -->
    <!-- 6. 配置包扫描，扫描注解的位置-->
    <context:component-scan base-package="cn.yy" ></context:component-scan>
</beans>
```

#### 2.1.3 编写实体类

使用jpa注解配置映射关系

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
     *      strategy:选择策略时如果底层支持自增就选择IDENTITY，如果支持序列就选择SEQUENCE，剩下的两种作为理解内容
     *          GenerationType.IDENTITY：自增
     *              底层数据库必须支持自动增长(底层数据库支持的自动增长方式，对id自增)
     *          GenerationType.SEQUENCE：序列，比如Oracle数据库
     *              底层数据库必须支持序列
     *          GenerationType.TABLE：jpa提供的一种机制，通过一张数据库表的形式帮助我们完成主键自增
     *          GenerationType.AUTO：由程序自动的帮助我们选择主键生成策略
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
    ......
}
```

### 2.2 编写符合SpringDataJpa的dao层接口

`只需要编写dao层接口，不需要编写dao层接口的实现类`

`dao层规范`：

**1、** 需要继承两个接口（JpaRepository，JpaSpecificationExecutor）；

**2、** 需要提供响应的泛型；

如下便可以进行数据库的基本CRUD操作，里面不需要去写其他内容

```java
package cn.yy.dao;
import cn.yy.domain.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2022/12/5
 *
 *      符合SpringDataJpa的dao层接口规范
 *              JpaRepository<操作的实体类类型，实体类中主键属性的类型>
 *                  封装了基本CRUD操作”
 *              JpaSpecificationExecutor<操作的实体类类型>
 *                  封装了复杂查询(分页)
 */
public interface CustomerDao extends JpaRepository<Customer,Long>, JpaSpecificationExecutor<Customer> {
}
```

## 3. CRUD操作

### 3.1 查询操作

```java
package cn.yy.test;
import cn.yy.dao.CustomerDao;
import cn.yy.domain.Customer;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2022/12/5
 */
@RunWith(SpringJUnit4ClassRunner.class)//声明spring提供的单元测试环境
@ContextConfiguration(locations = "classpath:applicationContext.xml")//指定spring容器的配置信息
public class CustomerDaoTest {
    @Autowired//从容器中获取dao
    private CustomerDao customerDao;
    /**
     * 根据主键id查询
     */
    @Test
    public void testFindOne(){
        Customer customer = customerDao.findOne(3l);
        System.out.println(customer);
    }
}
```

运行结果：

### 3.2 保存或更新

这个方法是在3.1中的测试方法里面，为了简单起见，就不再将那些重复代码进行复制

```java
/**
     * save：保存或者更新
     *      根据传递的对象是否存在主键id,如果没有id主键属性:保存
     *      存在id主键属性，根据id查询数据，更新数据
     */
    @Test
    public void testSave(){
        Customer customer = new Customer();
        customer.setCustName("保存/添加后");
        customerDao.save(customer);
    }
    @Test
    public void testUpdate(){
        Customer customer = new Customer();
        customer.setCustId(4l);
        customer.setCustName("修改/更新后");
        customerDao.save(customer);
    }
```

运行结果：

> 运行testSave方法后

> 运行testUpdate方法后

### 3.3 删除

这个方法是在3.1中的测试方法里面，为了简单起见，就不再将那些重复代码进行复制

```java
/**
     * delete:删除
     */
    @Test
    public void testDelete(){
        customerDao.delete(3l);
    }
```

运行结果：

### 3.4 查询所有

这个方法是在3.1中的测试方法里面，为了简单起见，就不再将那些重复代码进行复制

```java
/**
     * findAll：查询所以
     */
    @Test
    public void testFindAll(){
        List<Customer> lis = customerDao.findAll();
        for(Customer customer:lis){
            System.out.println(customer);
        }
    }
```

运行结果：

## 4. 总结

findOne（id） ：根据id查询

save(customer):保存或者更新（依据：传递的实体类对象中，是否包含id属性）

delete（id） ：根据id删除

findAll() : 查询全部
