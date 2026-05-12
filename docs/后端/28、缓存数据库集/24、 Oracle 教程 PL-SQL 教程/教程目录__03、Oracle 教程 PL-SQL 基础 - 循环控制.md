# 03、Oracle 教程 PL/SQL 基础 - 循环控制
- 来源：https://ddkk.com/zhuanlan/db/oracle/4/3.html
- 分类：缓存数据库
- 分组：教程目录
**CONTINUE**和**EXIT**语句：他们都有两种形式：CONTINUE；和CONTINUE WHEN conditon；EXIT；和EXIT WHEN conditon；

这里：“exit；”可以直接用，执行了之后就退出循环；“exit when condition”：当condition为true时，退出循环。CONTINUE同理。

## 简单循环

依靠exit、exit when或者return来退出循环（或者抛出异常）。如果没有执行这行，则这个简单循环就变成了死循环。

```java
LOOP
    executable statement(s)
END LOOP;
```

## WHILE循环

每次循环，都会先判断condition是否为true。只有为true才会执行loop。因此，循环体不一定会被执行。

```java
WHILE condition
LOOP
    executable statement(s)
END LOOP；
```

## 数值型FOR循环

loop_index是一个变量名，循环的时候，lowest_number会依次增加1到highest_number，而loop_index就是每次增加后的值，可以在循环体中使用loop_index。另外，条件的判断是lowest_number<=loop_index<=highest_number。如果加上了**REVERSE**关键字，则是从highest_number依次减1到lowest_number，不过lowest_number和highest_number的位置不能变，依然是小的在前面。提前退出循环，依然可以使用exit。

```java
FOR loop_index IN [REVERSE] lowest_number .. highest_number
LOOP
    executable statement(s)
END LOOP;
```

## 游标FOR循环

类似于通过select语句查出一系列记录，然后每个记录依次赋值给record，在循环体中就可以使用 record.列名 就可得到该记录的该列值。当select的所有记录都遍历了，循环结束（当然也可以使用exit提前结束）。通常情况下，都是在其他地方用select查出记录赋值给cursor_name变量，然后在这里用cursor_name。当然在这里直接写一个明确的select语句也是可以的。

```java
FOR record IN {cursor_name | (explicit SELECT statement)}
LOOP
    executable statement(s)
END LOOP;
```
