# 05、MySQL 提升 - 存储过程和函数1-变量
- 来源：https://ddkk.com/zhuanlan/db/mysql/1/5.html
- 分类：缓存数据库
- 分组：教程目录
#### 1 系统变量

**说明：**

变量由系统提供，属于服务器层面使用的语法。

系统变量分为全局变量和会话变量

如果是全局变量需要加global，如果是会话级别的变量则加session。

默认是session，所有可以不写。

global|session：表示global或session。

- 查看所有的系统变量：

```java
show global|session variables;
```

- 查看满足条件的部分系统变量：

```java
show global|session variables like '%char%';
```

- 查看指定的某个系统变量的值：

```java
select @@global|session.系统变量名;
```

- 为某个系统变量赋值：

方式一：

```java
set global|session 系统变量名 = 值
```

方式二：

```java
set @@global|session.系统变量名 = 值;
```

**全局变量示例：**

查看所有的全局变量：show global variables;

查看字符集相关的全局变量：show global variables like ‘%char%’;

查看指定的全局变量的值：select @@global.autocommit;

为指定的全局变量赋值(关闭事务的自动提交)：set @@global.autocommit = 0;

**作用域：**

服务器每次启动将为所有的全局变量赋初始值，对所有的会话（连接）有效，重启服务后会重置，但一般不会去修改。

**会话变量示例：**

查看所有的会话变量：show [session] variables;

查看字符集相关的全局变量：show [session] variables like ‘%char%’;

查看指定的全局变量的值：select @@[session.]tx_isolation;

为指定的全局变量赋值(关闭事务的自动提交)：set @@[session.]tx_isolation = ‘read-uncommitted’;

**作用域：** 仅仅对于当前会话（连接）有效。

#### 2 自定义变量

**说明：** 变量是由用户自定义的。

**使用步骤：** 声明、赋值、使用。

##### 2.1 用户变量

**作用域：** 对于当前会话（连接）有效。

**声明并初始化：**

SET@用户变量名=值;

SET@用户变量名:=值;

SELECT @用户变量名:=值;

**赋值（更新值）：**

SET@用户变量名=值;

SET@用户变量名:=值;

SELECT @用户变量名:=值;

SELECT 字段 INTO @用户变量名 FROM 表;

**举个例子：**

SET@flag = ‘xiaobai’;

SET@flag = 666;

SELECT COUNT(*) INTO @totalNum FROM teacher_info;

**使用变量：**

SELECT @用户变量名;

##### 2.2 局部变量

**作用域：** 只在定义它的begin end 中有效，并且只能应用在begin end的第一句！

**声明：**

DECLARE 变量名 类型;

DECLARE 变量名 类型 DEFAULT 值;

**赋值：**

SET变量名=值;

SET变量名:=值;

SELECT 变量名:=值;

SELECT 字段 INTO 变量名 FROM 表;

**使用：**

SELECT 变量名;

##### 2.3 变量使用

**用户变量：**

```java
SET @a = 7;
SET @b = 9;
SET @num = @a + @b;
SELECT @num;
```

**局部变量：**

```java
DECLARE a INT DEFAULT 6;
DECLARE b INT DEFAULT 8;
DECLARE num INT;
SET num = a + b;
SELECT num;
```
