# 22、MySQL 调优 - MySQL从整库备份中恢复单表
- 来源：https://ddkk.com/zhuanlan/db/mysql/3/22.html
- 分类：缓存数据库
- 分组：教程目录
备注:
MySQL 5.7.31

## 一.问题描述

之前帮朋友搭建的MySQL数据库，说是有个表的数据被误删除了，现在需要进行恢复。

## 二. 解决方案

还好我之前给他安装MySQL数据库的时候，特意做了备份，每天凌晨都会把整库进行备份。

### 2.1 从整库备份中找到单表的备份文件

#### 2.1.1 直接通过sed命令处理

在网上找到了这个命令，用起来还不错:

```java
sed -n -e '/CREATE TABLE.*my_table/,/UNLOCK TABLES/p' mydump.sql >`/tmp/my_table.sql
```

不过有点慢,9GB左右文件 5分钟左右，结果文件500M左右

**速度有点慢：**

#### 2.1.2 切分后通过grep来查找

下次尝试把大文件切分一下

按1000行一个文件进行切分，最好在后台运行

split -l 1000 mydump.sql &

切分后的文件如下:

```java
[root@not1 tmp]# ls
xaa  xab  xac  xad  xae  xaf  xag  xah  xai  xaj  xak  xal  xam  xan  xao  xap  xaq  xar  xas  xat  xau  xav  xaw  xax  xay  xaz  xba  xbb
```

写个shell脚本遍历:

```java
#!/bin/bash
dir=/data/tmp
date
for file in $dir/*; do
    cat $file | grep --ignore-case  'insert into my_table'  >>`/tmp/20211126.log
done
date
echo "================="
date
cat /data/dump.sql | grep --ignore-case  'insert into my_table' >>`/tmp/20211126_2.log
date
~            
```

数据量不大，只有2G，12s优化到了8s，效果还算过得去

```java
[root@node1 data]# sh 1.sh 
Fri Nov 26 17:40:38 CST 2021
Fri Nov 26 17:40:50 CST 2021
=================
Fri Nov 26 17:40:50 CST 2021
Fri Nov 26 17:41:02 CST 202
```

### 2.2 恢复到一个新表

做恢复的时候，最好是恢复到一个新库下的新表，确认数据无误后再写回原表

```java
mysql -uroot -p -hmy_host
create database db_backup;
use db_backup;
source /tmp/my_table.sql
```

追日志，确保无问题。

### 2.3 还原到源环境

因为备份表和目前系统的表 表结构不一致，所以处理起来会麻烦一些

目前系统的表比源表多一个col1字段。

```java
-- 备份新表
create table my_new_table_bak like my_new_table;
-- 将新表多的字段给删除
alter table my_new_table drop column col1;
-- 从备份表同步数据
insert into my_new_table select * from db_backup.my_backup_table;
-- 将删除的列再添加回来
alter table my_new_table add column col1 varchar(255);
-- 清理备份表
drop table db_backup.my_backup_table;
```
