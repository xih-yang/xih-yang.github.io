# 08、Hive 实战 - Hive查询之Join语句
- 来源：https://ddkk.com/zhuanlan/bigdata/hive/1/8.html
- 分类：大数据框架
- 分组：教程目录
## 1. 等值Join

Hive支持通常的SQL JOIN语句。

例：根据员工表和部门表中的部门编号相等，查询员工编号、员工名称和部门名称

```java
hive (default)> select e.empno, e.ename, d.deptno, d.dname from emp e join dept d on e.deptno = d.deptno;
```

## 2. 表的别名

好处：

（1）使用别名可以简化查询。

（2）使用表名前缀可以提高执行效率。

例：合并员工表和部门表

```java
hive (default)> select e.empno, e.ename, d.deptno from emp e join dept d on e.deptno = d.deptno;
```

## 3. 内连接

内连接：只有进行连接的两个表中都存在与连接条件相匹配的数据才会被保留下来。

```java
hive (default)> select e.empno, e.ename, d.deptno from emp e join dept d on e.deptno = d.deptno;
```

## 4. 右外连接

右外连接：JOIN操作符右边表中符合WHERE子句的所有记录将会被返回。

```java
hive (default)> select e.empno, e.ename, d.deptno from emp e right join dept d on e.deptno = d.deptno;
```

## 5. 左外连接

左外连接：JOIN操作符左边表中符合WHERE子句的所有记录将会被返回。

```java
hive (default)> select e.empno, e.ename, d.deptno from emp e left join dept d on e.deptno = d.deptno;
```

## 6. 满外连接

满外连接：将会返回所有表中符合WHERE语句条件的所有记录。如果任一表的指定字段没有符合条件的值的话，那么就使用NULL值替代。

```java
hive (default)> select e.empno, e.ename, d.deptno from emp e full join dept d on e.deptno = d.deptno;
```

## 7. 多表连接

注意：连接 n个表，至少需要n-1个连接条件。例如：连接三个表，至少需要两个连接条件。

### 7.1. 创建位置表

```java
create table if not exists location(
    loc int,
    loc_name string
)
row format delimited fields terminated by '\t';
```

### 7.2. 导入数据

```java
1700	Beijing
1800	London
1900	Tokyo
```

```java
hive (default)> load data local inpath '/opt/module/datas/location.txt' into table location;
```

### 7.3. 多表连接查询

```java
SELECT 
    e.ename
    , d.dname
    , l.loc_name
FROM   emp as e 
JOIN   dept as d
ON     d.deptno = e.deptno 
JOIN   location as l
ON     d.loc = l.loc
;
```

大多数情况下，Hive会对每对JOIN连接对象启动一个MapReduce任务。本例中会首先启动一个MapReduce job对表e和表d进行连接操作，然后会再启动一个MapReduce job将第一个MapReduce job的输出和表l;进行连接操作。

注意：为什么不是表d和表l先进行连接操作呢？这是因为Hive总是按照从左到右的顺序执行的。

优化：当对3个或者更多表进行join连接时，如果每个on子句都使用相同的连接键的话，那么只会产生一个MapReduce job。

## 8. 笛卡尔积

笛卡尔集会在下面条件下产生：

```java
（1）省略连接条件
（2）连接条件无效
（3）所有表中的所有行互相连接
```

例：

```java
hive (default)> select empno, dname from emp, dept;
```
