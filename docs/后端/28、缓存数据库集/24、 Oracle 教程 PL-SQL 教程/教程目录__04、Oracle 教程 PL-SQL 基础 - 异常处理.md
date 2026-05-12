# 04、Oracle 教程 PL/SQL 基础 - 异常处理
- 来源：https://ddkk.com/zhuanlan/db/oracle/4/4.html
- 分类：缓存数据库
- 分组：教程目录
如果PL/SQL发生了错误，就会抛出一个异常，当前PL/SQL块中执行单元就会暂停处理，如果当前块有一个异常处理单元的话，控制会转移到当前块的异常处理单元来处理异常。完成了异常处理后就不能再返回当前块，相反，控制会转移到外层包围块，如果有的话。有时候，需要的是如果发生异常，还是希望程序继续执行后续的代码。解决的方法是：

```java
begin
    begin end;--如果这里发生了异常，后续的会继续执行
    begin end;--如果这里发生了异常，后续的会继续执行
    .....
end;
```

## 声明异常

只能用在定义参数的地方。就和声明一个参数一样

```java
exception_name EXCEPTION;--声明一个异常名称
```

## 抛出异常

在begin代码块中，如果需要手动抛出异常，只需要：

```java
RAISE exception_name；--抛出一个异常
```

还有一种形式：

```java
RAISE；
```

这种形式只能用在异常捕获中的when语句对应的then中，意思是说在when语句中捕获到了异常，执行then的逻辑后，再抛一个异常，这个异常和此次捕获的异常是一样的。（通常是放在then的最后的）

## 捕获异常

如果有多个异常用同一个处理方法，可以在WHEN exception_name后加or，接着写异常名称。不能用and，因为不可能同一时刻抛出两个异常

```java
EXCEPTION
    WHEN exception_name THEN ...要执行的代码...
    ...
    WHEN OTHERS --这部分可以省略，注意，它会吞掉所有的异常
THEN ...要执行的代码...
```

**注意：**这里要执行的代码是多条，要用begin end括起来。

如果要捕获所有异常，那么直接用WHEN OTHERS。

异常处理句柄是在位置所有可执行语句之后，end语句之前。

## 异常名称和错误代码关联

oracle中有很多异常抛出来的时候只有数字，没有名称。为了见名知意，可以给这些异常命名。

```java
exception_name EXCEPTION;--声明一个异常名称
PRAGMA EXCEPTION_INIT(exception_name, integer);--把这个异常名称和异常代码关联
```

这样在异常捕获的时候就可以捕获到integer代表的异常了：

```java
EXCEPTION
    WHEN exception_name THEN ...要执行的代码...
```

通常情况下，是在一个包中定义一系列的异常代码和异常名称的关系，然后在使用的时候用这个包就可以了，例如：

在包中定义：

```java
create or replace package dynsql
is
    invalid_table_name EXCEPTION;
    PRAGMA EXCEPTION_INIT(invalid_table_name, -903);
    invalid_identifier EXCEPTION;
    PRAGMA EXCEPTION_INIT(invalid_identifier. -904);
end dynsql;
```

在其他地方使用的时候：

```java
WHEN dynsql.invalid_identifier THEN ...
```
