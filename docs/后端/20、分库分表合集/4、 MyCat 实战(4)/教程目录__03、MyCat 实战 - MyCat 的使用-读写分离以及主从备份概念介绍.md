# 03、MyCat 实战 - MyCat 的使用-读写分离以及主从备份概念介绍
- 来源：https://ddkk.com/zhuanlan/sharding/mycat/4/3.html
- 分类：分库分表
- 分组：教程目录
### 1.读写分离

- 原理：需要搭建主从模式，让主数据库（master）处理事务性增、改、删操作（INSERT、UPDATE、DELETE），而从数据库（slave）处理 SELECT 查询操作。
- Mycat 配合数据库本身的复制功能，可以解决读写分离的问题。

### 2.主从备份概念

- 什么是主从备份: 就是一种主备模式的数据库应用
- 主库(Master)数据与备库(Slave)数据完全一致.
- 实现数据的多重备份, 保证数据的安全.
- 可以在 Master[InnoDB]和 Slave[MyISAM]中使用不同的数据库引擎,实现读写的分离

#### 2.1 MySQL5.5, 5.6 版本后本身支持主从备份

- 在老旧版本的 MySQL 数据库系统中,不支持主从备份,需要安装额外的 RPM 包
- 如果需要安装 RPM,只能在一个位置节点安装

#### 2.2 主从备份目的

##### 2.2.1 实现主备模式

- 保证数据的安全. 尽量避免数据丢失的可能

##### 2.2.2 实现读写分离

- 使用不同的数据库引擎,实现读写分离.提高所有的操作效率
- InnoDB 使用 DML 语法操作. MyISAM 使用 DQL 语法操作

#### 2.3 主从备份效果

##### 2.3.1 主库操作同步到备库

- 所有对 Master 的操作,都会同步到 Slave 中
- 如果 Master 和 Salve 天生上环境不同,那么对 Master 的操作,可能会在 Slave 中出现错误
- 如: 在创建主从模式之前,Master 有 database : db1, db2, db3. Slave 有 database: db1, db2.
- 创建主从模式.现在的情况 Master 和 Slave 天生不同
- 主从模式创建成功后,在 Master 中 drop database db3. Slave 中抛出数据库 SQL 异常.后续所有的命令不能同步
- 一旦出现错误. 只能重新实现主从模式

#### 2.4 主从模式下的逻辑图
