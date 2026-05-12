# 02、Oracle 教程 PL/SQL 基础 - 条件控制
- 来源：https://ddkk.com/zhuanlan/db/oracle/4/2.html
- 分类：缓存数据库
- 分组：教程目录
**NULL语句**：有时候需要什么都不做（if条件符合时，什么都不做），可以用NULL语句：NULL；（NULL加个分号），什么都不做，类似于java中的“；”。

**条件**：在条件判断中，会出现三种情况：true、false、null。其中null当作false来处理。

### if语句

注意：一个if必须要有一个匹配的end if。end和if之间必须有一个空格。elsif中没有“e”。在关键字end if后要使用“；”，其他的不能有。

```java
if condition
    then ...一系列可执行语句...
end if;
```

```java
if condition
    then ...一系列可执行语句...
    else ...一系列可执行语句...
end if;
```

```java
if condition1
    then  ...一系列可执行语句...
elsif conditionN
    then ...一系列可执行语句...
else ...一系列可执行语句...(这个else可以省略)
end if;
```

### 简单case语句

先对expression求值，然后把结果和resultN比较，如果符合，则执行statementsN，否则执行statements_else 。

```java
case expression
    when result1 then statements1
    when result2 then statements2
    ...
    else statements_else (这个else可以省略)
end case;
```

### 搜索case语句

对expressionN求值，一旦某个表达式的结果为true，就会执行和这个表达式关联的一系列语句。注意：只要有一个expression匹配了，后面的就不会执行了。

```java
case
    when expression1 then statements1
    when expression2 then statements2
    ....
    else statments_else(这个else是可以省略)
end case;
```

如果需要的case作为表达式，即用case给变量赋值，这个时候只需要把statementsN变成一个变量，另外将end case改成end就可以了，即case表达式是用end结尾的，case语句是用end case结尾的。
