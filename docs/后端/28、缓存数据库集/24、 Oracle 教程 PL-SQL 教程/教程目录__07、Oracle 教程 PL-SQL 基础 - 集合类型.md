# 07、Oracle 教程 PL/SQL 基础 - 集合类型
- 来源：https://ddkk.com/zhuanlan/db/oracle/4/7.html
- 分类：缓存数据库
- 分组：教程目录
集合是一种类似于列表或者一维数组的数据结构；一个集合是由若干个元素（一大堆数据）组成的，集合中的每个元素位于列表中的一个固定索引处。有时候，集合中的一个元素叫做一行，对应的索引就叫做行号。

**同质元素**：集合中的每一个元素的数据类型都是相同的。

### 集合类型

- **关联数组**：是一个只能在PL/SQL环境使用的，一维的、没有边界的、稀疏的、由同质元素构成的集合类型；
- **嵌套表**：是一个一维的、没有边界的、由同质元素组成的集合类型；
- **VARRAY**：是一个一维的、由同质元素组成的集合类型，是非稀疏的。

属性

关联数组

嵌套表

VARRAY

纬度

一维

一维

一维

是否可用于SQL

不可用

可用

可用

是否可作为表中列的数据类型

不可用

可以；数据在“行外”保存的（一个单独的表）

可以；数据保存在“行内”（在同一个表中）

未初始化的状态

空（不能是NULL），元素是未定义

自动就是null的，元素的引用是非法的

自动就是null的，元素的引用是非法的

初始化

在申明时自动完成

通过构造函数，或者赋值，或者fetch操作完成

通过构造函数，或者赋值，或者fetch操作完成

在PL/SQL中元素的引用方式

BINARY_INTEGER以及子类型（-2147483647~2147483647）

VARCHAR2(Oracle 9i数据库R2版本或者更高版本)

1到2147483647间的正整数

是否稀疏

是

开始不是，进过删除后就是了

不是

是否有界

无界

可以扩展

有界

可以随时对任意一个元素赋值

可以

不可以，可以需要先用EXTEND进行扩展

不可以，可能需要执行EXTEND进行扩展，而且用EXTEND扩展时不能超出上边界

扩展的方法

给一个新下标指向的元素赋值

使用内置的EXTEND过程（或者TRIM进行压缩），没有预定义的最大值

EXTEND（或者TRIM），但是最大只能到声明的最大尺寸

可以比较相等与否

不可以

可以，要求是Oracle数据库10g或以后的版本

不可以

是否可以通过集合操作进行操作

不可以

可以，要求是Oracle数据10g或者以后的版本

不可以

存取数据石佛会保留顺序或者下标

N/A

不保留

保留

### 关联数组

```java
TYPE table_type_name IS TABLE OF datatype [ NOT NULL ] INDEX BY index_type;
```

- **table_type_name**：创建集合类型的名字；
- **datatype**：是集合中唯一一列的数据类型；可以是标量数据类型、%TYPE引用类型、ROWTYPE引用类型
- **NOT NULL**：如果指定了，那么表中的每一行都必须要有一个值；
- **index_type**：是用来组织集合内容索引的数据类型，其值可以为(它们都是数据类型)：有点像java中的map，而index_type就是map中的key。
- BINARY_INTEGER
- PLS_INTEGER
- POSITIVE
- NATURAL
- SIGNTYPE
- VARCHAR2(32767)
- table.column%TYPE
- cursor.column%TYPE
- package.variable%TYPE
- packge.subtype

## 使用创建

```java
variable_name table_type_name ;
```

- 声明嵌套表（数据库内）：

```java
CREATE [ OR REPLACE ] TYPE type_name AS | IS TABLE OF element_datatype [ NOT NULL ]；
```

- 声明嵌套表（PL/SQL代码内）：

```java
TYPE type_name IS TABLE OF element_datatype [ NOT NULL ]；
```

- 声明VARRAY（数据库内）：

```java
CREATE [ OR REPLACE ] TYPE type_name AS | IS TABLE OF element_datatype [ NOT NULL ];
```

- 声明VARRAY（PL/SQL内）：

```java
TYPE type_name IS VARRAY (max_elements) OF element_datatype [ NOT NULL ]；
```

- 删除一个类型：

```java
DROP TYPE type_name [ FORCE ]；
```

- **type_name**：以后在声明变量或者列时会用到的标识符；
- **element_datatype**：集合元素的数据类型。集合内所有元素都是一种类型的。如果结合的元素是对象，那么对象类型本身不能在带有一个集合属性。明确的不可用于集合的数据类型包括：BOOLEAN、NCHAR、NCLOB、NVARCHAR2、REF CURSOR、TABLE和VARRAY（非SQL数据类型）。
- **NOT NULL**：这种类型的变量不能有任何空元素。不过，集合本身可以是原子级的空（未初始化）；
- **max_elements**：VARRAY中元素的最大数量，这个值一旦声明就不能更改；
- **FORCE**：当要删除这个类型时，就算其他数据中还有这个类型的作用，也要强行删除这个类型；

## 声明集合变量

```java
collection_name collection_type [ := collection_type (...) ]；
```

- **collection_name**：是集合变量的名字；
- **collection_type**：它即代表着一个先前已经申明的集合类型的名字，同时也代表着（如果是嵌套表或者VARRAY的话）和该类型同名的构造函数；

构造函数的名字和类型的名字是相同的，并且接收一个用逗号分隔的元素列表作为参数。如果声明的是一个嵌套变量或者VARRAY变量，在使用这个变量之前必须要先对这个变量进行初始化。

如果两个集合是基于同一个集合的类型，那么就可以通过直接赋值的方式用一个集合变量给另一个变量进行初始化。

访问集合的数据：

- 如果访问的是一个还未定义的索引值，数据库会抛出NO_DATA_FOUND异常。所以，使用FOR循环扫描集合的内容，除非它是紧凑的（在FIRST和LAST之间没有未定义的索引值），否则会抛出异常；
- 试图访问一行已经超出了表或者VARRAY的界限，数据库抛出如下异常：ORA-06533: Subscript beyond count；

未完待续......
