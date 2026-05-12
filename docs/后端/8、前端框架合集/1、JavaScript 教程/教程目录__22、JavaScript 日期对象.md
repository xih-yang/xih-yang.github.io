# 22、JavaScript 日期对象
- 来源：https://ddkk.com/zhuanlan/qianduan/javascript/1/22.html
- 分类：前端框架
- 分组：教程目录
日期对象声明：

注：当声明日期对象并没有传入任何参数时，默认当前**系统**时间

**1、** 通过new；

```java
var timer1=new Date()
```

**1、** 当声明日期对象并**没有传入任何参数**时，默认当前**系统**时间；

MonMay 10 2021 11:58:40 GMT+0800 (中国标准时间)

星期几月 日 年 时:分:秒

GMT：格林尼治时间 格林尼治镇对应子午线，全球时间

**2、** 传入参数；

‘2000-01-01’

‘2000/01/01’

按照顺序（年，月，日，时，分，秒）

注：在国外月份是从0开始数的 也就是0-11

直接传入ms数 1s=1000ms (以1970为参照时间点去换算 linux创始人：托瓦兹 伟人呀)

**日期对象的方法：**

日期对象格式化方法：

日期对象.toDateString（）： 以特定的格式显示星期几、月、日、年;

日期对象.toTimeString() ：以特定的格式显示时、分、秒

日期对象.toLocalDateString()： 以特定地区格式显示星期几、月、日、年;

日期对象.toLocalTimeString() ：以特定地区的格式显示时、分、秒和时区

日期对象.toUTCString() ：以特定的格式显示完整的UTC日期

**日期对象方法**：

set/get既能获取又能赋值，get只能获取

set/getDate() 从Date对象中返回一个月中的某一天（1~31）

注：如果设置时间的天数超过30，他会直接往前进一到下个月

getDay() 从对象返回一周中的某一天（0~6）：可以通过年月日推出星期几。返回的是阿拉伯数字，在应用的时候经常需要转成中文（switch case）。

set/getMonth（）从Date对象中返回月份（0~11）

set/getFullYear() 从Date对象以四位数返回年份

set/getHours 返回Date对象的毫秒数（0~23)

set/getMinutes 返回Date对象的分钟（0~59)

set/getSeconds 返回Date对象的秒数（0~59

set/getMilliseconds 返回Date对象的毫秒数（0~59）

set/getTime（） 返回1970年1月1日至今的毫秒数

getTimezoneOffset() 返回本地时间与格林威治标准时间（GMT）的分钟差

Date.parse() 与get/setTime()类似

格式:Date.parse(日期对象)

功能：可以将日期对象转成毫秒数

**练习：**

获取两个日期之间相差的天数：规定传入日期格式

‘2000-01-01’、‘2000/01/01’
