# 29、MariaDB 克隆表
- 来源：https://ddkk.com/zhuanlan/db/mariadb/29.html
- 分类：缓存数据库
- 分组：教程目录
某些情况下需要生成现有表的精确副本。 CREATE … SELECT语句不能产生此输出，因为它忽略了索引和默认值。

复制表的过程如下 –

- 使用SHOW CREATE TABLE来生成详细描述源表的整个结构的CREATE TABLE语句。
- 编辑语句以给表一个新名称，并执行它。
- 如果还需要复制表数据，请使用INSERT INTO … SELECT语句。

```sql
mysql> INSERT INTO inventory_copy_tbl (
   product_id,product_name,product_manufacturer,ship_date)
   SELECT product_id,product_name,product_manufacturer,ship_date,
   FROM inventory_tbl;
```

另一种创建副本的方法使用CREATE TABLE AS语句。 该语句复制所有列，列定义，并用源表数据填充副本。

检查其语法如下 –

```sql
CREATE TABLE clone_tbl AS
   SELECT columns
   FROM original_tbl
   WHERE conditions];
```

查看其使用示例如下 –

```sql
CREATE TABLE products_copy_tbl AS
   SELECT *
   FROM products_tbl;
```
