# 07、MySQL 教程 - MySQL 函数
- 来源：https://ddkk.com/zhuanlan/db/mysql/8/7.html
- 分类：缓存数据库
- 分组：教程目录
## 函数

**函数**：类似“加工坊”，将用户传来的参数进行处理后再返回

函数分为：系统函数和自定义函数

1）**系统函数**：系统自身携带，无需定义，直接使用

2）**自定义函数**：用户自行定义进行使用

### 自定义函数

自定义函数格式（4步）：

```java
CREATE  FUNCTION  函数名 （参数1，参数2，参数N）
RETURNS 返回值的数据类型
[函数选项]
BEGIN
	函数体；
	RETURN 语句；
END；
```

1）函数参数尽量避免重名，且参数不需DECLARE声明

2）函数只能返回一个值（有且仅有一个）

3）函数不允许返回结果集，即使是在函数内中也不允许

函数选项
含义

LANGUAGE SQL
默认选项，说明函数体使用SQL语言编写

[NOT] DETERMINISTIC
当函数返回不确定值时，防止复制时的不一致性 默认选项是：NOT DETERMINISTIC

CONTAINS SQL
函数体中不包含读或写数据的语句
 (默认)

NO SQL
函数体不包含SQL语句

READS SQL DATA
函数体包含SELECT查询语句，不包含更新语句

MODIFIES SQL DATA
函数体包含数据更新语句

SQL SECURITY
指定函数的执行许可

DEFINER
函数只能由创建者调用

INVOKER
函数可以被其他数据用户调用 （默认值为DEFINER）

COMMENT
为函数添加说明等注释信息

//若包含SELECT语句，需用DECLARE定义一个变量来接受查询结果

//函数总是对同样的输入参数产生同样的结果（则认为是“确定的”）

### 管理自定义函数

列出查看所有自定义函数信息：

`SHOW FUNCTION STATUS；`

1）自定义函数较多时，可以使用LIKE进行模糊查询

列出指定函数名的详细信息：

`SHOW CREATE FUNCTION 函数名；`

1）在指定函数名时不需带上（）和参数，直接函数名即可

查看指定数据库中所有自定义函数名

```java
SELECT  name
FROM  mysql.proc
WHERE db=‘数据库名’ AND  TYPE =‘函数库名’
```

查询指定函数函数的详细信息：

```java
SELECT  *
FROM  information_schema.routines
WHERE  routine_name=‘函数名’；
```

//函数的信息都保存在information_schema数据库的routines表中

查询指定

删除自定义函数：

`DROP FUNCTION 函数名；`

1）函数保存的仅仅是函数体（MySQL表达式），不保存任何用户数据

2）自定义函数进行修改时只能先删除，后再建立一个同名函数
