# 17、Oracle 教程 PL/SQL 基础 - 包
- 来源：https://ddkk.com/zhuanlan/db/oracle/4/17.html
- 分类：缓存数据库
- 分组：教程目录
包：就是把一组PL/SQL的代码元素组织在一个命名空间下。

包由两部分组成：**规范部分**（必须的，类似与java的接口），**包体部分**（可选的，类似于接口的实现）；

## 规范部分：

```java
PACKAGE favorites_pkg
AUTHID CURRENT_USER
IS /* or AS */
c_choolate CONSTANT PLS_INTEGET :=16; --定义常量；
TYPE codes_nt IS TABLE OF INTEGER; --用TYPE声明了一个嵌套的表类型；
my_favorites codes_nt; --根据之前那个类型声明一个嵌套的表变量；
TYPE fav_info_rct IS REF CURSOR RETURN favorites%ROWTYPE; --一个返回收藏夹信息的REF_CURSOR游标类型；
PROCEDURE show_favorites(list_in IN codes_nt); --声明一个过程；
FUNCTION most_popular RETURN fav_info_rct； --声明一个函数；
END favorites_pkg； --包的结束标签
```

规则：

可以声明差不多所有数据类型的元素，比如数字、异常、类型、集合。一般来说，应该避免在包的规范部分声明变量，不过声明常量总是安全的；

可以声明任何的数据结构，比如集合类型、记录类型或者REFCURSOR类型；

可以声明一个过程和函数，但是只能在包规范中包含程序的头部（关键字IS或者AS之前的内容，但是不能包括关键字）。头部必须用一个分号结尾；

可以在包规范中使用显示游标。有两种形式：1）可以把SQL语句作为游标声明的一部分；2）把查询藏在包体中，而在游标声明中只提供RETURN子句；

声明了一个过程或者函数，或者声明了一个没有查询语句的游标，就必须要提供一个包体来实现这些代码元素；

AUTHID子句，确定在引用包中的数据对象是应该根据包的属主（AUTHID DEFINER）来解析还是根据包的调用者（AUTHID CURRENT_USER）解析；这个不是必须的；

## 包体部分：

什么时候需要包体：

- 包规范中包含了一个带有RETURN子句的游标声明：需要在包体中指定SELECT语句；
- 包规范中包含了过程或者函数声明：需要在包体中实现这些模块的实现代码；
- 想通过包的初始化单元执行代码；

```java
PACKAGE BODY favorites_pkg
IS
g_most_popular PLS_INTEGER := c_strawberry; --一个私有变量
--函数的实现部分
FUNCTION most_popular RETURN fav_info_rct
IS
retval fav_info_rct;
null_cv fav_info_rct;
BEGIN
OPEN retval FOR
select * from favorites where code = g_most_popular;
RETURN retval;
EXCEPTION
WHEN NO_DATA_FOUND WHEN RETURN null_cv;
END most_popular;
--过程的实现部分
PROCEDURE show_favorites(list_in IN codes_nt) IS
BEGIN
FOR indx IN list_in.FIRST ... list_in.LAST
LOOP
DBMS_OUTPUT.PUT_LINE(list_in(indx));
END LOOP;
END show_favorites;
--初始化,注意无end结尾，可选
BEGIN
g_most_popular := c_chocolate;
END favorites_pkg;
```

规则：

- 包体中可以有声明单元、执行单元、异常处理单元；在声明单元中就包括了在包规范中定义的任何一个游标和程序的完整实现，也包括所有私有元素的定义（那些没有在包规范中列出来的元素）。只要有一个初始化单元，声明单元可以为空。
- 包的执行单元也叫做初始化单元；可选；
- 异常处理单元，处理初始化单元抛出的异常。只有定义了一个初始化单元时，才可以在包体的最后部分使用一个异常处理单元；
- 一个包体可以包括下面这些组合：只有一个声明单元、只有一个执行单元；同时有执行单元和异常处理单元；或者同时有声明单元、执行单元，以及异常处理单元；
- 不能在包体中使用AUTHID子句；
- 声明于包级别的数据结构的规则和约束同样适用于包体和包规范；

## 包的初始化：

会话第一次使用某个包时，数据库都会对包进行初始化，这个操作只会执行一次。

注意：如果初始化失败，那么第二次使用这个包的时候也不会再出现失败的异常了，这里相当于发生了一个不可重现的错误；
