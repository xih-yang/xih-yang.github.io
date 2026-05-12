# 08、JDBC - 教程 - JDBC结果集
- 来源：https://ddkk.com/zhuanlan/db/jdbc/3/8.html
- 分类：缓存数据库
- 分组：教程目录
SQL语句执行后从数据库查询读取数据，返回的数据放在结果集中。 `SELECT`语句用于从数据库中选择行并在结果集中查看它们的标准方法。 `java.sql.ResultSet`接口表示数据库查询的结果集。

`ResultSet`对象维护指向结果集中当前行的游标。 术语“结果集”是指包含在`ResultSet`对象中的行和列数据。

`ResultSet`接口的方法可以分为三类：

- **浏览方法**：用于移动光标。
- **获取方法**：用于查看光标指向的当前行的列中的数据。
- **更新方法**：用于更新当前行的列中的数据。 然后在基础数据库中更新数据。

光标可以基于`ResultSet`的属性移动。当创建生成`ResultSet`的相应`Statement`时，将指定这些属性。

JDBC提供以下连接方法来创建具有所需`ResultSet`的语句 -

- createStatement(int RSType, int RSConcurrency);
- prepareStatement(String SQL, int RSType, int RSConcurrency);
- prepareCall(String sql, int RSType, int RSConcurrency);

第一个参数表示`ResultSet`对象的类型，第二个参数是两个`ResultSet`常量之一，用于指定结果集是只读还是可更新。

### ResultSet类型

可能的`RSType`值如下。如果不指定任何`ResultSet`类型，将自动分配一个`TYPE_FORWARD_ONLY`值。

类型
描述

ResultSet.TYPE_FORWARD_ONLY
光标只能在结果集中向前移动。

ResultSet.TYPE_SCROLL_INSENSITIVE
光标可以向前和向后滚动，结果集对创建结果集后发生的数据库所做的更改不敏感。

ResultSet.TYPE_SCROLL_SENSITIVE
光标可以向前和向后滚动，结果集对创建结果集之后发生的其他数据库的更改敏感。

### ResultSet的并发性

可能的`RSConcurrency`如下。 如果不指定任何并发类型，将自动获得一个`CONCUR_READ_ONLY`值。

并发
描述

ResultSet.CONCUR_READ_ONLY
创建只读结果集，这是默认值。

ResultSet.CONCUR_UPDATABLE
创建可更新的结果集

到目前为止我们写的所有例子可以写成如下，它初始化一个`Statement`对象来创建一个只向前的只读`ResultSet`对象 -

```java
try {
   Statement stmt = conn.createStatement(
                           ResultSet.TYPE_FORWARD_ONLY,
                           ResultSet.CONCUR_READ_ONLY);
}
catch(Exception ex) {
   ....
}
finally {
   ....
}
```

Java

### 浏览结果集

`ResultSet`接口中有几种涉及移动光标的方法，包括 -

编号
方法
描述

1
public void beforeFirst() throws SQLException
将光标移动到第一行之前

2
public void afterLast() throws SQLException
将光标移动到最后一行之后。

3
public boolean first() throws SQLException
将光标移动到第一行。

4
public void last() throws SQLException
将光标移动到最后一行。

5
public boolean absolute(int row) throws SQLException
将光标移动到指定的行。

6
public boolean relative(int row) throws SQLException
从当前指向的位置，将光标向前或向后移动给定行数。

7
public boolean previous() throws SQLException
将光标移动到上一行。 如果上一行关闭结果集，此方法返回false。

8
public boolean next() throws SQLException
将光标移动到下一行。 如果结果集中没有更多行，则此方法返回false。

9
public int getRow() throws SQLException
返回光标指向的行号。

10
public void moveToInsertRow() throws SQLException
将光标移动到结果集中的特殊行，该行可用于将新行插入数据库。当前光标位置被记住。

11
public void moveToCurrentRow() throws SQLException
如果光标当前位于插入行，则将光标移回当前行; 否则，此方法什么也不做

### 查看结果集

`ResultSet`接口包含数十种获取当前行数据的方法。

每个可能的数据类型都有一个`get`方法，每个`get`方法有两个版本 -

- 一个是采用列名称。
- 另一个采用列索引。

例如，如果对查看感兴趣的列包含一个`int`，则需要使用`ResultSet`的其中一个`getInt()`方法 -

序号
方法
描述

1
public int getInt(String columnName) throws SQLException
返回名为columnName的列中当前行中的int值。

2
public int getInt(int columnIndex) throws SQLException
返回指定列索引当前行中的int值。列索引从1开始，意味着行的第一列为1，行的第二列为2，依此类推。

类似地，在八个Java基元类型中的每一个的`ResultSet`接口中都有`get`方法，以及常见的类型，如`java.lang.String`，`java.lang.Object`和`java.net.URL`等。

还有一些方法可以获取SQL数据类型`java.sql.Date，java.sql.Time`，`java.sql.TimeStamp`，`java.sql.Clob`和`java.sql.Blob`。查看文档以获取有关使用这些SQL数据类型的更多信息。

### 更新结果集

`ResultSet`接口包含用于更新结果集的数据的更新方法的集合。

与get方法一样，每种数据类型都有两种更新方法 -

- 一个是采用列名称。
- 另一个采用列索引。

例如，要更新结果集当前行的`String`列，可以使用以下`updateString()`方法之一：

序号
方法
描述

1
public void updateString(int columnIndex, String s) throws SQLException
将指定列中的String值更改为指定的s值。

2
public void updateString(String columnName, String s) throws SQLException
与前前的方法类似，除了使用列的名称而不是列的索引指定。

有八种基本数据类型的更新方法，以及`java.sql`包中的`String`，`Object`，`URL`和SQL数据类型。

更新结果集中的一行会更改`ResultSet`对象中当前行的列，但不会更改底层数据库中的列的值。 要更新数据库中的行，需要调用以下方法之一。

序号
方法
描述

1
public void updateRow()
更新数据库中当前行

2
public void deleteRow()
从数据库中删除当前行

3
public void refreshRow()
刷新结果集中的数据以反映数据库中最近的任何更改。

4
public void cancelRowUpdates()
取消对当前行所做的任何更新。

5
public void insertRow()
在数据库中插入一行。 只有当光标指向插入行时，才能调用此方法。
