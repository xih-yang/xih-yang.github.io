# 11、SQL Server 基础 - 视图和公用表表达式
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/1/11.html
- 分类：缓存数据库
- 分组：教程目录
## 视图

视图是基于结果集的可视化的表，用于简化查询，对视图的操作不会影响到数据库本身。

**①创建视图**

```java
CREATE VIEW 视图名 AS
SELECT 列名表
FROM 源表名
```

例如：

```java
create view MyView as
select Cno,CName,Credit 
from Course
```

可以看到在视图中多了一个文件：

查看一下：

**②删除视图**

```java
DROP VIEW 视图名
```

删除后可以刷新对象资源管理器看到视图已经被删除了。

**③视图的更新**

```java
sp_refreshview 视图名
```

因为视图是基于表的，这相当于使用存储过程来刷新了视图。

**(1)**如果添加一个列，因为这个列必然不在视图创建时要求的列中(即便创建时使用了*，也只表示那个时候的全部，并不包括这个列)，是不会对视图有影响的。

但是，如果你使用*的初衷不是为了只使用当前表中全部的列，还希望当表增加新的列时视图也能增加，这时候就需要去更新视图了。

```java
create view MyView as
select * 
from Course
alter table Course add XinDe char(10)
sp_refreshview MyView
select * from MyView
```

**(2)**因为视图来自表，所以在表中删除了视图中使用了的列(这时候没问题，因为视图不影响表)，在查看视图时会报错，即便查看的仅是没删除的列。这时候就需要刷新视图。

```java
alter table Course drop column XinDe
select CName from MyView
```

刷新视图，去查看全部列也没问题了，这时的全部当然不会包括删掉的那个列。

```java
sp_refreshview MyView
select * from MyView
```

**(3)**对于原表中的数据进行了更改，则视图会自动更新。

```java
create view MyView as
select Cno,CName,Credit 
from Course
update Course set Credit=7 where Cno=1
select * from MyView
```

## 公用表表达式

前面学的视图是作为数据库对象存储在数据库中的，如果这个结果集仅仅要使用一次，那么建立视图就太奢侈了。

公用表表达式(Common Table Expression)将查询结果指定一个临时命名的名字。

```java
WITH 公用表名 [(自定列名表)] AS
(SELECT...)
```

注意，公用表表达式只能且必须在后面的一个SELECT/INSERT/UPDATE/DELETE/MERGE语句中使用，但这条语句未结束时可以多次使用，结束后就失效了。

例如：

```java
with ok(ok1,ok2) as (select CName,Credit from Course)
select * from ok
```

这里只说了公用表表达式的非递归使用，实际上它还可以递归使用，以后再学。
