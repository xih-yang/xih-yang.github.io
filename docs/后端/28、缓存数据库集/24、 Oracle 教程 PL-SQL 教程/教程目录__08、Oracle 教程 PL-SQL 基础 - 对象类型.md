# 08、Oracle 教程 PL/SQL 基础 - 对象类型
- 来源：https://ddkk.com/zhuanlan/db/oracle/4/8.html
- 分类：缓存数据库
- 分组：教程目录
**对象类型**：封装了数据结构和用于操纵这些数据结构的过程和函数。分两部分组成：

**对象类型头**：用于定义对象的公用属性和方法；

- 属性：最少要包含一个属性，最多包含1000个属性。定义时必须提供属性名和数据类型，但不能指定默认值和not null。并且不能包括long、long raw、rowid、urowid和PL/SQL特有类型(boolean\%type\%rowtype\ref curdor等)；
- 可以包含也可以不包含方法，可以定义构造方法、member方法、static方法、map方法和order方法。

**对象类型体**：用于实现对象类型头所定义的公用方法。（如果对象类型头中没有方法，那么就不需要对象类型体）；

方法

作用

说明

构造方法

用于初始化对象并返回对象实例

与对象类型同名的函数，默认的构造方法参数是对象类型的所有属性。（9i前只能使用系统默认的构造方法、9i后可自定义构造函数，自定义必须使用constructor function关键字）

member方法

用于访问对象实例的数据

当使用member方法时，可以使用内置参数self访问当前对象实例。

当定义member方法时，无论是否定义self参数，它都会被作为第一个参数传递给member方法。

但如果要定义参数self，那么其类型必须要使用当前对象类型。member方法只能由对象实例调用，而不能由对象类型调用。

static方法

用于访问对象类型

可以在对象类型上执行全局操作，而不需要访问特定对象实例的数据，因此static方法引用self参数。

static方法只能由对象类型调用，不能由对象实例调用(和member相反)

map方法

可以在对多个对象实例之间排序；

将对象实例映射成标量数值来比较

可以定义map方法，但只能有一个，与order互斥

order方法

只能比较2个实例的大小

定义对象类型时最多只能定义一个order方法，而且map和order方法不能同时定义

对象表

对象表是指至少包含一个对象类型列的表。分为行对象表和列对象表。

行对象表是指直接基于对象类型所建立的表；列对象表则是只包含一个或多个列的对象表。

REF数据类型

指向行对象的逻辑指针

是Oracle的一种内置数据类型。建表时通过使用REF引用行对象，可以使不同表共享相同对象。

例如：create table department(dno number(2),dname varchar2(10),emp ref employee_type)

对象类型头：

```java
create or replace type type_name as object (
    v_name1 datatype [ ,v_name2 datatype,... ],
    [ member | static method1 spec, member | static method2 spec , ... ]
);
```

- type_name是对象类型的名称；
- v_name是属性名称；
- datatype是属性数据类型；
- method是方法的名称；

对象类型体：

```java
create or replace type body type_name as
member | static method1 body;
member | static method1 body;...
```

- type_name是对象类型的名称；
- method是方法的名称；
- member | static 见上表格
