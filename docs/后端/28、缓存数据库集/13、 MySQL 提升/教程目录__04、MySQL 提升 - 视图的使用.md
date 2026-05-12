# 04、MySQL 提升 - 视图的使用
- 来源：https://ddkk.com/zhuanlan/db/mysql/1/4.html
- 分类：缓存数据库
- 分组：教程目录
## 一、概述

视图是一个虚拟表，是sql的查询结果，其内容由查询定义。同真实的表一样，视图包含一系列带有名称的列和行数据。

并且在使用视图时动态生成。视图的数据变化会影响到基表，基表的数据变化也会影响到视图。

## 二、操作视图

### 1，准备数据

**创建一个学生表**

数据如下：

**创建一个教师表**

数据如下：

### 2，视图的创建

**语法：**

```java
create view 视图名称 as 查询语句(结果);
```

示例：将学生表和教师表通过class关联起来，得到哪个老师教哪些学生的一个结果视图

```java
create view teacher_student_info as
select s.key_id,s.s_name,t.t_name from student_info s , teacher_info t where s.class=t.class;
```

**查看视图中的数据**

### 3，视图的使用

使用方式和普通的表一样。

查询学生名字为张三的数据

```java
select * from teacher_student_info where s_name = '张三';
```

### 4，视图的修改

**语法：**

方式一：

```java
create or replace view 视图名 as 查询语句(结果);
```

方式二：

```java
alter view 视图名 as 查询语句(结果);
```

**示例：**

视图中原本由ke y_id,s_name,t_name三个字段，现在把key_id这个字段删除：

```java
alter view teacher_student_info as
select s.s_name,t.t_name from student_info s , teacher_info t where s.class=t.class;
```

此时再次执行查询学生名字为张三的数据：

可以看到key_id这个字段已经没有了。

### 5，视图的删除

**语法：**

```java
drop view 试图名1[,试图名2,...];
```

### 6，视图信息的查看

**语法：**

–查看视图的表结构：

```java
desc 试图名;
```

desc teacher_student_info;

–查看视图的创建过程（sql语句）

```java
show create view 试图名;
```

show create view teacher_student_info;

## 三、操作视图数据

### 1，修改视图数据

新增、修改、删除语句都与普通表的操作相同，但是一般来说都不会或者不要通过视图来修改数据，因为对视图数据的修改会影响到原始表，会把原始表的数据也修改了。

### 2，无法修改的视图

当视图在创建时有一下特点的情况，视图都无法修改

- 包含以下关键字的sql语句：分组函数、distinct、group by、having、union
- 常量视图（create view test_view_name as select ‘88888’ t_name;）
- select 中包含子查询
- join连接查询
- from一个不能修改的视图
- where子句的自查询引用了from子句中的表

## 四、表与视图的对比

语法
是否占用实际存储空间
草足使用

视图
create view
不占用：只保存了sql逻辑
增删改查(一般只用于查询)

表

create table
占用：保存了实际的数据

### 视图的好处

- 重用sql语句
- 简化复杂的sql操作，不必知道它的查询细节
- 保护数据，提高数据安全性
