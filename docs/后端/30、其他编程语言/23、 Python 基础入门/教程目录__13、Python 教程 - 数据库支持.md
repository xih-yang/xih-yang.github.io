# 13、Python 教程 - 数据库支持
- 来源：https://ddkk.com/zhuanlan/other/python/6/13.html
- 分类：Python 基础入门
- 分组：教程目录
本章讨论Python数据库API（一种连接到SQL数据库的标准化方式），并演示如何使用这个API来执行一些基本的SQL。最后，本章将讨论其他一些数据库技术。

[关Python支持的数据库清单](https://wiki.python.org/moin/DatabaseInterfaces)

## Python数据库API

[标准数据库API（DB API）](http://python.org/peps/pep-0249.html)

[Python官方维基百科中的数据库编程指南](http://wiki.python.org/moin/DatabaseProgramming)

### 全局变量

变量名
描述

apilevel
使用的Python DB API版本；是一个字符串常量，指出了使用的API版本。

threadsafety
模块的线程安全程度如何；是一个0~3（含）的整数。0表示线程不能共享模块，而3表示模块是绝对线程安全的。1表示线程可共享模块本身，但不能共享连接，而2表示线程可共享模块和连接，但不能共享游标。

paramstyle
在SQL查询中使用哪种参数风格；format’表示标准字符串格式设置方式（使用基本的格式编码），如在要插入参数的地方插入%s。'pyformat’表示扩展的格式编码，即旧式字典插入使用的格式编码，如%(foo)s；'qmark’表示使用问号，'numeric’表示使用:1和:2这样的形式表示字段（其中的数字是参数的编号），而’named’表示使用:foobar这样的形式表示字段（其中foobar为参数名）

### 异常

异常
超类
描述

StandardError

所有异常的超类

Warning
StandardError
发生非致命问题时引发

Error
StandardError
所有错误条件的超类

InterfaceError
Error
与接口（而不是数据库）相关的错误

DatabaseError
Error
与数据库相关的错误的超类

DataError
DatabaseError
与数据相关的问题，如值不在合法的范围内

OperationalError
DatabaseError
数据库操作内部的错误

IntegrityError
DatabaseError
关系完整性遭到破坏，如键未通过检查

InternalError
DatabaseError
数据库内部的错误，如游标无效

ProgrammingError
DatabaseError
用户编程错误，如未找到数据库表

NotSupportedError
DatabaseError
请求不支持的功能，如回滚

### 连接和游标

要使用底层的数据库系统，必须先连接到它，为此可使用名称贴切的函数connect。接受多个参数，具体是哪些取决于要使用的数据库。

**函数connect的常用参数**

参数名
描述
是否可选

dsn
数据源名称，具体含义随数据库而异
否

user
用户名
是

password
用户密码
是

host
主机名
是

database
数据库名称
是

函数connect返回一个连接对象，表示当前到数据库的会话。

**连接对象的方法**

方法名
描述

close()
关闭连接对象。之后，连接对象及其游标将不可用

commit()
提交未提交的事务——如果支持的话；否则什么都不做

rollback()
回滚未提交的事务（可能不可用）

cursor()
返回连接的游标对象

**游标对象的方法**

名称
描述

callproc(name[, params])
使用指定的参数调用指定的数据库过程（可选）

close()
关闭游标。关闭后游标不可用

execute(oper[, params])
执行一个SQL操作——可能指定参数

executemany(oper, pseq)
执行指定的SQL操作多次，每次都序列中的一组参数

fetchone()
以序列的方式取回查询结果中的下一行；如果没有更多的行，就返回None

fetchmany([size])
取回查询结果中的多行，其中参数size的值默认为arraysize

fetchall()
以序列的序列的方式取回余下的所有行

nextset()
跳到下一个结果集，这个方法是可选的

setinputsizes(sizes)
用于为参数预定义内存区域

setoutputsize(size[, col])
为取回大量数据而设置缓冲区长度

**游标对象的属性**

名称
描述

description
由结果列描述组成的序列（只读）

rowcount
结果包含的行数（只读）

arraysize
fetchmany返回的行数，默认为1

### 类型

**DB API构造函数和特殊值**

名称
描述

Date(year, month, day)
创建包含日期值的对象

Time(hour, minute, second)
创建包含时间值的对象

Timestamp(y, mon, d, h, min, s)
创建包含时间戳的对象

DateFromTicks(ticks)
根据从新纪元开始过去的秒数创建包含日期值的对象

TimeFromTicks(ticks)
根据从新纪元开始过去的秒数创建包含时间值的对象

imestampFromTicks(ticks)
根据从新纪元开始过去的秒数创建包含时间戳的对象

Binary(string)
创建包含二进制字符串值的对象

STRING
描述基于字符串的列（如CHAR）

BINARY
描述二进制列（如LONG或RAW）

NUMBER
描述数字列

DATETIME
描述日期/时间列

ROWID
描述行ID列

## SQLite和PySQLite

### 起步

导入模块sqlite3来导入Python标准库中的SQLit

```java
import sqlite3#导入模块sqlite3
conn = sqlite3.connect('beyond.db')#连接数据库，若数据库不存在则自动创建
curs = conn.cursor()#从连接获得游标，这个游标可用来执行SQL查询。
conn.commit()#在每次修改数据库后都进行提交
conn.close()#关闭连接
```

### 数据库应用程序示例

ABBREV.txt数据库信息放在与程序同一个目录下

[ABBREV.txt](https://download.csdn.net/download/qq_41264055/77849597)

在文件ABBREV.txt中，每行都是一条数据记录，字段之间用脱字符（^）分隔。

数字字段直接包含数字，而文本字段用两个波浪字符（~）将其字符串值括起。

**将这个ASCII文件中的数据转换为SQL数据库**

**1，创建并填充数据库表**

创建一个名为food的表

读取文件ABBREV.txt并对其进行分析

通过调用curs.execute来执行一条SQL INSERT语句，从而将字段中的值插入数据库中。

**将数据导入数据库**

```java
import sqlite3
def convert(value): 
    if value.startswith('~'): 
        return value.strip('~') 
    if not value: 
        value = '0' 
    return float(value)
conn = sqlite3.connect('food.db') 
curs = conn.cursor()
curs.execute(''' 
CREATE TABLE food (
id TEXT PRIMARY KEY, 
desc TEXT, 
water FLOAT, 
kcal FLOAT, 
protein FLOAT, 
fat FLOAT, 
ash FLOAT, 
carbs FLOAT, 
fiber FLOAT, 
sugar FLOAT 
) 
''')
query = 'INSERT INTO food VALUES (?,?,?,?,?,?,?,?,?,?)' 
field_count = 10 
for line in open('ABBREV.txt'):
    fields = line.split('^') 
    vals = [convert(f) for f in fields[:field_count]] 
    curs.execute(query, vals)
conn.commit() 
conn.close()
```

当你运行这个程序时（文件ABBREV.txt和它位于同一个目录），它将新建一个名为food.db的文件，其中包含数据库中的所有数据。

**2，搜索并处理结果**

**数据库查询程序**

```java
import sqlite3,sys 
conn = sqlite3.connect('food.db') 
curs = conn.cursor() 
query = 'SELECT * FROM food WHERE ' + sys.argv[1] 
print(query)
curs.execute(query)
names = [f[0] for f in curs.description] 
for row in curs.fetchall(): 
    for pair in zip(names, row): 
        print('{}: {}'.format(*pair)) 
    print()
```

## 小结

概念
解释

Python DB API
这个API定义了一个简单的标准化接口，所有数据库包装器模块都必须遵循它，这让编写使用多个不同数据库的程序更容易。

连接
连接对象表示到SQL数据库的通信链路，使用方法cursor可从连接获得游标。你还可使用连接对象来提交或回滚事务。使用完数据库后，就可将连接关闭了。

游标
游标用于执行查询和查看结果。可逐行取回查询结果，也可一次取回很多（或全部）行。

类型和特殊值
DB API指定了一组构造函数和特殊值的名称。构造函数用于处理日期和时间对象，还有二进制数据对象；而特殊值用于表示关系型数据库的类型，如STRING、NUMBER和DATETIME。

SQLite
这是一个小型的嵌入式SQL数据库，标准Python发行版中包含其Python包装器，即模块sqlite3。这个数据库速度快、易于使用，且不要求搭建专门的服务器。

### 本章介绍的函数

函数
描述

connect(…)
连接到数据库并返回一个连接对象
