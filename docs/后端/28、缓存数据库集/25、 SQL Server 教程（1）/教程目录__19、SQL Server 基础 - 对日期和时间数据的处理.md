# 19、SQL Server 基础 - 对日期和时间数据的处理
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/1/19.html
- 分类：缓存数据库
- 分组：教程目录
## 数据类型

在SQL Server 2008以前只有前两种类型，另外后三种括号里的数字表示精度(默认是最大的7)。这些数据类型的推荐格式也不同：

datetimeoffset最后那部分表示时区。

## 字符串文字

如执行：

```java
USE MyDB;
SELECT *
FROM dbo.TimeTest
WHERE MyD='20171006';
```

在作这样的比较时，实际是把字符串转换成了对应的数据类型再做比较的，相当于：

```java
USE MyDB;
SELECT *
FROM dbo.TimeTest
WHERE MyD=CAST('20171006' AS DATE);
```

只不过这样的转换是在幕后进行的。

## LANGUAGE和DATEFORMAT

LANGUAGE是会话中的默认语言，DATEFORMAT是字符串转日期或时间时的解释方案。这两个设置都会影响如何对输入的**语言相关的格式的**字符串进行解释，得到日期和时间。

```java
SELECT CAST('06/10/2017' AS DATETIME);
SET LANGUAGE us_english;
SELECT CAST('06/10/2017' AS DATETIME);
SET LANGUAGE British;
SELECT CAST('06/10/2017' AS DATETIME);
```

## 样式号(CONVERT采用)

对于语言相关的格式的字符串，可以用样式号去决定对它作何种解释，而不受前面那两个设置的影响。

```java
SELECT CONVERT(DATETIME,'06/10/2017',101);  --样式号101
SELECT CONVERT(DATETIME,'06/10/2017',103);  --样式号103
```

## 语言无关的格式

书上有张表，就不记表了，这里总结几点：

①’hh:mm:ss:nnn…’对TIME语言无关，对其它类型要看前面年月日的格式。

②’YYYYMMDD’语言无关。

③’YYYY-MM-DD’(后面可能带’hh:mm:ss:nnn…’)转换成DATETIME、SMALLDATETIME(这就是SS2008以前支持的那两种)时语言相关；转换成DATE、DATETIME2、DATETIMEOFFSET时语言无关。

```java
SET LANGUAGE us_english;
SELECT CAST('20171006' AS DATETIME);
SET LANGUAGE British;
SELECT CAST('20171006' AS DATETIME);
```

## 单独使用日期和时间

对于DATETIME类型，如果只使用日期部分，那么时间部分将存储为午夜，故可以这样匹配：

```java
USE MyDB;
SELECT *
FROM dbo.TimeTest
WHERE MyDT='19970909';
```

但是使用了时间部分的话，就不能只指明日期了，可以使用范围过滤：

```java
USE MyDB;
SELECT *
FROM dbo.TimeTest
WHERE MyDT>='20171006'
    AND MyDT<'20171007';
```

## 过滤日期范围

书上说**“当对过滤条件中的列应用了一定的处理后，就不能以有效的方式来使用索引了”**，这涉及更高级的知识，不深究，总之即便有YEAR()、MONTH()这样的函数，也不应该这样做：

```java
USE MyDB;
SELECT *
FROM dbo.TimeTest
WHERE YEAR(MyDT)=2017 AND MONTH(MyDT)=10;
```

而应该这样做(虽然至此结果是一样的)：

```java
USE MyDB;
SELECT *
FROM dbo.TimeTest
WHERE MyDT>='20171001' AND MyDT<'20171101';
```

## 日期和时间函数

### 返回当前日期和时间

函数
返回类型
描述

GETDATE()
DATETIME
当前日期和时间

CURRENT_TIMESTAMP
DATETIME
ANSI SQL的GETDATE()

GETUTCDATE()
DATETIME
以UTC格式表示的的GETDATE()

SYSDATETIME()
DATETIME2
当前日期和时间

SYSUTCDATETIME()
DATETIME2
以UTC格式表示的SYSDATETIME()

SYSDATETIMEOFFSET
DATETIMEOFFSET
当前日期和时间，包含时区偏移量

实验：

```java
SELECT
    GETDATE() AS 'GD',
    CURRENT_TIMESTAMP AS 'ANSI_GD',
    GETUTCDATE() AS 'UTC_GD',
    SYSDATETIME() AS 'GD2',
    SYSUTCDATETIME() AS 'UTC_GD2',
    SYSDATETIMEOFFSET() AS 'OFST_GD2';
```

如果要只返回日期或时间可以强制转换：

```java
SELECT
    CAST(SYSDATETIME() AS DATE) AS 'date',
    CAST(SYSDATETIME() AS TIME) AS 'time';
```

### CAST和CONVERT

这两个函数都用于转换值的数据类型。

```java
CAST(值 AS 新数据类型)
CONVERT(新数据类型,值[,样式号])
```

尽量使用CAST，因为它是ANSI标准SQL，而CONVERT不是。

### SWITCHOFFSET

按指定的时区对输入的DATETIMEOFFSET值(注意不是别的)进行调整。

```java
SELECT
    SYSDATETIMEOFFSET() AS '原来的',
    SWITCHOFFSET(SYSDATETIMEOFFSET(),'-05:00') AS '调整后';
```

### TODATETIMEOFFSET

为输入的日期和时间(可以是任何日期和时间类型)设置时区偏移量。

```java
SELECT TODATETIMEOFFSET(SYSDATETIME(),'-05:00');
```

注意和上一个的结果的区别！这个仅仅是设置了时区偏移量，最终表达的时间是变的(因为前面的年月日和时间没有变)。而前面那个函数是根据当前时间，用另一个时区来表达，时间是不变的(前面的年月日和时间随着时区改变)。

### DATEADD

将指定的日期或时间值的一部分增加指定的数量。

```java
SELECT DATEADD(MONTH,1,'19970909'); --加一个月
```

### DATEDIFF

返回两个日期或时间值之间指定单位的计数。

```java
SELECT DATEDIFF(DAY,'20170417','20171006') AS 'BYE';
```

### DATEPART

返回给定的日期或时间值的指定部分的数值。

```java
SELECT DATEPART(YEAR,'20080808') AS 'BEIJING';
```

YEAR()、MONTH()和DAY()函数都是这个函数的简略版本。

### DATENAME

返回给定的日期和时间值的指定部分的名称(依赖于语言)。

```java
SELECT DATENAME(MONTH,'20080808') AS 'Month';
```

### ISDATE

测试给定的字符串能否转换为日期和时间数据类型的值。

```java
SELECT
    ISDATE('20170228'),
    ISDATE('20170229'),
    ISDATE('20200229'); --闰年
```
