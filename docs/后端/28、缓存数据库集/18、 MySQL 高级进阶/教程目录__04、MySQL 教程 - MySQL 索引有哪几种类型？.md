# 04、MySQL 教程 - MySQL 索引有哪几种类型？
- 来源：https://ddkk.com/zhuanlan/db/mysql/6/4.html
- 分类：缓存数据库
- 分组：教程目录
## 问题01：索引有哪几种类型？

`MySQL`的索引包括普通索引、唯一性索引、全文索引、单列索引、多列索引和空间索引等。

按照功能逻辑，索引主要分为：普通索引、唯一索引、主键索引、全文索引。

按照物理实现方式，索引分为：聚簇索引和非聚簇索引。

按照作用字段个数，索引分为：分成单列索引和联合索引。

**1. 普通索引**

在创建普通索引时，不附加任何条件，只是用于提高查询效率。比如在student表中为name建立索引，在查询时使用该索引可以提高查询效率。

**2. 唯一性索引**

使用`unique`参数可以设置索引为唯一性索引，在创建唯一性索引时，限制该字段的值必须是唯一的，但是允许有`null`值，需要注意的是null值可能不是唯一的，一张表中可以有多个唯一性索引。

**3. 主键索引**

主键索引就是一种特殊的唯一性索引，在唯一索引的基础上增加了不为`null`的约束，也就是`not null+unique`，一张表中只能有一个主键索引。

**4. 单列索引**

在表的单个字段上建立索引，单列索引只根据该字段进行索引，单列索引可以是普通索引、唯一性索引、主键索引、全文索引。一个表可以有多个单列索引。

**5. 联合索引**

联合索引是以表的多个列建立索引，该索引指向创建时对应的多个字段，可以使用这几个字段进行查询，但是只有查询时使用了这些字段创建索引时的第一个字段时才会生效。

**6. 全文索引**

使用参数`FULLTEXT`可以设置索引为全文索引，在定义索引的列上支持值得全文查找，允许在这些索引列上插入重复值和空值。全文索引只能创建在`char、varcahr、text`类型及其系列类型的字段上，查询数据量较大的字符串类型的字段时，使用全文索引可以提高查询效率。

小结：

不同的存储引擎支持的索引类型也不一样

`InnoDB` ：支持 B-tree、Full-text 等索引，不支持 Hash索引；

`MyISAM` ： 支持 B-tree、Full-text 等索引，不支持 Hash 索引； Memory ：支持 B-tree、Hash 等索引，不支持 Full-text 索引；

`NDB` ：支持 Hash 索引，不支持 B-tree、Full-text 等索引； Archive ：不支持 B-tree、Hash、Full-text 等索引；

## 问题02：如何创建索引？

`MySQL`支持多种方法在单个或者多个列上创建索引，在创建表的定义语句`create table`中指定索引列，使用`alert table`语句在存在的表上创建索引，或者使用`create index`语句在已存在的表上添加索引。

**1. 创建表的时候创建索引**

使用`create table`创建表时，除了可以定义列的数据类型外，还可以定义主键约束，外键约束或者唯一性约束，而不论创建哪种约束，在定义约束的同时相当于在指定列上创建了一个索引。

```java
CREATE TABLE dept(
    dept_id INT PRIMARY KEY AUTO_INCREMENT, 主键约束，创建了主键索引，索引名和字段相同
    dept_name VARCHAR(20)
);
```

```java
CREATE TABLE emp(
    emp_id INT PRIMARY KEY AUTO_INCREMENT, 主键约束，创建了主键索引，索引名和字段相同
    emp_name VARCHAR(20) UNIQUE,           unique约束，创建了唯一性索引，索引名和字段相同
    dept_id INT,
    CONSTRAINT emp_dept_id_fk FOREIGN KEY(dept_id) REFERENCES dept(dept_id)
);
```

但是，如果显式创建表时创建索引的话，基本语法格式如下：

```java
CREATE TABLE table_name [col_name data_type] [UNIQUE | FULLTEXT | SPATIAL] [INDEX | KEY] [index_name] (col_name [length]) [ASC | DESC]
```

- UNIQUE 、 FULLTEXT 和 SPATIAL为可选参数，分别表示唯一索引、全文索引和空间索引；
- INDEX 与 KEY 为同义词，两者的作用相同，用来指定创建索引；
- index_name 指定索引的名称，为可选参数，如果不指定，那么MySQL默认col_name为索引名；
- col_name 为需要创建索引的字段列，该列必须从数据表中定义的多个列中选择；
- length 为可选参数，表示索引的长度，只有字符串类型的字段才能指定索引长度；
- ASC 或 DESC 指定升序或者降序的索引值存储。

**1、** 创建普通索引；

在book表中的year_publication字段上建立普通索引，SQL语句如下：

```java
CREATE TABLE book(
    book_id INT ,
    book_name VARCHAR(100),
    authors VARCHAR(100),
    info VARCHAR(100) ,
    comment VARCHAR(100),
    year_publication YEAR,
    INDEX(year_publication)
);
```

查看表的索引：

```java
show index from book
```

**2、** 创建唯一索引；

```java
CREATE TABLE test1(
    id INT NOT NULL,
    name varchar(30) NOT NULL,
    UNIQUE INDEX uk_idx_id(id)
);
```

**3、** 创建主键索引；

设定为主键后数据库会自动建立索引，innodb为聚簇索引，语法：

随表一起建索引：

```java
CREATE TABLE student (
    id INT(10) UNSIGNED  AUTO_INCREMENT ,
    student_no VARCHAR(200),
    student_name VARCHAR(200),
    PRIMARY KEY(id)
);
```

删除主键索引：

```java
alter table student drop primary key ; 
```

修改主键索引：必须先删除掉(drop)原索引，再新建(add)索引

**4、** 创建单列索引；

```java
CREATE TABLE test2(
    id INT NOT NULL,
    name CHAR(50) NULL,
    INDEX single_idx_name(name(20))
);
```

**5、** 创建组合索引；

```java
CREATE TABLE test3(
    id INT(11) NOT NULL,
    name CHAR(30) NOT NULL,
    age INT(11) NOT NULL,
    info VARCHAR(255),
    INDEX multi_idx(id,name,age)
);
```

**6、** 创建全文索引；

```java
CREATE TABLE test4(
    id INT NOT NULL,
    name CHAR(30) NOT NULL,
    age INT NOT NULL,
    info VARCHAR(255),
    FULLTEXT INDEX futxt_idx_info(info)
) ENGINE=MyISAM;
```

在MySQL5.7及之后版本中可以不指定最后的ENGINE了，因为在此版本中InnoDB支持全文索引。

```java
CREATE TABLE articles (
   id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
   title VARCHAR (200),
   body TEXT,
   FULLTEXT index (title, body)
) ENGINE = INNODB ;
```

创建了一个给title和body字段添加全文索引的表：

```java
CREATE TABLE papers (
     id int(10) unsigned NOT NULL AUTO_INCREMENT,
     title varchar(200) DEFAULT NULL,
     content text,
     PRIMARY KEY (id),
     FULLTEXT KEY title (title,content)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
```

**2. 在已经存在的表上创建索引**

在已经存在的表中创建索引可以使用alter table语句或者create index语句。

**1、** 使用altertable语句创建索引altertable语句创建索引的基本语法如下：；

```java
alter table_name ADD [UNIQUE | FULLTEXT | SPATIAL] [INDEX | KEY]
[index_name] (col_name[length],...) [ASC | DESC]
```

**2、** 使用createindex创建索引；

create index语句可以在已经存在的表上添加索引，在MySQL中，createindex被映射到一个alert table语句上，基本语法结构为：

```java
CREATE [UNIQUE | FULLTEXT | SPATIAL] INDEX index_name
ON table_name (col_name[length],...) [ASC | DESC]
```

**3. 删除索引**

**1、** 使用altertable删除索引；

alter table删除索引的基本语法格式如下：

```java
alter table table_name drop index index_name;
```

**2、** 使用DROPINDEX语句删除索引；

`drop index`删除索引的基本语法格式如下：

```java
drop index index_name on table_name;
```
