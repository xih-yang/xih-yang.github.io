# 21、MariaDB 备份方法
- 来源：https://ddkk.com/zhuanlan/db/mariadb/21.html
- 分类：缓存数据库
- 分组：教程目录
数据作为业务和操作的基础，并且具有各种可能的威胁（例如，攻击者，系统故障，不良升级和维护错误），备份仍然至关重要。 这些备份采用多种形式，并且存在许多选项用于在这些过程中使用更宽泛的选项来创建它们。 要记住的重要事情是数据库类型，关键信息和所涉及的结构。 此信息确定您的最佳选择。

### 选项

备份的主要选项包括逻辑备份和物理备份。 逻辑备份保存用于恢复数据的SQL语句。 物理备份包含数据副本。

- 与**物理备份**相比，逻辑备份提供了在具有不同配置的另一台机器上恢复数据的灵活性，物理备份通常限于相同的机器和数据库类型。 逻辑备份发生在数据库和表级，物理发生在目录和文件级。
- **物理备份**的大小小于逻辑备份，并且执行和恢复所需的时间也更少。 物理备份还包括日志和配置文件，但逻辑备份不包括。

## 备份工具

用于MariaDB备份的主要工具是mysqldump。 它提供逻辑备份和灵活性。 它也证明是小数据库的一个很好的选择。 Mysqldump将数据转储为SQL，CSV，XML和许多其他格式。 其输出不保留存储过程，视图和事件，没有显式指令。

有三个选项**mysqldump**备份 –

- **原始数据** - 通过–tab选项将表转储为原始数据文件，该选项还指定文件的目标 –

```sql
$ mysqldump -u root -p --no-create-info 
   --tab=/tmp PRODUCTS products_tbl
```

- **数据/定义export** - 此选项允许将单个或多个表导出到文件，并支持备份主机上的所有现有数据库。 检查将内容或定义导出到文件的示例

```sql
$ mysqldump -u root -p PRODUCTS products_tbl > export_file.txt
```

- **传输** - 您还可以将数据库和表输出到另一个主机

```sql
$ mysqldump -u root -p database_name 
   | mysql -h other-host.com database_name
```

## 使用SELECT … INTO OUTFILE语句

导出数据的另一个选项使用SELECT … INTO OUTFILE语句。 这个简单的选项输出表到一个简单的格式化文本文件 –

```sql
mysql> SELECT * FROM products_tbl
   -> INTO OUTFILE '/tmp/products.txt';
```

其属性允许将文件格式化为您首选的规范。

请注意本声明的以下质量 –

- 文件名必须指定输出的所需位置。
- 您需要MariaDB文件权限才能执行语句。
- 输出文件名必须是唯一的。
- 您需要主机上的登录凭据。
- 在UNIX环境中，输出文件是世界可读的，但其服务器所有权会影响您删除它的能力。 确保您有权限。

## 在备份中使用CONNECT

**CONNECT**处理程序允许导出数据。 这证明主要在**SELECT … INTO OUTFILE**操作不支持文件格式的情况下有用。

查看以下示例 –

```sql
create table products
engine = CONNECT table_type = XML file_name = 'products.htm' header = yes
option_list = 'name=TABLE,coltype = HTML,attribute = border=1;cellpadding = 5'
select plugin_name handler, plugin_version version, plugin_author
author, plugin_description description, plugin_maturity maturity
from information_schema.plugins where plugin_type = 'STORAGE ENGINE';
```

## 其他工具

备份的其他选项如下 –

- **XtraBackup** - 此选项针对XtraDB / InnoDB数据库，并与任何存储引擎一起工作。从Percona的官方网站了解有关此工具的更多信息。
- **Snapshots** - 某些文件系统允许快照。该过程包括使用读锁刷新表，装入快照，解锁表，复制快照，然后卸载快照。
- **LVM** - 这种流行的方法使用Perl脚本。它在每个表上获取读取锁并将缓存刷新到磁盘。然后它获取快照并解锁表。有关详细信息，请咨询官方mylvmbackup网站。
- **TokuBackup** - Percona提供的此解决方案提供热备份，考虑到InnoDB备份选项的问题和限制。它生成文件的事务性声音副本，而应用程序继续操作它们。有关详细信息，请咨询Percona网站。

### INNODB注意事项

InnoDB使用缓冲池来提高性能。在备份中，配置InnoDB以避免将整个表复制到缓冲池中，因为逻辑备份通常执行全表扫描。
