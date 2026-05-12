# 78、SQL Server CONVERT() 函数
- 来源：https://ddkk.com/zhuanlan/db/sql/78.html
- 分类：缓存数据库
- 分组：教程目录
SQLServer CONVERT() 函数用于把一个日期转换为别的数据类型

从某些方面说，就是使用不同的格式显示 **日期/时间**

```sql
CONVERT( data_type(length) , expression , style )
```

参数
说明

data_type( length )
目标数据类型 ( 带有可选的长度 )

expression
需要转换的值

style
日期/时间的输出格式

### style 参数可选值

如果想要将一个 datetime 或 smalldatetime 转换为字符数据，那么可选的 style 值如下

值( 年 yy )
值( 年 yyyy )
输入/输出
标准

-
0 or 100
mon dd yyyy hh:miAM (or PM)
Default

1
101
mm/dd/yy
USA

2
102
yy.mm.dd
ANSI

3
103
dd/mm/yy
British/French

4
104
dd.mm.yy
German

5
105
dd-mm-yy
Italian

6
106
dd mon yy

7
107
Mon dd, yy

8
108
hh:mm:ss

-
9 or 109
mon dd yyyy hh:mi:ss:mmmAM (or PM)
Default+millisec

10
110
mm-dd-yy
USA

11
111
yy/mm/dd
Japan

12
112
yymmdd
ISO

-
13 or 113
dd mon yyyy hh:mi:ss:mmm (24h)

14
114
hh:mi:ss:mmm (24h)

-
20 or 120
yyyy-mm-dd hh:mi:ss (24h)

-
21 or 121
yyyy-mm-dd hh:mi:ss.mmm (24h)

-
126
yyyy-mm-ddThh:mi:ss.mmm (no spaces)
ISO8601

-
130
dd mon yyyy hh:mi:ss:mmmAM
Hijiri

-
131
dd/mm/yy hh:mi:ss:mmmAM
Hijiri

## 范例

我们先使用 GETDATE() 函数获得当前的日期/时间

然后用CONVERT() 函数将日期/时间显示为不同的格式

```sql
SELECT CONVERT(VARCHAR(19),GETDATE());
SELECT CONVERT(VARCHAR(10),GETDATE(),10);
SELECT CONVERT(VARCHAR(10),GETDATE(),110);
SELECT CONVERT(VARCHAR(11),GETDATE(),6);
SELECT CONVERT(VARCHAR(11),GETDATE(),106);
SELECT CONVERT(VARCHAR(24),GETDATE(),113);
```

显示结果如下

```sql
12 25 2017 1:51PM
12-25-17
12-25-2017
25 12 17
25 12 2017
12 25 2017 13:51:49:513 
```
