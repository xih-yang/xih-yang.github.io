# 29、Hive 教程 - FROM_UNIXTIME() 和 UNIX_TIMESTAMP（）时间戳函数用法
- 来源：https://ddkk.com/zhuanlan/bigdata/hive/2/29.html
- 分类：大数据框架
- 分组：教程目录
今天用hive 进行 ETL时，需要对时间戳进行格式化， 其中还需要用到正则表达式及一些时间函数，在这里简单总结一下unix_timestamp、from_unixtime的用法，仅供参考。

先看下这段 HQL ：

```java
CREATE TEMPORARY TABLE user_event
STORED AS ORC AS
    SELECT
        t.user_id,
        t.event_id,
        t.invited AS user_invited,
        CASE WHEN t.time_stamp regexp '^\\d{4}-\\d{2}-\\d{2}\\s\\d{2}:\\d{2}:\\d{2}.*' AND e.start_time regexp '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z' THEN datediff(from_unixtime(unix_timestamp(CONCAT(SUBSTR(e.start_time, 1, 10), ' ', SUBSTR(e.start_time, 12, 8)), 'yyyy-MM-dd hh:mm:ss')), from_unixtime(unix_timestamp(CONCAT(SUBSTR(t.time_stamp, 1, 10), ' ', SUBSTR(t.time_stamp, 12, 8)), 'yyyy-MM-dd hh:mm:ss'))) ELSE NULL END AS invite_ahead_days,
        t.interested AS user_interested,
        e.user_id AS event_creator,
        CASE WHEN e.start_time regexp '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z' THEN datediff(from_unixtime(unix_timestamp(CONCAT(SUBSTR(e.start_time, 1, 10), ' ', SUBSTR(e.start_time, 12, 8)), 'yyyy-MM-dd hh:mm:ss')), FROM_UNIXTIME(UNIX_TIMESTAMP())) ELSE NULL END AS start_ahead_days,
        CASE WHEN e.start_time regexp '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z' THEN MONTH(from_unixtime(unix_timestamp(CONCAT(SUBSTR(e.start_time, 1, 10), ' ', SUBSTR(e.start_time, 12, 8)), 'yyyy-MM-dd HH:mm:ss'))) ELSE NULL END AS event_start_month,
        CASE WHEN e.start_time regexp '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z' THEN from_unixtime(unix_timestamp(CONCAT(SUBSTR(e.start_time, 1, 10), ' ', SUBSTR(e.start_time, 12, 8)), 'yyyy-MM-dd hh:mm:ss'), 'u') ELSE NULL END AS event_start_dayofweek,
        CASE WHEN e.start_time regexp '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z' THEN HOUR(from_unixtime(unix_timestamp(CONCAT(SUBSTR(e.start_time, 1, 10), ' ', SUBSTR(e.start_time, 12, 8)), 'yyyy-MM-dd HH:mm:ss'))) ELSE NULL END AS event_start_hour,
        e.city as event_city,
        e.state as event_state,
        e.country as event_country,
        e.latitude,
        e.longitude
    FROM train t INNER JOIN events e ON t.event_id = e.event_id;
```

其中train 表中，time-stamp 数据格式如下：

```java
2012-10-02 12:50:54.041000+00:00
```

events 表中，start-time 数据格式如下：

```java
2012-10-04T19:00:00.0032
```

**一、unix_timestamp函数用法**

**1、** **unix_timestamp()**得到当前时间戳；

若无参数调用，则返回一个 Unix timestamp (‘1970-01-01 00:00:00’ GMT 之后的秒数) 作为无符号整数，得到当前时间戳
2、** 如果参数date满足yyyy-MM-ddHH:mm:ss形式，则可以直接unix_timestamp(stringdate)**得到参数对应的时间戳；

**3、** 如果参数date满足yyyy-MM-ddHH:mm:ss形式，则我们需要指定date的形式，在进行转换；

unix_timestamp(‘2009-03-20’, ‘yyyy-MM-dd’)=1237532400

**二、from_unixtime函数用法**

语法：**from_unixtime(t1,’yyyy-MM-dd HH:mm:ss’)**

其中t1是10位的时间戳值，即1970-1-1至今的秒，而13位的所谓毫秒的是不可以的。

对于13位时间戳，需要截取，然后转换成bigint类型，因为from_unixtime类第一个参数只接受bigint类型。例如：

```java
select from_unixtime(cast(substring(tistmp,1,10) as bigint),’yyyy-MM-dd HH’) 
tim ,count(*) cn from ttengine_hour_data where …
```

**FROM_UNIXTIME(unix_timestamp,format)**

参数`unix_timestamp`：时间戳，可以用数据库里的存储时间数据的字段

参数`format`：要转化的格式 比如 `"%Y-%m-%d"` 这样格式化之后的时间就是 `2017-11-30`

可以有的形式：

```java
%M 月名字(January～December)
%W 星期名字(Sunday～Saturday)
%D 有英语前缀的月份的日期(1st, 2nd, 3rd, 等等。）
%Y 年, 数字, 4 位
%y 年, 数字, 2 位
%a 缩写的星期名字(Sun～Sat)
%d 月份中的天数, 数字(00～31)
%e 月份中的天数, 数字(0～31)
%m 月, 数字(01～12)
%c 月, 数字(1～12)
%b 缩写的月份名字(Jan～Dec)
%j 一年中的天数(001～366)
%H 小时(00～23)
%k 小时(0～23)
%h 小时(01～12)
%I 小时(01～12)
%l 小时(1～12)
%i 分钟, 数字(00～59)
%r 时间,12 小时(hh:mm:ss [AP]M)
%T 时间,24 小时(hh:mm:ss)
%S 秒(00～59)
%s 秒(00～59)
%p AM或PM
%w 一个星期中的天数(0=Sunday ～6=Saturday ）
%U 星期(0～52), 这里星期天是星期的第一天
%u 星期(0～52), 这里星期一是星期的第一天
%% 一个文字%
```

**三、总结**

两个函数可以结合使用，通过`from_unixtime(unix_timestamp(date_created),'yyyy-MM-dd HH:mm:ss')`来规范时间的格式。
