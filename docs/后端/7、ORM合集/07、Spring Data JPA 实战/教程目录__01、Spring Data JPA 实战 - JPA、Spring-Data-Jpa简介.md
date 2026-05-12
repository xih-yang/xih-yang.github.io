# 01、Spring Data JPA 实战 - JPA、Spring-Data-Jpa简介
- 来源：https://ddkk.com/zhuanlan/orm/springdatajpa/1/1.html
- 分类：ORM框架
- 分组：教程目录
写在前面：在国内使用比较多的ORM框架应该就是Mybatis了，但是现在SpringBoot和SpringCloud这么火爆，而Spring-Data-Jpa同样作为Spring家族的成员，它们无缝的整合，使用方便，开发便捷。目前我所在的公司也是在使用Spring-Data-Jpa，虽然现阶段使用起来没什么问题， 但是想系统的学习一遍，让使用的时候更加得心应手。

### 一、什么是JPA

JPA是Java Persistence API的简称，是JDK5.0注解或XML描述对象-关系表的映射关系，并将运行期的实体对象持久化到数据库中。通俗的说就是像JDBC一样是一套接口规范，让应用程序以统一的方式访问持久层。

JPA包括以下3方面内容：

1、一套API规范：在javax.persistence包下，用来操作实体对象，执行CRUD操作，框架在底层为我们完成操作。

2、JPQL：面向对象的查询语言，避免程序和具体的SQL紧密耦合。

3、ORM元数据映射：支持XML和注解两种元数据形式，元数据描述对象和表之间的关系，框架根据对应关系将实体对象持久化到数据库表中。

### 二、什么是Spring-Data-JPA

是Spring-Data的主要子项目，可以理解为JPA规范的再次封装抽象，底层使用的是Hibernate的JPA技术实现，引用JPQL查询语言，属于Spring整个生态系统的一部分。

### 三、项目搭建

项目搭建就很容易了，我们直接使用IDEA，来创建SpringBoot项目，并勾选相关选项就好了，Spring-Data-Jpa必选，Lombok让我们代码更简洁一些。

需要注意的是，SpringBoot2.2.0当中使用的驱动是mysql8，而我本地是mysql5.7，需要改一下驱动的版本号，配置文件也有点区别。如果你的数据库是8的话，spring.datasource.driver-class-name

则使用com.mysql.cj.jdbc.Driver

然后，运行测试用例，不报错即可。

源码地址：https://github.com/caofanqi/study-spring-data-jpa
