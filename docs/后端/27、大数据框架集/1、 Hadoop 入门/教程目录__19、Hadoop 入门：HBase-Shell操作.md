# 19、Hadoop 入门：HBase-Shell操作
- 来源：https://ddkk.com/zhuanlan/bigdata/hadoop/1/19.html
- 分类：大数据框架
- 分组：教程目录
## HBase —— Shell操作

### 表的基本操作

#### 创建表

```java
create '表名', '列簇名', ... 
```

#### 查看表

```java
list
```

#### 删除表

```java
## 禁用表
disable "表名"
## 删除表
drop "表名"
```

#### 添加数据

```java
put '表名','ROWKEY','列簇名:列','值'
```

#### 查看数据

```java
get '表名','ROWKEY',{FORMATTER => 'toString'}
```

#### 更新数据

```java
## 更新数据仍然用put
put '表名','ROWKEY','列簇名:列','值'
```

#### 删除数据

```java
## 删除一列
delete '表名','ROWKEY','列簇:列'
## 删除一行
deleteall '表名','ROWKEY'
```

#### 扫描表

```java
## 还是要避免scan一张大表
scan '表名',{FORMATTER => 'toString'}
## 可以限制返回数量,列等
scan '表名',{LIMIT => 3, COLUMNS => ['列簇:列','列簇:列'], FORMATTER => 'toString'}
```

#### 查询指定ROWKEY

```java
scan '表名', {ROWPREFIXFILTER => 'rowkey'}
```

### 过滤器

```java
show_filters	# 显示过滤器
scan '表名', {Filter => "过滤器(比较运算符,'比较器表达式')"}	# 使用过滤器
```

过滤器
描述

RowFilter
行键过滤器

ValueFilter
列值过滤器

QualifierFilter
列标识过滤器

FamilyFilter
列簇过滤器

SingleColumnValueFilter
单列值过滤器

SingleColumnValueExcludeFilter
列值排除过滤器

PrefixFilter
行键前值过滤器

PageFilter
分页过滤器

#### 比较器

比较器
描述
基本语法

BinaryComparator
匹配完整字节数组
binary:值

BinaryPrefixComparator
匹配字节数组前缀
binary prefix:值

BitComparator
匹配比特位
bit:值

NullComparator
匹配空值
null

RegexStringComparator
匹配正则表达式
regexstring:正则表达式

SubstringComparator
匹配子字符串
substring:值

#### 过滤器使用示例

```java
## 例如查询mytable中的RowKey为x的行信息
scan 'mytable', {FILTER => "RowFilter(=,'binary:x')"}
```

#### 组合过滤器

使用AND和OR来组合过滤查询

```java
scan '表名', {Filter => "过滤器(比较运算符,'比较器表达式')" AND/OR "过滤器(比较运算符,'比较器表达式')"}
```

### shell状态管理

命令
描述

status
查看状态

whoami
查看当前用户

list
显示所有表

count
统计表的记录数

describe
展示表结构信息

exists
检查表是否存在

enable
启用一张表

disable
禁用一张表

is_enabled
检查表是否启用

is_deabled
检查表是否禁用

alter
更改表和列簇的模式

drop
删除一张被禁用的表

truncate
清空表的数据
