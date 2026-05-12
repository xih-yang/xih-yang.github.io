# 26、Hive 教程 - 函数 instr 的用法
- 来源：https://ddkk.com/zhuanlan/bigdata/hive/2/26.html
- 分类：大数据框架
- 分组：教程目录
在写宏的时候用到了 instr 函数，这里记一下：

```java
-- macro to calculate the distance of user location and event location
CREATE TEMPORARY MACRO locationSimilar(user_location string, event_city string, event_province string, event_country string)
  CASE
    WHEN instr(user_location, event_city) > 0 OR instr(user_location, event_province) > 0 OR instr(user_location, event_country) > 0 THEN 1 ELSE 0
  END;
```

`INSTR(C1,C2,I,J)` 在一个字符串中搜索指定的字符,返回发现指定的字符的位置;

```java
C1    被搜索的字符串
C2    希望搜索的字符串
I     搜索的开始位置,默认为1
J     出现的位置,默认为1
```

```java
select instr("abcde",'b');
```

结果是2，即在字符串“abcde”里面，字符串“b”出现在第2个位置。如果没有找到，则返回0；不可能返回负数。

```java
instr（str，substr） - 返回str中第一次出现substr的索引
```

**简单一句就是：instr函数返回字符串str中子字符串substr第一次出现的位置，其中第一字符的位置是1,如果 str不含substr返回0。**
