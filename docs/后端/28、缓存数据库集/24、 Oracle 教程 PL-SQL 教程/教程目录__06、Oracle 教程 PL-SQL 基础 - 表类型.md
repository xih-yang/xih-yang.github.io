# 06、Oracle 教程 PL/SQL 基础 - 表类型
- 来源：https://ddkk.com/zhuanlan/db/oracle/4/6.html
- 分类：缓存数据库
- 分组：教程目录
表类型也叫做**嵌套表**。

使用记录类型变量只能保存一行数据，这限制了[SELECT语句的返回行数](http://www.itxuexiwang.com/a/shujukujishu/oracle/2016/0216/89.html?1455872314)，如果SELECT语句返回多行就会错。Oracle提供了另外一种自定义类型，也就是表类型，它是对记录类型的扩展，允许处理多行数据，类似于表。

创建表类型的语法如下：

```java
TYPE table_name AS | IS TABLE OF data_type [ NOT NULL ]；
```

语法说明如下：

- **table_name**：创建的表类型名称。
- **AS | IS TABLE**：表示创建的是表类型。
- **data_type**：可以是任何合法的PL/SQL数据类型，例如varchar2或者一个记录类型。

例如：声明一个表类型：

```java
type my_emp is table of scott.emp%rowtype
index by binary_integer;
new_emp my_emp;
```

如果要给表类型**赋值**：就和java中的数组一样：new_emp(1).name := 'fyk';

**注意：** 不能直接对表变量赋值：select * into new_emp from scott.emp where deptno=30; 这种赋值方法是错的，赋值需要使用下标，如上面的的例子。
