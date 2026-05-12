# 05、Sharding-Sphere 实战：性能测试
- 来源：https://ddkk.com/zhuanlan/sharding/shardingsphere/2/5.html
- 分类：分库分表
- 分组：教程目录
从业务角度考虑，分为直连、单路由、主从、分库分表四个基本应用场景，对 ShardingSphere-Proxy 和 MySQL 进行性能对比。ShardingSphere官方文档中说明支持Sysbench和BenchmarkSQL 5.0，但是BenchmarkSQL 5.0本身不支持MySQL数据库（需要自行修改源码重新编译），因此别无选择只能使用Sysbench进行性能基准测试。

本次测试使用上篇“[二、用例测试](https://blog.csdn.net/wzy0623/article/details/125100906#t4)”的环境。BenchmarkSQL基准测试属于压测，为尽量减小复制延迟，将两个从库的刷盘参数设置为0，并开启组提交与多线程复制。事先在两个MySQL从库上执行如下设置：

```java
set global sync_binlog=0;
set global innodb_flush_log_at_trx_commit=0;
set global slave_parallel_type = LOGICAL_CLOCK;
set global slave_parallel_workers = 8;
```

然后在主库创建测试库：

```java
create database sysbench_test;
```

## 一、安装Sysbench

```java
# 安装依赖
yum install automake libtool –y
```

从下面地址下载Sysbench源码包：

[https://github.com/akopytov/sysbench/archive/refs/heads/master.zip](https://github.com/akopytov/sysbench/archive/refs/heads/master.zip)

```java
# 解压
unzip sysbench-master.zip
cd sysbench-master
# 编译、安装
./autogen.sh
./configure
make
make install
export LD_LIBRARY_PATH=/home/mysql/mysql-5.7.34-linux-glibc2.12-x86_64/lib/;
# 查看版本
$sysbench --version
sysbench 1.1.0
```

## 二、分场景测试

### 1. 直连主库

首先不通过Proxy，直连主库进行基准测试，用以结果数据对比。

准备测试数据，创建16张表，每张表一百万条数据。

```java
sysbench \
--db-driver=mysql \
--mysql-user=wxy \
--mysql_password=mypass \
--mysql-db=sysbench_test \
--mysql-host=172.18.26.198 \
--mysql-port=3306 \
--tables=16 \
--table-size=1000000 \
--threads=32 \
--warmup-time=60 \
--time=300 \
--events=0 \
--report-interval=1 \
/usr/local/share/sysbench/oltp_read_write.lua prepare
```

执行测试，预热一分钟，压测5分钟，每秒输出一行报告。

```java
sysbench \
--db-driver=mysql \
--mysql-user=wxy \
--mysql_password=mypass \
--mysql-db=sysbench_test \
--mysql-host=172.18.26.198 \
--mysql-port=3306 \
--tables=16 \
--table-size=1000000 \
--threads=32 \
--warmup-time=60 \
--time=300 \
--events=0 \
--report-interval=1 \
/usr/local/share/sysbench/oltp_read_write.lua run
```

测试结果：

```java
SQL statistics:        # SQL统计
    queries performed:
        read:                            7859852                       读总数
        write:                           2245765                       写总数
        other:                           1122868                       SELECT、INSERT、UPDATE、DELETE之外的其他操作，如COMMIT等
        total:                           11228485                      # 总数
    transactions:                        561450 (1870.79 per sec.)     总事务数(每秒事务数)TPS
    queries:                             11228485 (37414.11 per sec.)  # 总请求数(每秒请求数)QPS
    ignored errors:                      0      (0.00 per sec.)        # 忽略的总错误数(每秒忽略的错误数)
    reconnects:                          0      (0.00 per sec.)        # 重连总数(每秒重连数)
Throughput:            # 吞吐量
    events/s (eps):                      1870.7915                     每秒事务数
    time elapsed:                        300.1139s                     总耗时
    total number of events:              561450                        # 共发生多少事务数
Latency (ms):          响应时间
         min:                                    4.41                  # 最小耗时
         avg:                                   17.12                  # 平均耗时
         max:                                 1800.21                  # 最大耗时
         95th percentile:                       15.00                  # 95%的测试平均耗时
         sum:                              9613322.01                  # 总耗时
Threads fairness:      线程公平性
    events (avg/stddev):           17545.3125/742.43                   事务(平均值/偏差)
    execution time (avg/stddev):   300.4163/0.00                       执行时间(平均值/偏差)
```

执行清理：

```java
sysbench \
--db-driver=mysql \
--mysql-user=wxy \
--mysql_password=mypass \
--mysql-db=sysbench_test \
--mysql-host=172.18.26.198 \
--mysql-port=3306 \
--tables=16 \
--table-size=1000000 \
--threads=32 \
--warmup-time=60 \
--time=300 \
--events=0 \
--report-interval=1 \
/usr/local/share/sysbench/oltp_read_write.lua cleanup
```

### 2. 单路由

连接Proxy实例：

```java
mysql -u root -h 172.18.10.66 -P 3307 -p123456
```

创建逻辑库并在其中添加资源：

```java
drop database if exists sysbench_test;
create database sysbench_test;
use sysbench_test;
add resource 
sysbench_ds (host=172.18.26.198, port=3306, db=sysbench_test, user=wxy, password=mypass);
```

准备测试数据：

```java
sysbench \
--db-driver=mysql \
--mysql-user=root \
--mysql_password=123456 \
--mysql-db=sysbench_test \
--mysql-host=172.18.10.66 \
--mysql-port=3307 \
--tables=16 \
--table-size=1000000 \
--threads=32 \
--warmup-time=60 \
--time=300 \
--events=0 \
--report-interval=1 \
/usr/local/share/sysbench/oltp_read_write.lua prepare
```

除了数据库连接改成Proxy外，其他参数不变。准备数据阶段会在当前资源（唯一数据源）中创建表并插入测试数据。在“[1. 单表](https://blog.csdn.net/wzy0623/article/details/125093704#t31)”中讲过，对于没有对应规则的表，创建的是单表，即所有的分片数据源中仅唯一存在的表，可用show single tables语句确认。

```java
mysql> show single tables;
+------------+---------------+
| table_name | resource_name |
+------------+---------------+
| sbtest11   | sysbench_ds   |
| sbtest9    | sysbench_ds   |
| sbtest10   | sysbench_ds   |
| sbtest13   | sysbench_ds   |
| sbtest12   | sysbench_ds   |
| sbtest15   | sysbench_ds   |
| sbtest14   | sysbench_ds   |
| sbtest16   | sysbench_ds   |
| sbtest2    | sysbench_ds   |
| sbtest1    | sysbench_ds   |
| sbtest4    | sysbench_ds   |
| sbtest3    | sysbench_ds   |
| sbtest6    | sysbench_ds   |
| sbtest5    | sysbench_ds   |
| sbtest8    | sysbench_ds   |
| sbtest7    | sysbench_ds   |
+------------+---------------+
16 rows in set (0.03 sec)
```

Proxy自动生成了单表规则：

```java
mysql> count schema rules;
+--------------------------+-------+
| rule_name                | count |
+--------------------------+-------+
| single_table             | 16    |
| sharding_table           | 0     |
| sharding_binding_table   | 0     |
| sharding_broadcast_table | 0     |
| sharding_scaling         | 0     |
| readwrite_splitting      | 0     |
| db_discovery             | 0     |
| encrypt                  | 0     |
| shadow                   | 0     |
+--------------------------+-------+
9 rows in set (0.13 sec)
```

执行测试：

```java
sysbench \
--db-driver=mysql \
--mysql-user=root \
--mysql_password=123456 \
--mysql-db=sysbench_test \
--mysql-host=172.18.10.66 \
--mysql-port=3307 \
--tables=16 \
--table-size=1000000 \
--threads=32 \
--warmup-time=60 \
--time=300 \
--events=0 \
--report-interval=1 \
/usr/local/share/sysbench/oltp_read_write.lua run
```

测试结果：

```java
SQL statistics:
    queries performed:
        read:                            5152256
        write:                           1472135
        other:                           736047
        total:                           7360438
    transactions:                        368039 (1226.56 per sec.)
    queries:                             7360438 (24530.03 per sec.)
    ignored errors:                      0      (0.00 per sec.)
    reconnects:                          0      (0.00 per sec.)
Throughput:
    events/s (eps):                      1226.5584
    time elapsed:                        300.0585s
    total number of events:              368039
Latency (ms):
         min:                                   12.00
         avg:                                   26.09
         max:                                 1153.78
         95th percentile:                       28.16
         sum:                              9600473.56
Threads fairness:
    events (avg/stddev):           11501.1250/431.11
    execution time (avg/stddev):   300.0148/0.02
```

与直连数据库对比，TPS从1870.79降为1226.56，QPS从37414.11降为24530.03，平均相应时间从17.12毫秒增加到26.09毫秒，分别都**降低了34.4%**。

执行清理：

```java
sysbench \
--db-driver=mysql \
--mysql-user=root \
--mysql_password=123456 \
--mysql-db=sysbench_test \
--mysql-host=172.18.10.66 \
--mysql-port=3307 \
--tables=16 \
--table-size=1000000 \
--threads=32 \
--warmup-time=60 \
--time=300 \
--events=0 \
--report-interval=1 \
/usr/local/share/sysbench/oltp_read_write.lua cleanup
```

### 3. 读写分离

重建逻辑库：

```java
drop database if exists sysbench_test;
create database sysbench_test;
-- 切换当前数据库
use sysbench_test;
-- 添加资源
add resource 
write_ds (host=172.18.26.198, port=3306, db=sysbench_test, user=wxy, password=mypass),
read_ds1 (host=172.18.10.66, port=3306, db=sysbench_test, user=wxy, password=mypass),
read_ds2 (host=172.18.18.102, port=3306, db=sysbench_test, user=wxy, password=mypass);
-- 创建单表规则
create default single table rule resource = write_ds;
```

准备阶段，在主库上建表并生成测试数据。

```java
sysbench \
--db-driver=mysql \
--mysql-user=root \
--mysql_password=123456 \
--mysql-db=sysbench_test \
--mysql-host=172.18.10.66 \
--mysql-port=3307 \
--tables=16 \
--table-size=1000000 \
--threads=32 \
--warmup-time=60 \
--time=300 \
--events=0 \
--report-interval=1 \
/usr/local/share/sysbench/oltp_read_write.lua prepare
```

创建读写分离规则，一主负责写，两从负责读，读负载均衡采用4比1的权重策略（从1比从2的磁盘快）。

```java
create readwrite_splitting rule ms_group_1 (
write_resource=write_ds,
read_resources(read_ds1, read_ds2),
type(name=weight, properties(read_ds1=4,read_ds2=1)));
```

执行测试：

```java
sysbench \
--db-driver=mysql \
--mysql-user=root \
--mysql_password=123456 \
--mysql-db=sysbench_test \
--mysql-host=172.18.10.66 \
--mysql-port=3307 \
--tables=16 \
--table-size=1000000 \
--threads=32 \
--warmup-time=60 \
--time=300 \
--events=0 \
--report-interval=1 \
/usr/local/share/sysbench/oltp_read_write.lua run
```

测试结果：

```java
SQL statistics:
    queries performed:
        read:                            4339073
        write:                           1239793
        other:                           619876
        total:                           6198742
    transactions:                        309954 (1032.85 per sec.)
    queries:                             6198742 (20655.80 per sec.)
    ignored errors:                      0      (0.00 per sec.)
    reconnects:                          0      (0.00 per sec.)
Throughput:
    events/s (eps):                      1032.8465
    time elapsed:                        300.0971s
    total number of events:              309954
Latency (ms):
         min:                                   12.64
         avg:                                   30.97
         max:                                  878.00
         95th percentile:                       36.24
         sum:                              9600655.73
Threads fairness:
    events (avg/stddev):           9686.0312/282.06
    execution time (avg/stddev):   300.0205/0.02
```

本场景得出的TPS为1032.85，QPS为20655.80，平均相应时间为30.97毫秒，**比直连数据库下降了44.8%**。

执行清理：

```java
sysbench \
--db-driver=mysql \
--mysql-user=root \
--mysql_password=123456 \
--mysql-db=sysbench_test \
--mysql-host=172.18.10.66 \
--mysql-port=3307 \
--tables=16 \
--table-size=1000000 \
--threads=32 \
--warmup-time=60 \
--time=300 \
--events=0 \
--report-interval=1 \
/usr/local/share/sysbench/oltp_read_write.lua cleanup
```

### 4. 数据分片

```java
-- 创建逻辑库
drop database if exists sysbench_test;
create database sysbench_test;
-- 切换当前数据库
use sysbench_test;
-- 添加资源
add resource 
resource_1 (host=172.18.10.66, port=3306, db=db1, user=wxy, password=mypass),
resource_2 (host=172.18.10.66, port=3306, db=db2, user=wxy, password=mypass),
resource_3 (host=172.18.18.102, port=3306, db=db1, user=wxy, password=mypass),
resource_4 (host=172.18.18.102, port=3306, db=db2, user=wxy, password=mypass);
# 创建自动分片规则
create sharding table rule sbtest1 (
resources(resource_1,resource_2,resource_3,resource_4),
sharding_column=id,type(name=hash_mod,properties("sharding-count"=16)),
key_generate_strategy(column=id,type(name=snowflake)));
```

还有一个工作，编辑 /usr/local/share/sysbench/oltp_common.lua 文件172行：

```java
id_def = "INTEGER NOT NULL AUTO_INCREMENT"
```

改为

```java
id_def = "bigint NOT NULL AUTO_INCREMENT"
```

Sysbench使用数据库自增生成主键，insert语句不带主键字段，因此生成snowflake分布式全局主键，得把主键数据类型改为bigint。

准备测试数据，建一个测试表，插入一千六百万行。按照规则，会在四个数据源中使用hash_mod算法平均自动分成16个分表，每个数据源4个分表，每个分表近似一百万数据。

```java
sysbench \
--db-driver=mysql \
--mysql-user=root \
--mysql_password=123456 \
--mysql-db=sysbench_test \
--mysql-host=172.18.10.66 \
--mysql-port=3307 \
--tables=1 \
--table-size=16000000 \
--threads=32 \
--warmup-time=60 \
--time=300 \
--events=0 \
--report-interval=1 \
/usr/local/share/sysbench/oltp_read_write.lua prepare
```

执行测试：

```java
sysbench \
--db-driver=mysql \
--mysql-user=root \
--mysql_password=123456 \
--mysql-db=sysbench_test \
--mysql-host=172.18.10.66 \
--mysql-port=3307 \
--tables=1 \
--table-size=16000000 \
--threads=32 \
--warmup-time=60 \
--time=300 \
--events=0 \
--report-interval=1 \
/usr/local/share/sysbench/oltp_read_write.lua run
```

测试结果：

```java
SQL statistics:
    queries performed:
        read:                            3062717
        write:                           224998
        other:                           1087684
        total:                           4375399
    transactions:                        218788 (729.23 per sec.)
    queries:                             4375399 (14583.38 per sec.)
    ignored errors:                      0      (0.00 per sec.)
    reconnects:                          0      (0.00 per sec.)
Throughput:
    events/s (eps):                      729.2289
    time elapsed:                        300.0267s
    total number of events:              218788
Latency (ms):
         min:                                   19.39
         avg:                                   43.88
         max:                                  306.48
         95th percentile:                       68.05
         sum:                              9600734.14
Threads fairness:
    events (avg/stddev):           6837.1250/31.73
    execution time (avg/stddev):   300.0229/0.01
```

因为分片算法和全局主键所增加的复杂度，性能进一步下降。TPS降为729.23、QPS降为14583.38，平均相应时间达到了43.88毫秒，**与直连数据库对比，下降了61%。**

执行清理：

```java
sysbench \
--db-driver=mysql \
--mysql-user=root \
--mysql_password=123456 \
--mysql-db=sysbench_test \
--mysql-host=172.18.10.66 \
--mysql-port=3307 \
--tables=1 \
--table-size=16000000 \
--threads=32 \
--warmup-time=60 \
--time=300 \
--events=0 \
--report-interval=1 \
/usr/local/share/sysbench/oltp_read_write.lua cleanup
```
