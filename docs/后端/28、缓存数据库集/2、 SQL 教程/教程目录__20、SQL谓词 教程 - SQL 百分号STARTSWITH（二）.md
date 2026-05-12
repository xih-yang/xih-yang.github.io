# 20、SQL谓词 教程 - SQL %STARTSWITH（二）
- 来源：https://ddkk.com/zhuanlan/db/sqlweici/20.html
- 分类：缓存数据库
- 分组：教程目录
## 首尾空格

在大多数情况下，`%STARTSWITH`将前导空格视为与任何其他字符相同的字符。

例如，`%STARTSWITH ' B'`可用于选择只有一个前导空白后跟字母`B`的字段值。然而，只包含空白的子字符串不能选择前导空白;

它选择非空值。

尾随空格的`%STARTSWITH`行为取决于数据类型和排序规则类型。

`%STARTSWITH`忽略定义为`SQLUPPER`的字符串子串的尾随空格。

`%STARTSWITH`不会忽略数字、日期或列表子字符串中的尾随空格。

在下面的示例中，`%STARTSWITH`将结果集限制为以`“M”`开头的名称。

因为`Name`是一个`SQLUPPER`字符串数据类型，子字符串的末尾空格将被忽略:

```java
SELECT Name FROM Sample.Person
WHERE Name %STARTSWITH 'M      '
```

在下面的示例中，`%STARTSWITH`从结果集中删除所有行，因为对于数值，子字符串的末尾空格不会被忽略:

```java
SELECT Name,Age FROM Sample.Person
WHERE Age %STARTSWITH '6      '
```

在下面的示例中，`%STARTSWITH`从结果集中删除所有行，因为对于列表值，子字符串中的末尾空不会被忽略:

```java
SELECT Name,FavoriteColors FROM Sample.Person
WHERE %EXTERNAL(FavoriteColors) %STARTSWITH 'Blue '
```

但是，在下面的示例中，结果集由这些列表值组成，这些列表值以`Blue`开头，然后是列表分隔符(显示为空白);

换句话说，以`“Blue”`开头的列表包含多个项:

```java
SELECT Name,FavoriteColors FROM Sample.Person
WHERE %EXTERNAL(FavoriteColors) %STARTSWITH 'Blue'||CHAR(13)||CHAR(10)
```

## 下标的范围

当从下标中检索标量表达式时，`%STARTSWITH`可以用作一个索引限制范围条件，从而缩小需要遍历的标量表达式下标值的范围。

其逻辑是用给定的子字符串前缀值开始下标范围，并在下标值不再以子字符串开头时停止。

## 国家排序歧义字符

在一些国家语言中，两个字符或字符组合被认为是等价的。

通常这是一个有或没有重音标记的字符，例如在`Czech2`区域设置中，其中`CHAR(65)`和`CHAR(193)`都排序为`“a”`。

%STARTSWITH将这些字符识别为等效字符。

下面的示例显示了`Czech2 CHAR(65) (A)`和`CHAR(193) (Á)`的首次遍历排序:

```java
M
MA
MÁ
MAC
MÁC
MACX
MÁCX
MAD
MÁD
MB 
```

需要注意的是，无法在查询编译时知道在运行时将使用哪种国家排序规则。

因此，必须编写`%STARTSWITH`下标遍历代码，以便正确地满足任何可能的运行时情况。

## 其他等价的比较

`%STARTSWITH`对字符串的初始字符执行等价比较。

可以使用字符串比较操作符执行其他类型的等价比较。

这些措施包括:

使用等号操作符对整个字符串进行等价比较:

```java
SELECT Name,Home_State FROM Sample.Person
WHERE Home_State = 'VT'
```

这个例子选择任何包含`Home_State`字段值`“VT”`的记录。

因为`Home_State`被定义为`SQLUPPER`，所以这个字符串比较不区分大小写。

还可以使用不相等操作符(`<>`)对整个字符串执行非等价比较。

- 子字符串与值的等价比较，使用Contains操作符:

```java
SELECT Name FROM Sample.Person
WHERE Name [ 'y'
```

此示例选择包含小写字母`“y”`的所有`Name`记录。

默认情况下，`Contains`操作符比较是区分大小写的，即使字段被定义为不区分大小写。

- 使用SQL Search进行上下文感知的等价比较。

`SQL Search`的一个用途是确定一个值是否包含指定的单词或短语。

`SQL`搜索不区分大小写。
- 使用IN关键字操作符对整个字符串与多个值进行等价比较:

```java
SELECT Name,Home_State FROM Sample.Person
WHERE Home_State IN ('VT','MA','NH','ME')
ORDER BY Home_State
```

这个示例选择任何包含任何指定`Home_State`字段值的记录。

- 使用%pattern关键字操作符对整个字符串与值模式进行等价比较:

```java
SELECT Name,Home_State FROM Sample.Person
WHERE Home_State %PATTERN '1U1"C"'
ORDER BY Home_State
```

这个示例选择任何包含`Home_State`字段值的记录，该字段值匹配`1U`(一个大写字母)后跟1个`“C”`(一个字母`“C”`)的模式。

这个模式可以通过`Home_State`缩写`“NC”`或`“SC”`来实现。

- 使用LIKE关键字操作符将具有一个或多个通配符的子字符串与一个值进行等价比较:

```java
SELECT Name FROM Sample.Person
WHERE Name LIKE '_a%'
```

这个示例选择包含字母`“a”`作为第二个字母的所有`Name`记录。

此字符串比较使用`Name`排序规则类型来确定比较是否区分大小写。

注意:当在运行时提供谓词值时(使用`?`输入参数或`:var`输入主机变量)，结果谓词`%STARTSWITH 'abc'`提供了比等价的结果谓词`'abc%'`更好的性能。

## 示例

下面的示例使用`WHERE`子句选择以字母`“R”`或`“r”`开头的`Name`值。

默认情况下，`%STARTSWITH`字符串比较不区分大小写:

```java
SELECT Name FROM Sample.Person
WHERE Name %STARTSWITH 'r'
```

下面的示例为每个以`“M”`开头的`Home_State`名称返回一条记录:

```java
SELECT DISTINCT Home_State FROM Sample.Person
WHERE Home_State %STARTSWITH 'M'
ORDER BY Home_State
```

下面的示例使用`HAVING`子句为年龄以`2`开头的人选择记录，显示所有年龄的平均值和`HAVING`子句选择的年龄的平均值。

它将结果按年龄排序:

```java
SELECT Name,
       Age,
       AVG(Age) AS AvgAge,
       AVG(Age %AFTERHAVING) AS Avg20
FROM Sample.Person
HAVING Age %STARTSWITH 2
ORDER BY Age
```

下面的示例执行`%STARTSWITH`与`DOB`(出生日期)字段的内部日期格式值的比较。

在本例中，它选择从`11/5/1988` (`$H=54000`)到`08/1/1991` (`$H=54999`)的所有日期:

```java
SELECT Name,DOB
FROM Sample.Person
WHERE DOB %STARTSWITH 54
ORDER BY DOB
```
