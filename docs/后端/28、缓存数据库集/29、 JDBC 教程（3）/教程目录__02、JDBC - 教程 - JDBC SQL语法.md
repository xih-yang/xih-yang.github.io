# 02、JDBC - 教程 - JDBC SQL语法
- 来源：https://ddkk.com/zhuanlan/db/jdbc/3/2.html
- 分类：缓存数据库
- 分组：教程目录
结构化查询语言(SQL)是一种标准化语言，允许对数据库执行操作，例如：创建数据记录，读取内容，更新内容和删除数据记录等。

本教程中将概述SQL，这是了解和学习JDBC概念的前提条件。 经过本章后，您将能够在数据库中创建，创建，读取，更新和删除(通常称为CRUD操作)数据。

**1. 创建数据库**

`CREATE DATABASE`语句用于创建新的数据库。 语法是 -

```java
SQL> CREATE DATABASE DATABASE_NAME;
```

SQL

**示例**

以下SQL语句创建一个名为`EMP`的数据库 -

```java
SQL> CREATE DATABASE EMP;
```

SQL

**2. 删除数据库**

`DROP DATABASE`语句用于删除存在的数据库。 语法是 -

> 注意：要创建或删除数据库，需要有数据库服务器的管理员权限。 需要特别小心的是：删除数据库将丢失数据库中存储的所有数据(无法恢复)。

**3. 创建表**

`CREATE TABLE`语句用于创建新表。 语法是 -

```java
SQL> CREATE TABLE table_name
(
   column_name column_data_type,
   column_name column_data_type,
   column_name column_data_type
   ...
);
```

SQL

**示例**

以下SQL语句创建一个名为`Employees`的表，其中包含四列：

```java
SQL> CREATE TABLE Employees
(
   id INT NOT NULL,
   age INT NOT NULL,
   first VARCHAR(255),
   last VARCHAR(255),
   PRIMARY KEY ( id )
);
```

SQL

**4. 删除表**

`DROP TABLE`语句用于删除存在的表。 语法是 -

```java
SQL> DROP TABLE table_name;
```

SQL

**示例**

以下SQL语句删除名为`Employees`的表 -

```java
SQL> DROP TABLE Employees;
```

SQL

**5. INSERT数据**

`INSERT`的语法如下所示，其中`column1`，`column2`等表示要显示在相应列中的数据值 -

```java
SQL> INSERT INTO table_name VALUES (column1, column2, ...);
```

SQL

**示例**

以下SQL `INSERT`语句在先前创建的`Employees`表中插入一个新行 -

```java
SQL> INSERT INTO Employees VALUES (100, 18, 'Max', 'Su');
```

SQL

**6. 查询数据**

`SELECT`语句用于从数据库检索数据。 `SELECT`的语法是 -

```java
SQL> SELECT column_name, column_name, ...
     FROM table_name
     WHERE conditions;
```

SQL

`WHERE`子句可以使用比较运算符，例如：`=`，`!=`，``，`=`，以及`BETWEEN`和`LIKE`运算符。

**示例**

以下SQL语句从`Employees`表中选择：`age`，`first`和`last`列，其中`id`列为`100` -

```java
SQL> SELECT first, last, age 
     FROM Employees 
     WHERE id = 100;
```

SQL

以下SQL语句从`Employees`表中选择：`age`, `first` 和 `last` 列，其中`first`列包含`Max` -

```java
SQL> SELECT first, last, age 
     FROM Employees 
     WHERE first LIKE '%Max%';
```

SQL

**7. 更新数据**

`UPDATE`语句用于更新数据。 `UPDATE`的语法是 -

```java
SQL> UPDATE table_name
     SET column_name = value, column_name = value, ...
     WHERE conditions;
```

SQL

`WHERE`子句可以使用比较运算符，例如：`=`，`!=`，``，`=`，以及`BETWEEN`和`LIKE`运算符。

**示例**

以下SQL `UPDATE`语句更新`id`为`100`的雇员的`age`列的值为：`20`，

```java
SQL> UPDATE Employees SET age=20 WHERE id=100;
```

SQL

**8. 删除数据**

`DELETE`语句用于从表中删除数据。 `DELETE`的语法是 -

```java
SQL> DELETE FROM table_name WHERE conditions;
```

SQL

`WHERE`子句可以使用比较运算符，例如：`=`，`!=`，``，`=`，以及`BETWEEN`和`LIKE`运算符。

**示例**

以下SQL `DELETE`语句将删除`ID`为`100`的员工的记录 -

```java
SQL> DELETE FROM Employees WHERE id=100;
```
