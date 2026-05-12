# 10、MySQL 教程 - MySQL 初识事务
- 来源：https://ddkk.com/zhuanlan/db/mysql/8/10.html
- 分类：缓存数据库
- 分组：教程目录
## 事务处理

**事务处理（Transaction Processing）**：维护数据库的完整性

1）确保成批的MySQL操作要么完全执行，要么完全不执行（类似原语）

事务处理中3个重要该概念：

1）**保留点（Savepoint）**：事务处理中设置的临时占位符

2）**回退（Rollback）**：撤销指定SQL语句的过程（返回指定保留点）

3）**提交（Commit）**：将未存储的SQL语句结果写入数据库表

//隐含提交：默认SQL语句直接针对表执行和编写（同时进行执行和保存）

//在事务处理中不含隐含提交，需指定提交位进行明确提交（执行SQL语句）

### 管理事务处理

管理事务处理：将SQL语句组分为逻辑块，并指定数据何时应回退/提交

事务的开始：`START TRANSACTION；`

1）开始事务，同时指定保留点：`SAVEPOINT 保留点名；`

2）保留点越多越好，提高代码整体灵活性

3）可在最后指定参数以标识事务

参数
含义

READ ONLY
只读事务 （该事务只能读取数据）

READ WRITE
读写事务 （该事务可读写数据）

WITH CONSISTENT SNAPSHOT
一致性读

//“`BEGIN；`”也可开启事务，但无法指定参数

事务的回滚访问两种方式：

1）回滚至事务开始处：`ROLLBACK`；

2）回滚至事务的保留点：`ROLLBACK TO 保留点名；`

释放保留点：`RELEASE SAVEPOINT 保留点名；`

1）执行ROLLBACK/COMMIT后保留点会自动被释放

事务的提交：`COMMIT；`

如：事务处理的流程图

如：通过事务处理先删除ordertotals表中的数据，再回滚至事务的开始

如：通过事务处理删除ordertotals表中的数据，并提交

### AUTOCOMMIT

**AUTOCOMMIT变量**：指定用户连接期间执行的SQL语句是否为自动提交

1）MySQL默认所有的SQL语句执行后自动提交

2）默认所有SQL语句都是针对表执行的，且执行后立刻生效

设置是否自动提交：`SET AUTOCOMMIT=1/0；`

1）指定AUTOCOMMIT为0后执行的所有SQL语句不会立刻生效（直到为1）

2）部分语句可无视AUTOCOMMIT设置隐式事务

以下情况会无视AUTOCOMMIT直接提交事务

1）当前事务未提交或回滚时，又开启新事务会导致上个被提交；

2）使用`LOCK`/`UNLOCK TABLES`等锁定语句时会提交事务；

3）使用`START`/`STOP SLAVE`等复制语句时会提交事务；

4）管理用户相关语句也提交事务；

如：设置AUTOCOMMIT为0，并删除ordertotals表中的数据再回退

如：设置AUTOCOMMIT为1，并删除ordertotals表中的数据再回退
