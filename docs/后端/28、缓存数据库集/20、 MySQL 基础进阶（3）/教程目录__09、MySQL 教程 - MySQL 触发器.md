# 09、MySQL 教程 - MySQL 触发器
- 来源：https://ddkk.com/zhuanlan/db/mysql/8/9.html
- 分类：缓存数据库
- 分组：教程目录
## 触发器

**触发器（TRIGGER）**：数据库中指定操作在执行前/后，系统自动执行其他操作

1）本质：被指定关联到表的数据对象

2）每个表的每个触发事件仅能仅能关联一个触发器

3）触发器是一类特殊的存储过程，用于保护表中的数据

4）触发器不能接收和传递参数，也只能针对特定的表（视图不支持触发器）

//触发器不需要调用（当表的特别事件出现时，会自动激活）

触发器作用：实现复杂数据处理和增强数据完整性的有效机制

1）实现CHECK约束、维护冗余数据、数据在所有相关表中的级联选项

触发器要素
含义

触发对象
触发器针对的表

触发事件
引起触发器被触发的事件 （INSERT、DELETE和UPDATE）

触发时间
触发器是在触发事件 发生之前（BEFORE）触发 发生之后（AFTER）触发

触发条件
只有满足触发条件，触发器才启动

触发操作
触发器启动后执行的操作

触发器的类型
含义
包括

DML触发器
数据库中发生DML事件时 调用DML触发器
BEFORE类型触发器 先执行触发程序 后执行触发事件
AFTER类型触发器 先执行触发事件 后执行触发程序

系统触发器
相应的系统事件触发 但系统触发器的激活一般基于 对数据库系统进行的操作 （MySQL不支持）

### 创建触发器

创建触发器格式：

```java
CREATE  TRIGGER  触发器名 触发时间 触发事件
ON  表名  FOR  EACH  ROW
BEGIN
	触发程序
END
```

1）触发器名具有唯一性

2）触发时间分为两种：`BEFORE`、`AFTER`

3）触发事件分为三种：`INSERT`、`UPDATE`、`DELETE`

4）FOR EACH ROW：表示行级触发器（每一条记录都会执行一次触发器）

5）触发程序：触发事件发生时，系统自动运行的程序

//因为有触发时间和触发事件，一个数据库最多可以设置六种类型的触发器

//目前MySQL仅支持行级触发器，不支持语句级别的触发器

1）触发程序中可以包含SELECT语句，但SELECT语句不能返回结果集

2）若创建两个相同触发时间和触发事件的触发程序，则先创建的有效

3）InnoDB存储引擎的触发器可以保证更新操作与触发程序的原子性

//MyISAM存储引擎的触发器不能保证原子性（同一个事务中完成）

表
含义
访问方式

NEW
表示新数据
NEW.字段名

OLD
表示旧数据
OLD.字段名

//NEW表和OLD表均为虚拟表

表
insert
update
delete

new
修改后的新数据
修改后的新数据
无

old
无
修改前的旧数据
修改前的旧数据

SIGNAL语句：向调用者返回错误/警告（触发程序的一种）

SIGNAL格式：

```java
SIGNAL SQLSTATE ‘HY000’
SET message_text=返回信息；
```

//‘HY000’中的HY是固定的且必须大写

#### INSERT触发器

创建INSERT触发器时，有3个需知：

1）INSERT触发程序中可引用NEW表（虚拟表）；

2）BEFORE INSERT触发程序中，NEW表中数据可被更新；

3）AUTO_INCREMENT约束的字段，其在NEW表中在插入前为0；

如：创建BEFORE INSERT触发器，实现在数据插入orders表中前将显示“You Will Insert”的文本信息

如：创建AFTER INSERT触发器，实现在数据插入orders表中后将该数据的order_num字段插入orderitems表

#### DELETE触发器

创建DELETE触发器时，有3个需知：

1）DELETE触发程序中可引用OLD表（虚拟表）；

2）OLD表中的值全部都是仅读的（不能被更新）；

3）BEFORE DELETE触发器相较于AFTER DELETE更具有实际意义

//BEFORE DELETE和AFTER DELETE均能实现数据备份

//BEFORE DELETE在实现备份时，如果备份失败，则拒绝DELET语句

如：创建BEFORE DELETE触发器，实现在order表中删除数据时将显示“Waring：You are delete”的文本信息

如：创建AFTER DELETE触发器，实现在数据从orders表中删除后将该数据的order_num字段备份至back_orders表的order_num

#### UPDATE触发器

创建UPDATE触发器时，有3个需知：

1）UPDATE触发程序中可引用NEW表和OLD表；

2）BEFORE UPDATE 触发程序中，NEW表中数据可被更新；

3）OLD表中的值全部都是仅读的（不能被更新）；

如：创建BEFORE UPDATE触发器，实现在order表中更新order_num时将该新order_num改为“20010”，并将原order_num备份至back_orders表

使用触发器实现检查约束：阻止不满条件的记录插入，阻止触发程序继续执行

1）原理：触发程序中定义出错提示语句或不完成的SQL语句，使退出触发程序

2）由于MySQL触发器不支持撤销undo、退出exit等操作，所以触发程序正常运行期间无法中断并退出

使用触发器维护冗余数据：避免数据不一致问题的发生

1）冗余数据应交由系统（触发器）自动维护，尽量避免人工维护

使用触发器模拟外键级联选项：

1）当存储引擎是InnoDB时，添加外码约束时指定级联删除选项实现

2）存储引擎不是InnoDB时，才采用使用触发器实现级联删除

//应该首先维护子表的数据，然后再维护父表的数据

### 管理触发器

列出所有的触发器：`SHOW TRIGGERS；`

列出指定触发器的定义语句：`SHOW CREATE TRIGGER 触发器名；`

删除指定触发器：`DROP TRIGGER 触发器名；`

1）触发器过程保存的仅是存储执行程序，不保存任何用户数据

2）触发器进行修改时只能先删除，后再建立一个同名触发器
