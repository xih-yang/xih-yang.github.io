# 24、MariaDB 事务
- 来源：https://ddkk.com/zhuanlan/db/mariadb/24.html
- 分类：缓存数据库
- 分组：教程目录
事务是顺序组操作。 它们作为单个单元运行，并且直到组中的所有操作都成功执行时才终止。 组中的单个故障会导致整个事务失败，并导致对数据库没有影响。

事务符合ACID（原子性，一致性，隔离和耐久性）

- **原子性** - 它通过中止故障和回滚更改来确保所有操作的成功。
- **一致性** - 它确保数据库对成功的事务应用更改。
- **隔离** - 它使事务的独立事务操作。
- **持久性** - 它确保在系统故障的情况下成功事务的持久性。

在事务语句的开头是START TRANSACTION语句，后跟COMMIT和ROLLBACK语句 –

- **START TRANSACTION** - 开始事务。
- **COMMIT** - 保存对数据的更改。
- **ROLLBACK** - 结束事务，销毁任何更改。

事务成功时执行COMMIT，失败时执行ROLLBACK。

**注** - 有些语句会导致隐式提交，并且在事务中使用时也会导致错误。 这样的语句的示例包括但不限于CREATE，ALTER和DROP。

MariaDB事务还包括SAVEPOINT和LOCK TABLES等选项。 SAVEPOINT设置一个恢复点以利用ROLLBACK。 LOCK TABLES允许在会话期间控制对表的访问，以防止在某些时间段内进行修改。

AUTOCOMMIT变量提供对事务的控制。 设置为1会强制所有操作都被视为成功事务，而设置为0会导致持久性更改只发生在显式COMMIT语句上。

## 事务的结构

事务语句的一般结构包括从START TRANSACTION开始。 下一步是插入一个或多个命令/操作，插入用于检查错误的语句，插入ROLLBACK语句以管理发现的任何错误，最后插入COMMIT语句以对成功的操作应用更改。

查看下面给出的示例 –

```sql
START TRANSACTION;
SELECT name FROM products WHERE manufacturer = 'XYZ Corp';
UPDATE spring_products SET item = name;
COMMIT;
```
