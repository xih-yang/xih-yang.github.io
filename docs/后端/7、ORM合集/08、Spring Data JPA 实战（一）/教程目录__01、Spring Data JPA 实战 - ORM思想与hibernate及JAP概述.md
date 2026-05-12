# 01、Spring Data JPA 实战 - ORM思想与hibernate及JAP概述
- 来源：https://ddkk.com/zhuanlan/orm/springdatajpa/5/1.html
- 分类：ORM框架
- 分组：教程目录
## 1.ORM思想

### 1.1 回顾jdbc操作

第一步：首先需要创建一个实体类，如User

第二步：需要选择一个数据表，如t_user表

第三步：使用java代码进行实现

```java
//第一步：创建sql语句
String sql = "insert into t_user(username,address) values(?,?)";
//2：获取连接
Connection conn = DriverManager.getConnection(username,password,url);
//3:创建statment对象
PreparedStatment pst = conn.prepareStatment(sql);
//4:对占位符进行赋值
pst.getString(1,user.getUsername());
pst.getString(2,user.getAddress());
//发送查询
pst.executeUpdate();
```

缺点：

**1、** 操作比较麻烦，每一个sql语句都要进行获取连接，创建对象；

**2、** 占位符赋值麻烦，因为每一个占位符都要进行赋值；

### 1.2 ORM思想

ORM：对象关系映射

解决JDBC缺点的方法：将JDBC操作进行封装，将实体类与数据库里面表进行映射（`建立实体类与表的关系，建立实体类中属性与表中字段的关系`）。由此出现ORM思想。

主要目的：实现操作实体类相对于操作数据库表

两个映射关系：

**1、** 建立实体类与表的关系；

**2、** 建立实体类中属性与表中字段的关系；

使其不用重点关注sql语句

实现ORM思想的框架：MyBatis、Hibernate

## 2.Hibernate概述

`实现ORM思想的框架Hibernate`

Hibernate

**1、** 是一个开放源代码的`对象关系映射框架`；

**2、**`对JDBC进行`了非常轻量级的对象`封装`，；

**3、** 它将POJO与数据库表建立映射关系，是一个`全自动的orm框架`，hibernate可以自动生成SQL语句，自动执行，使得Java程序员可以随心所欲的使用对象编程思维来操纵数据库；

## 3.JPA概述

JPA是一种规范，所有的生产厂家都实现JPA规范，内部由接口和抽象类组成（`JPA规范并不干活，只是定义了一系列的标准`，干活的一些生产厂家比如hibernate等）

### 3.1 JPA 规范

JDBC规范有操作不同的数据库的驱动（mysql驱动、Oracle驱动等），然后去操作数据库，通过其中的接口Connection和statment等接口去实现

JPA规范的实现方式： hibernate、toplink等

他们里面调用的逻辑都是使用JPA规范提供的接口或者是抽象类来完成，如果后面的实现方式改变，只需要修改一些配置，比如将hibernate改为toplink等，其中的java代码不需要修改

JPA规范依赖于其实现方式去操作数据库，学习了JPA规范就相当于学习了hibernate和toplink等

### 3.2 JPA优点

**1、** 标椎化；

任何声称符合JPA标准的框架都遵循同样的架构，提供相同的访问API，保证基于JPA开发的企业应用能够结果少量的修改就能够在不同的JPA框架下运行。

**2、** 容器级特性的支持；

JPA框架中支持大数据集、事务、并发等容器级事务，这使得JPA超越了简单持久化框架的局限，在企业应用发挥更大的作用。

**3、** 简单方便；

JPA基于非侵入式原则设计，因此可以很容易的和其它框架或者容器集成。

**4、** 查询能力；

JPA的查询语言是`面向对象而非面向数据库的`，它以面向对象的自然语法构造查询语句，可以看成是Hibernate HQL的等价物。JPA定义了独特的JPQL (Java Persistence Query Language)，JPQL是EJBQL的一种扩展，它是针对实体的一种查询语言，操作对象是实体，而不是关系数据库的表，而且能够支持批量更新和修改、JOIN、 GROUP BY、HAVING 等通常只有SQL才能够提供的高级查询特性，甚至还能够支持子查询。
