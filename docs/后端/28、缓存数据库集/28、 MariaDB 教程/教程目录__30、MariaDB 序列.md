# 30、MariaDB 序列
- 来源：https://ddkk.com/zhuanlan/db/mariadb/30.html
- 分类：缓存数据库
- 分组：教程目录
在版本10.0.3中，MariaDB引入了一种称为序列的存储引擎。 其ad hoc为操作生成整数序列，然后终止。 该序列包含正整数，以降序或升序排列，并使用起始，结束和递增值。

它不允许在多个查询中使用，只能在其原始查询因为其虚拟（不写入磁盘）性质。 但是，序列表可以通过ALTER命令转换为标准表。 如果删除转换的表，序列表仍然存在。 序列也不能产生负数或以最小/最大值旋转。

## 安装序列引擎

使用序列需要安装序列引擎，MariaDB作为插件而不是二进制分发。 使用以下命令安装它 –

```sql
INSTALL SONAME "ha_sequence";
```

安装后，验证它 –

```sql
SHOW ENGINESG
```

请记住，在引擎安装后，您不能创建具有使用序列语法的名称的标准表，但可以创建具有序列语法名称的临时表。

## 创建序列

有两种方法创建序列 –

- 创建表并使用AUTO_INCREMENT属性将列定义为自动递增。
- 使用现有数据库并使用序列SELECT查询来生成序列。 查询使用seq_ [FROM] _to_ [TO]或seq_ [FROM] _to_ [TO] _step_STEP语法。

最佳实践更喜欢使用第二种方法。 查看下面给出的序列创建的示例 –

```sql
SELECT * FROM seq_77_to_99;
```

序列有很多用途 –

- 在列中找到缺少的值，以防止操作中的相关问题 –

```sql
SELECT myseq.seq FROM seq_22_to_28 myseq LEFT JOIN table1 t ON myseq.seq
   = x.y WHERE x.y IS NULL;
```

- 构造值的组合 –

```sql
SELECT x1.seq, x2.seq FROM seq_5_to_9 x1 JOIN seq_5_to_9 x2 ORDER BY 5, 6;
```

- 查找数字的倍数 –

```sql
SELECT seq FROM seq_3_to_100_step_4;
```

- 构造用于预订系统等应用程序的日期序列。
- 构造时间序列。
