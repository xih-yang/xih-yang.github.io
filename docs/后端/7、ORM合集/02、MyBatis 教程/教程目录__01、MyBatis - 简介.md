# 01、MyBatis - 简介
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/1/1.html
- 分类：ORM框架
- 分组：教程目录
学习一个新的内容，我认为还是需要从是什么、为什么、怎么做（怎么用）三个点进行切入，下面我就以此三点对Mybatis进行学习。

## 一、Mybatis是什么

**1、** Mybatis简介；

MyBatis本是apache的一个[开源项目](https://baike.baidu.com/item/%E5%BC%80%E6%BA%90%E9%A1%B9%E7%9B%AE/3406069?fromModule=lemma_inlink)iBatis，2010年这个[项目](https://baike.baidu.com/item/%E9%A1%B9%E7%9B%AE/477803?fromModule=lemma_inlink)由apache software foundation迁移到了[google code](https://baike.baidu.com/item/google%20code/2346604?fromModule=lemma_inlink)，并且改名为MyBatis。2013年11月迁移到[Github](https://baike.baidu.com/item/Github/10145341?fromModule=lemma_inlink)。（摘自百度百科）

这里直接引用官网的文档：

中文文档网址：[https://mybatis.net.cn/index.html](https://mybatis.net.cn/index.html)

MyBatis 是一款优秀的持久层框架，它支持自定义 SQL、存储过程以及高级映射。MyBatis 免除了几乎所有的 JDBC 代码以及设置参数和获取结果集的工作。MyBatis 可以通过简单的 XML 或注解来配置和映射原始类型、接口和 Java POJO（Plain Old Java Objects，普通老式 Java 对象）为数据库中的记录。

**2、** 什么是持久层；

在了解什么是持久层之前我们需要先明白什么是持久化。

持久化，举个现实中的例子，食物放到冰箱里是为了让其长期的保鲜。同样，持久化也是为了让数据能够长期的保存起来，数据在内存中断电即失，于是我们就将其从内存保存到了数据库之中，这就是持久化的过程。

而持久层就是具体实现持久化操作的代码块，能够让数据在持久化状态和瞬时化状态进行转换。

**3、** 如何获得Mybatis：；

1、Github获取：[mybatis/mybatis-3: MyBatis SQL mapper framework for Java (github.com)](https://github.com/mybatis/mybatis-3)

2、Maven获取：

```xml
<!-- https://mvnrepository.com/artifact/org.mybatis/mybatis -->
<dependency>
    <groupId>org.mybatis</groupId>
    <artifactId>mybatis</artifactId>
    <version>3.5.10</version>
</dependency>
```

## 二、为什么要学习（使用）Mybatis

首先我们应该明白Mybatis只是一个框架，并不是必要的，但是它能够使我们在编程的过程中更加的方便和条理清晰。

我们应该要明白学习的目的是业务的需求，即有目的性地去学习，因为它有用我们去学习，如果没有用的话是不用学的。

传统的JDBC太过复杂，Mybatis框架就是为了实现对其的简化和自动化。

下面是一些Mybatis的优点（特性）：（摘自百度百科）

1、简单易学：本身就很小且简单。没有任何第三方依赖，最简单安装只要两个jar文件+配置几个sql映射文件。易于学习，易于使用。通过文档和源代码，可以比较完全的掌握它的设计思路和实现。

2、灵活：mybatis不会对应用程序或者数据库的现有设计强加任何影响。 sql写在xml里，便于统一管理和优化。通过sql语句可以满足操作数据库的所有需求。

3、解除sql与程序代码的耦合：通过提供DAO层，将业务逻辑和数据访问逻辑分离，使系统的设计更清晰，更易维护，更易单元测试。sql和代码的分离，提高了可维护性。

4、提供映射标签，支持对象与数据库的ORM字段关系映射。

5、提供对象关系映射标签，支持对象关系组建维护。

6、提供xml标签，支持编写动态sql。

## 三、Mybatis怎么用

后续我们将在具体的实例中进行展示。
