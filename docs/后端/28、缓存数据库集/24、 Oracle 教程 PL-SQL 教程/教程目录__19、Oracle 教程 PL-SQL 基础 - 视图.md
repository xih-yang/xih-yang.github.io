# 19、Oracle 教程 PL/SQL 基础 - 视图
- 来源：https://ddkk.com/zhuanlan/db/oracle/4/19.html
- 分类：缓存数据库
- 分组：教程目录
视图在数据库中可以理解为一张虚拟的表。它是一个基于一个表或多个表的逻辑表，视图本身不包含任何数据，只是一个查询语句的结果。

语法：

```java
CREATE [ OR REPLACE ] [ [ NO ] FORCE ] VIEW
[ schema.]viewName [ (alias,...) inline_constraint(s) ] [out_of_line_constrain(s)]
AS subquery
[
    WITH {READ ONLY | CHECK OPTION [ CONSTRAINT constraint ] }
];
```

说明：

- **[ NO ] FORCE**：即FORRCE或NOFORCE，表示是否强制创建视图。例如：在基表不存在的情况下就创建视图是有错误的，这时可以用FORCE关键词强制创建视图，然后再创建基表。NO FORCE是默认值，即subquery中用到的表或者视图不存在，就会报错，如果用FORCE，则不会报错。
- **[ (alias,...) inline_constraint(s) ]**：视图字段的别名和内联的约束；
- **[out_of_line_constrain(s)]**：也是约束，是与 inline_constraint(s)相反的声明方式；
- **subquery**：查询语句，也就是视图中的数据来源；（这里的查询语句也可以包含其他的视图）
- **WITH READ ONLY**：设置视图只读，这样的视图具有更高的安全性；此时无法对只读的视图置顶DML操作；
- **WITH CHECK OPTION [ CONSTRAINT constraint ]**：一旦使用该限制，当对视图增加或修改数据时，必须满足子查询的条件。也就是说，是把子查询的条件作为一个约束，而constraint是这个约束的名称。

## 视图的创建：

```java
CREATE OR REPLACE VIEW PRODUCT_VIEW
AS
select id, name from product;
```

## 创建带约束的视图：

**1、** CREATEORREPLACEVIEWPRODUCT_VIEW；

**2、** (；

**3、** id,；

**4、** nameCONSTRAINTPRODUCT_VIEW_NAMEUNIQUERELYDISABLENOVALIDATE,；

**5、** CONSTRAINTPRODUCT_VIEW_IDPRIMARYKEY(id)RELYDISABLENOVALIDATE；

**6、** )；

**7、** AS；

**8、** selectid,namefromproduct;；

说明：第4行使用inline方式对name创建了UNIQUE约束；

第5行用out_of_line方式对视图设置了主键约束；

第4和5行中的RELY DISABLE NOVALIDATE表示约束对此前和此后的数据都不进行检查，并告知Oracle此视图现在符合这两种条件约束条件。

对视图进行DML操作，使用方式就和操作普通的表一样，另外对视图进行DML操作，实际上就是对基表进行DML操作。注意：如果使用WITH READ ONLY，则不能对视图进行DML操作。WITH CHECK OPTION是加上约束：

```java
CREATE OR REPLACE VIEW PRODUCT_VIEW
AS
    select id, name from product where name = '小王'
WITH CHECK OPTION；
```

此时，如果添加一个数据，name不是小王，则会报错，修改同样也是。删除会成功，但是不会有任何记录受影响。

总得来说，加上了WITH CHECK OPTION后，对视图进行了DML操作后，会在视图上显示出来，如果不能显示出来，则是不符合的。

## 删除视图：

```java
DROP VIEW [schema.]view [CASCADE CONSTRAINTS]
```

说明：CASCADE CONSTRAINTS：删除视图时删除约束。
