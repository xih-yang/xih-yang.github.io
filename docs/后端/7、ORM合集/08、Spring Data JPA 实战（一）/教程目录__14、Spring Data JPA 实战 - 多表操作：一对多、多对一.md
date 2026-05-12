# 14、Spring Data JPA 实战 - 多表操作：一对多、多对一
- 来源：https://ddkk.com/zhuanlan/orm/springdatajpa/5/14.html
- 分类：ORM框架
- 分组：教程目录
这里面的操作是以SpringDataJPA（13）中的4为背景，所执行的代码

## 0. 环境搭建

### 数据库表的创建

在此之前，我们已经创建了数据库表Customer，现在还需要创建联系人表

```java
/*创建联系人表*/
CREATE TABLE cst_linkman (
  lkm_id bigint(32) NOT NULL AUTO_INCREMENT COMMENT '联系人编号(主键)',
  lkm_name varchar(16) DEFAULT NULL COMMENT '联系人姓名',
  lkm_gender char(1) DEFAULT NULL COMMENT '联系人性别',
  lkm_phone varchar(16) DEFAULT NULL COMMENT '联系人办公电话',
  lkm_mobile varchar(16) DEFAULT NULL COMMENT '联系人手机',
  lkm_email varchar(64) DEFAULT NULL COMMENT '联系人邮箱',
  lkm_position varchar(16) DEFAULT NULL COMMENT '联系人职位',
  lkm_memo varchar(512) DEFAULT NULL COMMENT '联系人备注',
  lkm_cust_id bigint(32) NOT NULL COMMENT '客户id(外键)',
  PRIMARY KEY (lkm_id),
  KEY FK_cst_linkman_lkm_cust_id (lkm_cust_id),
  CONSTRAINT FK_cst_linkman_lkm_cust_id FOREIGN KEY (lkm_cust_id) REFERENCES cst_customer (cust_id) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;
```

### 创建maven模块和pom坐标

在这里为了方便起见，当前多表操作的过程是在之前的过程里面继续创建的，如果不清楚的话，请查看之前的博客。

#### dao层

```java
package cn.yy.dao;
import cn.yy.domain.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
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
public interface ManyCustomerDao extends JpaRepository<Customer,Long>, JpaSpecificationExecutor<Customer> {
}
```

联系人的dao

```java
package cn.yy.dao;
import cn.yy.domain.Customer;
import cn.yy.domain.LinkMan;
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
public interface ManyLinkManDao extends JpaRepository<LinkMan,Long>, JpaSpecificationExecutor<LinkMan> {
}
```

#### 实体类对象

之前我们已经将Customer表的实体类对象创建出来了，接下来还需要将联系人表的实体类对象创建出来

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
@Table(name = "cst_linkman")
public class LinkMan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "lkm_id")
    private long lkmId;//联系人编号(主键)
    @Column(name = "lkm_name")
    private String lkmName;//联系人姓名
    @Column(name = "lkm_gender")
    private String lkmGender;//联系人性别
    @Column(name = "lkm_phone")
    private  String lkmPhone;//联系人办公电话
    @Column(name = "lkm_mobile")
    private String lkmMobile;//联系人手机
    @Column(name = "lkm_email")
    private String lkmEmail;//联系人邮箱
    @Column(name = "lkm_position")
    private String lkmPosition;//联系人邮箱
    @Column(name = "lkm_memo")
    private String lkmMemo;//联系人备注
...
```

## 1. 多对一和一对多

配置客户和联系人之间的关系：一对多

### 1.1 在实体类中配置多对一和一对多的关系

#### 1.1.1 客户实体类配置一对多

```java
package cn.yy.domain;
import javax.persistence.*;
import java.util.HashSet;
import java.util.Set;
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
    //配置客户和联系人之间的关系：一对多
    /*使用注解的形式配置多表关系
        1.声明关系：
            @OneToMany：配置一对多关系
                targetEntity：对方对象的字节码对象
        2.配置外键（中间表）:
            @JoinColumn：配置外键
                name：外键字段名称
                referencedColumnName：参照的主表的主键字段名称
        在客户实体类上(一的一方)添加了外键了配置，所以对于客户而言，也具备了维护外键的作用
     */
    @OneToMany(targetEntity = LinkMan.class)
    @JoinColumn(name = "lkm_cust_id",referencedColumnName = "cust_id")
    private Set<LinkMan> linkMans = new HashSet<LinkMan>();
    public Set<LinkMan> getLinkMans() {
        return linkMans;
    }
    public void setLinkMans(Set<LinkMan> linkMans) {
        this.linkMans = linkMans;
    }
```

#### 1.1.2 联系人实体类配置多对一

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
@Table(name = "cst_linkman")
public class LinkMan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "lkm_id")
    private long lkmId;//联系人编号(主键)
    @Column(name = "lkm_name")
    private String lkmName;//联系人姓名
    @Column(name = "lkm_gender")
    private String lkmGender;//联系人性别
    @Column(name = "lkm_phone")
    private  String lkmPhone;//联系人办公电话
    @Column(name = "lkm_mobile")
    private String lkmMobile;//联系人手机
    @Column(name = "lkm_email")
    private String lkmEmail;//联系人邮箱
    @Column(name = "lkm_position")
    private String lkmPosition;//联系人邮箱
    @Column(name = "lkm_memo")
    private String lkmMemo;//联系人备注
    //配置联系人到客户的多对一关系
    /*使用注解的形式配置多对一关系
            1.配置表关系
                @ManyToOne：配置多对一关系
                    targetEntity：对方对象的字节码对象
            2.配置外键（中间表）
                @JoinColumn：配置外键
                    name：外键字段名称
                    referencedColumnName：参照的主表的主键字段名称
             配置外键的过程，配置到了多的一方，就会在多的一方维护外键
     */
    @ManyToOne(targetEntity = Customer.class)
    @JoinColumn(name = "lkm_cust_id",referencedColumnName = "cust_id")
    private Customer customer;
    public Customer getCustomer() {
        return customer;
    }
    public void setCustomer(Customer customer) {
        this.customer = customer;
    }
```

`需要注意一点，便是实体类中配置一对多或多对多关系时，需要注意注解顺序，最好还是按@OneToMany、@JoinColumn这样的顺序进行，并且这两个注解必须在需要配置属性上面才可以`

#### 1.1.3 修改核心配置文件

applicationContext.xml

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
<!--        注入jpa的配置信息
                加载jpa的基本配置信息和jpa实现方式(hibernate)的配置信息
                hibernate.hbm2ddl.auto :自动创建数据库表
                    create：每次都会重新创建数据库表
                    update:有表不会重新创建，没有表会重新创建表
-->
        <property name="jpaProperties">
            <props>
                <prop key="hibernate.hbm2ddl.auto">create</prop>
            </props>
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

### 1.2 测试

#### 1.2.1 保存

测试类

```java
package cn.yy.test;
import cn.yy.dao.ManyCustomerDao;
import cn.yy.dao.ManyLinkManDao;
import cn.yy.dao.SpecCustomerDao;
import cn.yy.domain.Customer;
import cn.yy.domain.LinkMan;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.test.annotation.Rollback;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import org.springframework.transaction.annotation.Transactional;
import javax.persistence.criteria.*;
import java.util.List;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2022/12/5
 */
@RunWith(SpringJUnit4ClassRunner.class)//声明spring提供的单元测试环境
@ContextConfiguration(locations = "classpath:applicationContext.xml")//指定spring容器的配置信息
public class OneToManyTest {
    @Autowired
    private ManyCustomerDao manyCustomerDao;
    @Autowired
    private ManyLinkManDao manyLinkManDao;
    /**
     * 保存一个客户，保存一个联系人
     */
    @Test
    @Transactional//配置事务
    @Rollback(false)//不自动回滚
    public void testAdd(){
        //创建客户对象和联系人对象
        Customer customer = new Customer();
        customer.setCustName("百度");
        LinkMan linkMan = new LinkMan();
        linkMan.setLkmName("小王");
        /*
            配置了客户到联系人的关系
                从客户的角度上:发送两条insert语句， 发送一条更新语句更新数据库( 更新外键)
                因为我们配置了客户到联系人的关系：客户可以对外界进行维护
         */
        customer.getLinkMans().add(linkMan);
        /* 同理，可以将上面的这句话设置为：二者效果一样
            只发送了两条insert语句
                由于配置了联系人到客户的映射关系(多对一)
         */
        //linkMan.setCustomer(customer);
        manyCustomerDao.save(customer);
        manyLinkManDao.save(linkMan);
    }
}
```

运行结果：

#### 1.2.2 解决多了一个update操作：放弃外键维护

修改实体类中声明外键关系的注释

```java
/*使用注解的形式配置多表关系
1.声明关系：
@OneToMany：配置一对多关系
targetEntity：对方对象的字节码对象
2.配置外键（中间表）:
@JoinColumn：配置外键
name：外键字段名称
referencedColumnName：参照的主表的主键字段名称
在客户实体类上(一的一方)添加了外键了配置，所以对于客户而言，也具备了维护外键的作用
*/
//    @OneToMany(targetEntity = LinkMan.class)
//    @JoinColumn(name = "lkm_cust_id",referencedColumnName = "cust_id")
/*
放弃外键维护权：
mappedBy:对方配置关系的属性名称
*/
@OneToMany(mappedBy =  "customer" )
private Set<LinkMan> linkMans = new HashSet<LinkMan>();
```

测试方法在1.2.1中的测试类中

```java
/**
 *  会有一条多余的update语句:
 *      由于一的一方可以维护外键:会发送update语句
 *      解决此问题:只需要在一的一方放弃维护权即可
 */
@Test
@Transactional//配置事务
@Rollback(false)//不自动回滚
public void testAdd2(){
    //创建客户对象和联系人对象
    Customer customer = new Customer();
    customer.setCustName("百度");
    LinkMan linkMan = new LinkMan();
    linkMan.setLkmName("小王");
    linkMan.setCustomer(customer);//由于配置了多的一方到一-的一方的关联关系(当保存的时候，就已经对外键赋值)
    customer.getLinkMans().add(linkMan);//由于配置了一的一方到多的一方的关联关系(发送一条update语句)
    manyCustomerDao.save(customer);
    manyLinkManDao.save(linkMan);
}
```

运行结果：

#### 1.2.3 级联操作

操作一个对象的同时操作他的关联对象

`级联操作`：

**1、** 需要区分操作主体；

**2、** 需要在操作主体的实体类上，添加级联属性（需要添加到多表映射关系的注解上）；

**3、** cascade（配置级联）；

级联添加:

> 案例：当我保存一个客户的同时保存联系人

级联删除:

> 案例：当我删除一个客户的同时删除此客户的所有联系人

#### 1.2.4 级联添加

修改Customer实体类里面的注解内容，因为我测试的是使用customerDao进行添加，所以才是在Customer实体类中进行修改

```java
/*
	cascade :配置级联(可以配置到设置多表的映射关系的注解上)
		CascadeType.all	所有
					MERGE	更新
					PERSIST	保存
					REMOVE	删除
*/
@OneToMany(mappedBy =  "customer" ,cascade = CascadeType.ALL)//ALL是级联所有操作
    private Set<LinkMan> linkMans = new HashSet<LinkMan>();
```

测试方法在1.2.1中的测试类中

```java
/**
 * 级联添加:保存一个客户的同时， 保存客户的所有联系人
 *      需要在操作主体的实体类上，配置casacde属性
 *
 */
@Test
@Transactional//配置事务
@Rollback(false)//不自动回滚
public void testAdd3(){
    //创建客户对象和联系人对象
    Customer customer = new Customer();
    customer.setCustName("级联添加客户");
    LinkMan linkMan = new LinkMan();
    linkMan.setLkmName("级联添加联系人");
    linkMan.setCustomer(customer);//由于配置了多的一方到一-的一方的关联关系(当保存的时候，就已经对外键赋值)
    customer.getLinkMans().add(linkMan);//由于配置了一的一方到多的一方的关联关系(发送一条update语句)
    manyCustomerDao.save(customer);
}
```

运行结果：

#### 1.2.4 级联删除

修改配置文件，使其不能重新创建表

```xml
<property name="jpaProperties">
    <props>
        <prop key="hibernate.hbm2ddl.auto">update</prop>
    </props>
</property>
```

测试方法在1.2.1中的测试类中

```java
/**
 * 级联删除:
 *      删除1号客户的同时，删除1号客户的所有联系人
 */
@Test
@Transactional//配置事务
@Rollback(false)//不自动回滚
public void testDelete(){
    //查询1号客户
    Customer customer = manyCustomerDao.findOne(2l);
    //删除1号客户
    manyCustomerDao.delete(customer);
}
```

运行结果：
