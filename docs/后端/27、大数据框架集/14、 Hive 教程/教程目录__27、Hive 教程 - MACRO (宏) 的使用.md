# 27、Hive 教程 - MACRO (宏) 的使用
- 来源：https://ddkk.com/zhuanlan/bigdata/hive/2/27.html
- 分类：大数据框架
- 分组：教程目录
项目中用到了宏，实现的功能是计算一个值在其最小值和最大值之间的百分比，如下：

```java
-- macro to calculate the percentage a value between its min & max values
CREATE TEMPORARY MACRO percentageValue(value double, min_value double, max_value double)
  CASE
    WHEN value IS NULL OR min_value = max_value THEN 0.5
    ELSE (value - min_value) / (max_value - min_value)
  END;
```

其实在编写HQL的过程中，我们会有很多逻辑需要反复使用。这时我们可以使用宏对这段逻辑进行提炼，起到优化开发效率、提升程序可读性的效果（尤其是括号嵌套很多层、case-when嵌套很多层的时候）。举个例子：

```java
create temporary macro sayhello (x string) concat('hello,',x,'!');
select sayhello('程序员'); --输出：hello,程序员!
```

在上面的的代码中，首先我们定义了一个名为sayhello的宏，输入参数为一个字符串x，输出为对x的拼接。如果之后还需要向HR问好，只要输入sayhello(‘HR’)即可。

显而易见，我们可以把宏当做一个自定义“函数”，其开发过程与UDF相比更加简捷。

下面分享几个我在工作中常用的宏：

一、有关空值的处理

**1、** 空串转NULL；

```java
create temporary macro empty2null (x string) if(trim(x) = '', null, x);
```

使用场景：在使用coalesce或nvl时，如果前一个参数为空串，则无法取到后面的参数。若按照如下的写法

```java
nvl(empty2null(a),empty2null(b))
```

则在a为空串时返回b的值，如果b为空串或NULL，则返回NULL。

在这个例子中，我们不只节省了编写代码的时间，而且不用再耗费精力去调研a或b是否有可能是空串了，只要无脑按这种方式编写代码即可。类似地，对于数值型字段，我们可以编写0转NULL的宏。

**2、** NULL转空串；

```java
create temporary macro null2empty (x string) if(x is null, '', x);
```

使用场景1：当使用concat拼接两个字段时，只要一个为NULL，则输出也为NULL。这时如果我们想让输出不为NULL，则可以将NULL转为空串。同样地，再也不用耗费精力去调研两个字段是否有可能是NULL了。

使用场景2：统一输出，如case-when众多分支的输出既含NULL又含空串。

**3、** 判断NULL和空串；

```java
create temporary macro nn(x string) nvl(trim(x),'') = '';
```

如果x为NULL或空串，则返回true。个人觉得该逻辑还是非常常用的，所以就写了这样一个宏，命名简单，连敲两下n即可。

进一步：

```java
create temporary macro nn2rand (x string) case when nn(x) then concat('hive',rand()) else x end;
```

顾名思义，nn2rand，把NULL和空串转为随机串。当遇到由“key=NULL或空串”引起的数据倾斜问题时，应把key转化为随机字符串，使得这部分记录均匀地分配到各个reduce中。

二、有关时间的计算

**1、** 上个月第一天；

```java
create temporary macro firstDayLastMonth (x string) trunc(add_months(x,-1),'MM');
```

传入CURRENT_DATE即可。之所以写这样一个宏，是因为使用firstDayLastMonth这样的命名能让程序更加易读。

**2、** 上个月最后一天；

```java
create temporary macro lastDayLastMonth (x string) last_day(add_months(x,-1));
```

传入CURRENT_DATE即可。理由同上。

**3、** 时间差；

```java
create temporary macro hourdiff (x string, y string) hour(x)-hour(y)+(datediff(x,y))*24;
```

返回两个时间点相差几小时

**4、** 日期处理；

```java
create temporary macro properdt (dt string) concat_ws('-',split(dt,'/')[0],lpad(split(dt,'/')[1],2,'0'),lpad(split(dt,'/')[2],2,'0'));
```

它的功能是将2019/1/1变为2019-01-01。其中2019/1/1为excel常用格式，而2019-01-01为hive表中常用格式。若需要将本地文件上传至hdfs并在hive中查询，可以考虑使用。

**5、** 时间比较；

```java
create temporary macro earliest (x string, y string) least(empty2null(x),empty2null(y));
```

令time1和time2为两种时间字段，均为string类型，用空串表示缺失。现在的需求是，选出两个时间点较早的那一个。如果直接选择最小值，那么当time1为空串时一定输出空串（因为空串比所有字符串都小），但若此时time2不为空串，明显应该取time2作为结果。这时可以使用上面的宏，将空串转为NULL后再取最小值。

三、数学计算

```java
create temporary macro halfceil (x decimal) 
case 
    when x = floor(x) then x
    when x - floor(x) <= 0.5 then floor(x) + 0.5
    else ceil(x)
end;
```

功能：按0.5向上取整。例如1.2变成1.5，1.7变成2.0，而1.5、2.0保持不变。有了宏，再长的数学公式都可以单行实现。
