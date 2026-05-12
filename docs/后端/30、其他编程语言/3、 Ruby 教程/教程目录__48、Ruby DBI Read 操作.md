# 48、Ruby DBI Read 操作
- 来源：https://ddkk.com/zhuanlan/other/ruby/48.html
- 分类：Ruby 教程
- 分组：教程目录
DBI提供了一些从数据库获取记录的不同方法

假设 **dbh** 是一个数据库句柄，**sth** 是一个语句句柄

序号
方法 & 描述

1
db.select_one( stmt, *bindvars ) => aRow | nil
执行带有bindvars绑定在参数标记前的stmt语句。返回第一行，如果结果集为空则返回nil

2
db.select_all( stmt, *bindvars ) => [aRow, ...] | nil
db.select_all( stmt, *bindvars ){ |aRow| aBlock }
执行带有bindvars绑定在参数标记前的stmt语句。调用不带有块的该方法，返回一个包含所有行的数组。如果给出了一个块，则会为每行调用该方法。

3
sth.fetch => aRow | nil
返回下一行。如果在结果中没有下一行，则返回nil。

4
sth.fetch { |aRow| aBlock }
为结果集中剩余的行调用给定的块。

5
sth.fetch_all => [aRow, ...]
返回保存在数组中的结果集的所有剩余的行。

6
sth.fetch_many( count ) => [aRow, ...]
返回保存在 [aRow, ...] 数组中的往下第count行。

7
sth.fetch_scroll( direction, offset=1 ) => aRow | nil
返回direction参数和offset指定的行。除了 SQL_FETCH_ABSOLUTE 和 SQL_FETCH_RELATIVE，其他方法都会丢弃参数offset。direction参数可能的值，请查看下面的表格。

8
sth.column_names => anArray
返回列的名称

9
column_info => [ aColumnInfo, ... ]
返回 DBI::ColumnInfo 对象的数组。每个对象存储有关某个列的信息，并包含该列的名称、类型、精度等其他更多的信息。

10
sth.rows => rpc
返回执行语句处理的行数Count，如果不存在则返回nil。

11
sth.fetchable? => true | false
如果可能获取行，则返回true，否则返回false。

12
sth.cancel
释放结果集所占有的资源。在调用该方法后，您就不能在获取行了，除非再次调用execute。

13
sth.finish
释放准备语句所占有的资源。在调用该方法后，您就不能在该对象上调用其他进一步操作的方法了。

## direction 参数

下面的值可用于 *fetch_scroll* 方法的 direction 参数

常量
描述

DBI::SQL_FETCH_FIRST
获取第一行

DBI::SQL_FETCH_LAST
获取最后一行

DBI::SQL_FETCH_NEXT
获取下一行

DBI::SQL_FETCH_PRIOR
获取上一行

DBI::SQL_FETCH_ABSOLUTE
获取在该位置偏移处的行

DBI::SQL_FETCH_RELATIVE
获取距离当前行该偏移量的行

### 范例

下面范例演示了如何获取一个语句的元数据。假设存在 EMPLOYEE 表

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
require "dbi"
begin
     # 连接到 MySQL 服务器
     dbh = DBI.connect("DBI:Mysql:TESTDB:localhost", 
                        "testuser", "test123")
     sth = dbh.prepare("SELECT * FROM EMPLOYEE 
                        WHERE INCOME > ?")
     sth.execute(1000)
     if sth.column_names.size == 0 then
        puts "Statement has no result set"
        printf "Number of rows affected: %d\n", sth.rows
     else
        puts "Statement has a result set"
        rows = sth.fetch_all
        printf "Number of rows: %d\n", rows.size
        printf "Number of columns: %d\n", sth.column_names.size
        sth.column_info.each_with_index do |info, i|
          printf "--- Column %d (%s) ---\n", i, info["name"]
          printf "sql_type:         %s\n", info["sql_type"]
          printf "type_name:        %s\n", info["type_name"]
          printf "precision:        %s\n", info["precision"]
          printf "scale:            %s\n", info["scale"]
          printf "nullable:         %s\n", info["nullable"]
          printf "indexed:          %s\n", info["indexed"]
          printf "primary:          %s\n", info["primary"]
          printf "unique:           %s\n", info["unique"]
          printf "mysql_type:       %s\n", info["mysql_type"]
          printf "mysql_type_name:  %s\n", info["mysql_type_name"]
          printf "mysql_length:     %s\n", info["mysql_length"]
          printf "mysql_max_length: %s\n", info["mysql_max_length"]
          printf "mysql_flags:      %s\n", info["mysql_flags"]
      end
   end
   sth.finish
rescue DBI::DatabaseError => e
     puts "An error occurred"
     puts "Error code:    #{e.err}"
     puts "Error message: #{e.errstr}"
ensure
     # 断开与服务器的连接
     dbh.disconnect if dbh
end
```

运行以上范例，输出结果如下

```ruby
$ ruby main.rb
Statement has a result set
Number of rows: 5
Number of columns: 5
--- Column 0 (FIRST_NAME) ---
sql_type:         12
type_name:        VARCHAR
precision:        20
scale:            0
nullable:         true
indexed:          false
primary:          false
unique:           false
mysql_type:       254
mysql_type_name:  VARCHAR
mysql_length:     20
mysql_max_length: 4
mysql_flags:      0
--- Column 1 (LAST_NAME) ---
sql_type:         12
type_name:        VARCHAR
precision:        20
scale:            0
nullable:         true
indexed:          false
primary:          false
unique:           false
mysql_type:       254
mysql_type_name:  VARCHAR
mysql_length:     20
mysql_max_length: 5
mysql_flags:      0
--- Column 2 (AGE) ---
sql_type:         4
type_name:        INTEGER
precision:        11
scale:            0
nullable:         true
indexed:          false
primary:          false
unique:           false
mysql_type:       3
mysql_type_name:  INT
mysql_length:     11
mysql_max_length: 2
mysql_flags:      32768
--- Column 3 (SEX) ---
sql_type:         12
type_name:        VARCHAR
precision:        1
scale:            0
nullable:         true
indexed:          false
primary:          false
unique:           false
mysql_type:       254
mysql_type_name:  VARCHAR
mysql_length:     1
mysql_max_length: 1
mysql_flags:      0
--- Column 4 (INCOME) ---
sql_type:         6
type_name:        FLOAT
precision:        12
scale:            31
nullable:         true
indexed:          false
primary:          false
unique:           false
mysql_type:       4
mysql_type_name:  FLOAT
mysql_length:     12
mysql_max_length: 4
mysql_flags:      32768
```
