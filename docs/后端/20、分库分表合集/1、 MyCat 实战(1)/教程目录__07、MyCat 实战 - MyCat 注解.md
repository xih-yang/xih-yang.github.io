# 07、MyCat 实战 - MyCat 注解
- 来源：https://ddkk.com/zhuanlan/sharding/mycat/1/7.html
- 分类：分库分表
- 分组：教程目录
## Mycat不支持的SQL语句：

1、某些SQL语法，如insert into......select.....

2、跨库关联查询

3、存储过程创建

4、存储过程调用

所以Mycat 提供 **Mycat 注解**来解决上面这些不支持的SQL语句

## 注解概念：

MyCat 对自身不支持的 Sql 语句提供了一种解决方案——在要执行的 SQL 语句前添加额外的一段由注解 SQL 组织的代码，这样 Sql 就能正确执行，这段代码称之为"注解"。注解的使用相当于对 MyCat 不支持的 sql 语句做了一层透明代理转发，直接交给目标的数据节点进行 sql 语句执行，其中注解 SQL 用于确定最终执行 SQL 的数据节点。

## 注解格式：

> /*!mycat:sql=Mycat注解SQL语句*/真正执行的SQL !号方式
>
> /*#mycat:sql=Mycat注解SQL语句*/真正执行的SQL #号方式
>
> /**mycat:sql=Mycat注解SQL语句*/真正执行的SQL *号方式

使用时将=号后的"注解Sql语句"替换为需要的 Sql 语句即可

### 注解原理:

MyCat 执行 SQL 语句的流程是先进行 SQL 解析处理，解析出分片信息(路由信息)后，然后到该分片对应的物理库上去执行；若传入的 SQL 语句 MyCat 无法解析，则 MyCat 不会去执行；而注解则是告诉 MyCat 按照注解内的 SQL（称之为注解SQL）去进行解析处理，解析出分片信息后，将注解后真正要执行的 SQL 语句（称之为原始 SQL）发送到该分片对应的物理库上去执行。

从上面的原理可以看到，注解只是告诉 MyCat 到何处去执行原始 SQL ；因而使用注解前，要清楚的知道该原始 SQL 去哪个分片执行，然后在注解 SQL 中也指向该分片，这样才能使用！

需要说明的是，若注解 SQL 没有能明确到具体某个分片，则 MyCat 会将原始 SQL 发送到 xxx 表所在的所有分片上去执行去，这样造成的后果若是插入语句，则在多个分片上都存在重复记录，同样查询、更新、删除操作也会得到错误的结果！

## 注解规范：

1>注解SQL使用select语句，不允许使用delete/update/insert等语句；虽然delete/update/insert等语句也能用在注解中，但这些语句在Sql处理中有额外的逻辑判断，从性能考虑，请使用select语句。

2>注解SQL禁用表关联语句。

3>注解SQL尽量用最简单的SQL语句，如select id from tab_a where id=’10000’（如果必要，最好能在注解中指定分片）

4>无论是原始SQL 还是注解SQL，禁止DDL语句

5>能不用注解的尽量不用

真正执行的SQL
注解SQL

Select

1> 选择能唯一确定分片的主表，如与用户表关联的时候可以选择用户表

2> 若是业务需要在主表所在的各个分片上都执行可以不加能确定分片的条件

Insert

**对于分片表**
     1> 使用 insert 的表做注解 SQL
     2> 注解 SQL 必须能确认具体到某个分片
     3> 原始 SQL 插入的字段必须包含分片字段
     4> 原始 SQL 中包含的分片字段和注解 SQL 中的分片字段确定的分片务必要一致
     5> 对于 insert … select 这种语句，请务必确认插入的记录都在当前查找到的分片上

**非分片表**
     1> 注解 SQL 必须能具体确认到某个分片
     2> 注解 SQL 包含的分片字段其分片上必须包含这个非分片表

Delete
1> 对于分片表使用要删除记录的表做注解 SQL

Update

1> 对于分片表用所要更新的表做注解 SQL

2> 禁止更新分片表的分片列

3> 根据业务需要添加注解 SQL 的分片字段值

Call

1> 若是要在所有的分片上都执行存储过程，则使用一个在所有分片上都包含的表，不添加任何分片条件调用存储过程

2> 若是单个分片执行，使用能确认到这个分片的表以及分片条件

**补充说明：**

**使用注解并不额外增加MyCat的执行时间**；从解析复杂度以及性能考虑，注解SQL应尽量简单。至于一个 SQL 使用注解和不使用注解的性能对比，不存在参考意义，因为前提是 MyCat 不支持的 SQL 才使用注解。

## 注解使用：

**1.Mycat注解解决不支持insert into......select.....**

```java
/*!mycat:sql=select 1*/insert into travelrecord(id,user_id,traveldate,fee,days) select 3,'Tom','20180826',100,8;
```

**2.Mycat注解创建表**

```java
/*!mycat:sql=select 1 from test */create table test2(id int);
```

**3.Mycat注解创建存储过程**

```java
/*!mycat:sql=select 1 from test */create procedure 'test_proc()' begin end;
```

**4.Mycat注解调用存储过程**

```java
/*!mycat:sql=select * from user where id=1 */call test_proc();
```

**5.Mycat注解读写分离数据源选择**

```java
/*!mycat:db_type=master */select * from travelrecord;(强制走主库)
/*!mycat:db_type=slave */select * from travelrecord;(强制走从库)
```

**6.MyCat注解跨库关联查询(仅支持两表关联，前提是：需要将A库中的逻辑表先加入到B库，在使用如下进行关联查询)**

```java
/*!mycat:catlet=io.mycat.catlets.ShareJoin */
select * from users u,employee em on u.phoneNum=em.phoneNum where u.phoneNum ='13633333333' ;
```

## 解决MyCat关联查询问题总结

用好ER表

善用全局表

使用注解 (/*!mycat:catlet=io.mycat.catlets.ShareJoin */)
