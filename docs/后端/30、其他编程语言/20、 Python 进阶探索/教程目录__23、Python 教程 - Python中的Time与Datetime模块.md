# 23、Python 教程 - Python中的Time与Datetime模块
- 来源：https://ddkk.com/zhuanlan/other/python/3/23.html
- 分类：Python 进阶探索
- 分组：教程目录
## 一、 Python中的时间表示的几种形式

时间表示的几种形式

- 时间戳
- 字符串时间
- 元组类型的时间

时间模块的使用也需要导入：

```java
 import time
```

**1时间戳类型的时间**

```java
print(time.time())
```

返回值表示：1970纪元后经过的浮点秒数

输出结果为：

```java
1577779542.3992693
```

**2字符串时间**

```java
print(time.ctime())
```

输出结果为：

```java
Tue Dec 31 16:05:42 2019
```

**3元组时间**

```java
print(time.localtime())
info = time.localtime()		#同时也可输出元组内的元素
print(info)
print(info.tm_year)
print(info.tm_mon)
```

输出结果为：

```java
time.struct_time(tm_year=2019, tm_mon=12, tm_mday=31, tm_hour=16, tm_min=5, tm_sec=42, tm_wday=1, tm_yday=365, tm_isdst=0)
time.struct_time(tm_year=2019, tm_mon=12, tm_mday=31, tm_hour=16, tm_min=5, tm_sec=42, tm_wday=1, tm_yday=365, tm_isdst=0)
2019
12
```

## 二、时间的几种形式之间的转换

**1把元组时间转换为时间戳**

```java
tuple_time = time.localtime()
print(tuple_time)
print(time.mktime(tuple_time))		#元组时间转换为时间戳
```

输出结果为：

```java
time.struct_time(tm_year=2019, tm_mon=12, tm_mday=31, tm_hour=16, tm_min=42, tm_sec=3, tm_wday=1, tm_yday=365, tm_isdst=0)
1577781723.0
```

**2把元组时间转化为字符串时间**

元组时间转化为字符串时间后可以按需要的格式输出

```java
print(time.strftime('%d-%m',tuple_time))
print(time.strftime('%Y/%m/%d',tuple_time))
print(time.strftime('%T',tuple_time))		#时间
print(time.strftime('%F',tuple_time))		#日期
```

输出结果为：

```java
31-12
2019/12/31
16:42:03
2019-12-31
```

**3将时间戳类型的时间转换为字符串时间**

```java
pwd_time = os.path.getctime('img')
print(pwd_time)
print(time.ctime(pwd_time))		#时间戳类型的时间转换为字符串时间
```

输出结果为：

```java
1577775668.2566676
Tue Dec 31 15:01:08 2019
```

**4将时间戳类型转换为元组类型的时间**

```java
print(time.localtime(pwd_time))
```

输出结果为：

```java
time.struct_time(tm_year=2019, tm_mon=12, tm_mday=31, tm_hour=15, tm_min=1, tm_sec=8, tm_wday=1, tm_yday=365, tm_isdst=0)
```

**5将元组时间转化为时间戳**

```java
tuple_time = time.localtime()
print(time.mktime(tuple_time))
```

输出结果为：

```java
1577781872.0
```

## 三、datetime模块

使用该模块同样需要导入：

```java
from datetime import date
from datetime import datetime
from datetime import timedelta
```

**datetime模块中包含如下类：**

类名
功能说明

date
日期对象,常用的属性有year, month, day

time
时间对象

datetime
日期时间对象,常用的属性有hour, minute, second, microsecond

datetime_CAPI
日期时间对象C语言接口

timedelta
时间间隔，即两个时间点之间的长度

tzinfo
时区信息对象

## 四、datetime模块的常见用法

**1输出当前时间**

```java
print(date.today())
print(datetime.now())
```

输出结果为：

```java
2019-12-31
2019-12-31 16:53:48.034230
```

**2计算若干天前的时间和若干天后的时间**

```java
d = date.today()
delta = timedelta(days=3)
print(d + delta)		#三天之后
print(d - delta)		#三天之前
```

输出结果为：

```java
2020-01-03
2019-12-28
```

**2计算若干个小时前的时间和若干个小时后的时间**

```java
now_hour = datetime.now()
delta = timedelta(hours=2)
print(now_hour - delta)
print(now_hour + delta)
```

输出结果为：

```java
2019-12-31 14:53:48.034230
2019-12-31 18:53:48.034230
```

**3返回两个时间 想计算两个时间之间的时间差**

```java
now_time = datetime.now()
print(now_time)
pwd_time = os.path.getmtime('img')
print(pwd_time)
pwd_time_obj = datetime.fromtimestamp(pwd_time)
print(pwd_time_obj)
dalta = now_time - pwd_time_obj
print(delta)
```

输出结果为：

```java
2019-12-31 16:53:48.034230
1577778858.6775477
2019-12-31 15:54:18.677548
2:00:00
```

**4将时间戳转化为datatime类型的时间**

使用`datetime.fromtimestamp()`函数可以将时间戳转化为datatime类型的时间

```java
boot_time_obj = datetime.fromtimestamp(boot_time)
```
