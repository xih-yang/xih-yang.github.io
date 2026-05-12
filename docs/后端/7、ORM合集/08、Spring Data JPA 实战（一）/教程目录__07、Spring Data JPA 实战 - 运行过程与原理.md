# 07、Spring Data JPA 实战 - 运行过程与原理
- 来源：https://ddkk.com/zhuanlan/orm/springdatajpa/5/7.html
- 分类：ORM框架
- 分组：教程目录
## 1. SpringDataJPA运行过程与原理分析

### 1.1 分析大致过程

对应一个程序来说，真正发挥作用的是接口的实现类，

所以使用SpringDataJPA时，

在查询执行的过程中，会自动的帮助我们都动态的生成接口的是实现类对象，调用实现里面的方法去实现想要的效果

动态的生成实现类对象的方法：

**1、** 动态代理：生成基于接口的实现类对象；

### 1.2 debug运行分析

通过debug可以发现，在执行时会自动生成一个动态代理dao对象

> dao对象生成：

借助springAOP中的JdkDynamicAopProxy获取：其中有invoke对象，通过其生成一个target对象（SimpleJpaRepository）

### 1.3 文字描述

**1、** 通过JdkDynamicAopProxy的invoke方法创建了一个动态代理对象；

**2、** SimpleJpaRepository当中封装了JPA的操作（借助JPA的api完成数据库的CRUD）；

**3、** 通过hibernate完成数据库操作（封装了jdbc）；
