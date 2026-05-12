# 05、Oracle 教程 PL/SQL 基础 - 记录类型
- 来源：https://ddkk.com/zhuanlan/db/oracle/4/5.html
- 分类：缓存数据库
- 分组：教程目录
记录类型变量只能保存一行数据，如果SELECT语句返回多行就会错。

**1、****基于表的记录类型**：用表名加%ROWTYPE属性的方法可以声明一个记录类型，该记录类型的每个字段都和表中的一列相互对应并且语句相同的名字：one_bookbook%ROWTYPE；

**2、****基于游标的记录类型**：可以对显示声明的游标或者游标变量加上%ROWTYPE的方法声明一个基于游标的记录类型，这个记录类型中的每一个字段都对应着游标select语句中的一列或者别名表达式；

**3、****自定义记录类型**：用TYPE...RECORD语句也可以定义记录类型，用这种方式记录的每个字段都要在TYPE语句中明确的定义（包括字段名和数据类型），自定义记录类型中的字段甚至可以是另一个记录类型；

## 自定义记录类型语法

```java
CREATE OR REPLACE TYPE type_name IS RECORD(
    field_name1 datatype1 [ [ NOT NULL ] := | DEFAULT default_value ]，
    ...
);
```

如果是要单独定义一个记录类型，那么最好用CREATE OR REPLACE；如果是在过程或者函数中定义的，就不需要使用CREATE OR REPLACE。

这里的field_nameN是记录类型中第N个字段的名称，datatypeN是第N个字段的数据类型。记录类型的字段的数据类型可以是：

- 硬编码的标量数据类型（VARCHAR2、NUMBER等）；
- 自定义的SUBTYPE子类型；
- 用%TYPE或者%ROWTYPE属性声明的锚类型；
- PL/SQL的集合类型，记录中的字段可以是一个列表甚至是一个集合；
- REF CURSOR，该字段包含了一个游标变量；

一旦创建了自定义记录类型，就可以**声明记录**了：

```java
recode_name record_type；
```

其中record_type就是通过TYPE...RECORD语句定义的。

同样，记录类型也可以作为参数进行传递。

如果需要**访问记录中的一个字段**（或者是读取或者是改变字段的值），必须使用圆点法，就像要表示指定的数据库表中的一列那样：

```java
[ [ schema_name. ] package_name. ] record_name.field_name；
```

如果记录不是在当前包，则需要提供包名；如果不属于代码编译所在的模式，还需要提供模式名；

**如果要改变某个字段的值**，可以用:=来重新赋值：test.age := 12;

**向表中插入数据**，可以：

```java
INSERT INTO 表名（字段...）VALUES 记录名；这里的记录必须和表对应；
```

**注意：**

- 不能使用IS NULL语法来判断一个记录的所有字段都是NULL。相反，必须使用每个字段使用IS NULL操作符；
- 不能对两个记录做比较——例如：不能比较记录是相等还是不等，或者一个记录是比另一个记录大或者小，只能每个字段依次比较。
- 在Oracle9i数据库R2版本之前，不能向数据库表插入一个记录类型（之后的版本可以）。只能把记录的每一个字段传给每一列。
