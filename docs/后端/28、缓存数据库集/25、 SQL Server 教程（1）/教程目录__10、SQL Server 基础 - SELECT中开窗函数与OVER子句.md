# 10、SQL Server 基础 - SELECT中开窗函数与OVER子句
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/1/10.html
- 分类：缓存数据库
- 分组：教程目录
一组行称为一个窗口，**开窗函数**是可以用于分区计算的函数，分为**聚合函数**和**排名函数**，分别可以放在OVER子句前以对组内的数据进行编号和运算。

注：本节”窗”就是指”分区”。

## 聚合函数与OVER子句

聚合函数是对一组值执行计算并返回单一的值的函数。如SUM()、AVG()、MIN()、MAX()。

```java
SELECT 列名表,
    聚合函数(参数列名) OVER(PARTITION BY 分区依据列) AS '生成列名',
    聚合函数(参数列名) OVER(PARTITION BY 分区依据列) AS '生成列名',
    ...
    聚合函数(参数列名) OVER(PARTITION BY 分区依据列) AS '生成列名'
FROM 表名
```

例如：

```java
select Cno,CName,Semester,Credit,
    SUM(Credit) over(partition by Semester) as '学期总学分',
    AVG(Credit) over(partition by Semester) as '平均学分',
    MIN(Credit) over(partition by Semester) as '最小学分',
    MAX(Credit) over(partition by Semester) as '最大学分'
from Course
```

表示从Course表中得到课程编号、课程名、所在学期、学分以外，还根据所在学期Semester对记录进行了分区，然后得到了每个课程所在学期的总学分、平均学分、最小学分、最大学分。

可以看到在本例中，同一个窗的聚合函数结果相同。

又如：

```java
select OrderID 订单号,ProductID 产品号,Num 订购数量,
    SUM(Num) over(partition by ProductID) AS '该类产品共订了',
    CAST(
        1.0*Num/
        (SUM(Num) over(partition by ProductID))
        *100
        as decimal(5,2)
        ) AS '所占百分比'
from OrderTab
```

表示从OrderTab表中得到并重命名为订单号、产品号、订购数量以外，还根据产品号ProductID分区得到了每类产品订购总件数，还用每个记录的产品件数转换为浮点数并除以所在分区的订购总件数再乘以100并使用CAST函数强制转换成5位2小数的定点小数再作显示。

## 排名函数与OVER子句

排名函数是为分区中的每一行返回一个排名值的函数。SQL Server中的排名函数有：RANK()、DENSE_RANK()、NTILE、ROW_NUMBER。

**①RANK()、DENSE_RANK()、ROW_NUMBER函数**

这三个函数功能类似，都是对分区后的窗按一个排序依据列内排序，并生成新的列，它们的语法也一致：

```java
SELECT 列名表,
    函数名() OVER(PARTITION BY 分区依据列
            ORDER BY 排序依据列 [DESC]) AS '生成列名',
    函数名() OVER(PARTITION BY 分区依据列
            ORDER BY 排序依据列 [DESC]) AS '生成列名',
    ...
    函数名() OVER(PARTITION BY 分区依据列
            ORDER BY 排序依据列 [DESC]) AS '生成列名'
FROM 表名
[ORDER BY 有时需以分区依据列做外排 [DESC]]
```

例如：

```java
select OrderID 订单号,ProductID 产品号,Num 订购数量,
    RANK() over(partition by ProductID 
                order by Num desc) AS 'RANK排名列',
    DENSE_RANK() over(partition by ProductID 
                order by Num desc) AS 'DENSE_RANK排名列',
    ROW_NUMBER() over(partition by ProductID 
                order by Num desc) AS 'ROW_NUMBER排名列'
from OrderTab
```

表示新增以产品号分区后，区内以订购数量逆排得到了排名列。

可以看到，这三个函数都是在窗内作排名，区别仅在于对于重复值赋予的排名号的方案不同：RANK保证了相同值的排名号一致且挤压后续排名号；DENSE_RANK保证了相同值的排名号一致且不挤压后续排名号；ROW_NUMBER不分配相同的排名号。

**②NTILE()函数**

尝试等分成几块，并生成新的列：

```java
SELECT 列名表,
    NTILE(划分块数) OVER([PARTITION BY 如果需分窗分别处理此处应指定]
            ORDER BY 排序依据列 [DESC]) AS '生成列名'
FROM 表名
[ORDER BY 有时可以根据需求做外排 [DESC]]
```

这个函数用得很少，它会尽量尝试等分，注意不使用OVER内的PATTERN BY时，它就与开窗无关了，仅仅是做整体性的尝试等分。

例如：

```java
select OrderID 订单号,ProductID 产品号,Num 订购数量,
    NTILE(4) over(order by Num desc) AS 'NTILE划分列'
from OrderTab
```

这就不能称之为开窗，只能说是对整个表尝试做了四等分。
