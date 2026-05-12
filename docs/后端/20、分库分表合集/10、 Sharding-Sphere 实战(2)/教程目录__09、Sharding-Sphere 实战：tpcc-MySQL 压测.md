# 09、Sharding-Sphere 实战：tpcc-MySQL 压测
- 来源：https://ddkk.com/zhuanlan/sharding/shardingsphere/2/9.html
- 分类：分库分表
- 分组：教程目录
## 一、环境

MySQL版本：5.7.34

ShardingSphere-Proxy：5.1.2

MySQL客户端与tpcc-mysql：172.18.16.156

ShardingSphere-Proxy Cluster模式：172.18.10.66:3307; 172.18.18.102:3307

底层资源库：172.18.10.66:3306 db1、db2; 172.18.18.102:3306 db1、db2

## 二、准备

在172.18.16.156执行以下步骤：

### 1. 建库

```java
# 连接ShardingSphere-Proxy
mysql -u root -h 172.18.10.66 -P 3307 -p123456
-- 建库
create database sharding_db;
use sharding_db;
-- 查看运行模式
show instance mode\G
```

### 2. 添加资源

```java
add resource 
resource_1 (host=172.18.10.66, port=3306, db=db1, user=wxy, password=mypass),
resource_2 (host=172.18.10.66, port=3306, db=db2, user=wxy, password=mypass),
resource_3 (host=172.18.18.102, port=3306, db=db1, user=wxy, password=mypass),
resource_4 (host=172.18.18.102, port=3306, db=db2, user=wxy, password=mypass);
```

### 3. 创建分片规则

```java
-- 用以各个表中的 warehouse id 作为分片键。
create sharding table rule warehouse (
resources(resource_1,resource_2,resource_3,resource_4),
sharding_column=w_id,type(name=hash_mod,properties("sharding-count"=16)));
create sharding table rule district (
resources(resource_1,resource_2,resource_3,resource_4),
sharding_column=d_w_id,type(name=hash_mod,properties("sharding-count"=16)));
create sharding table rule customer (
resources(resource_1,resource_2,resource_3,resource_4),
sharding_column=c_w_id,type(name=hash_mod,properties("sharding-count"=16)));
create sharding table rule history (
resources(resource_1,resource_2,resource_3,resource_4),
sharding_column=h_c_w_id,type(name=hash_mod,properties("sharding-count"=16)));
create sharding table rule new_orders (
resources(resource_1,resource_2,resource_3,resource_4),
sharding_column=no_w_id,type(name=hash_mod,properties("sharding-count"=16)));
create sharding table rule orders (
resources(resource_1,resource_2,resource_3,resource_4),
sharding_column=o_w_id,type(name=hash_mod,properties("sharding-count"=16)));
create sharding table rule order_line (
resources(resource_1,resource_2,resource_3,resource_4),
sharding_column=ol_w_id,type(name=hash_mod,properties("sharding-count"=16)));
-- 表 item 没有 warehouse id，取 i_id 作为分片键
create sharding table rule item (
resources(resource_1,resource_2,resource_3,resource_4),
sharding_column=i_id,type(name=hash_mod,properties("sharding-count"=16)));
create sharding table rule stock (
resources(resource_1,resource_2,resource_3,resource_4),
sharding_column=s_w_id,type(name=hash_mod,properties("sharding-count"=16)));
-- 创建绑定表规则
create sharding binding table rules (warehouse, customer);
create sharding binding table rules (stock, district, order_line);
```

### 4. 建表

```java
create table warehouse (
w_id smallint not null,
w_name varchar(10), 
w_street_1 varchar(20), 
w_street_2 varchar(20), 
w_city varchar(20), 
w_state char(2), 
w_zip char(9), 
w_tax decimal(4,2), 
w_ytd decimal(12,2),
primary key (w_id) );
create table district (
d_id tinyint not null, 
d_w_id smallint not null, 
d_name varchar(10), 
d_street_1 varchar(20), 
d_street_2 varchar(20), 
d_city varchar(20), 
d_state char(2), 
d_zip char(9), 
d_tax decimal(4,2), 
d_ytd decimal(12,2), 
d_next_o_id int,
primary key (d_w_id, d_id) );
create table customer (
c_id int not null, 
c_d_id tinyint not null,
c_w_id smallint not null, 
c_first varchar(16), 
c_middle char(2), 
c_last varchar(16), 
c_street_1 varchar(20), 
c_street_2 varchar(20), 
c_city varchar(20), 
c_state char(2), 
c_zip char(9), 
c_phone char(16), 
c_since datetime, 
c_credit char(2), 
c_credit_lim bigint, 
c_discount decimal(4,2), 
c_balance decimal(12,2), 
c_ytd_payment decimal(12,2), 
c_payment_cnt smallint, 
c_delivery_cnt smallint, 
c_data text,
PRIMARY KEY(c_w_id, c_d_id, c_id) );
create table history (
h_c_id int, 
h_c_d_id tinyint, 
h_c_w_id smallint,
h_d_id tinyint,
h_w_id smallint,
h_date datetime,
h_amount decimal(6,2), 
h_data varchar(24) );
create table new_orders (
no_o_id int not null,
no_d_id tinyint not null,
no_w_id smallint not null,
PRIMARY KEY(no_w_id, no_d_id, no_o_id));
create table orders (
o_id int not null, 
o_d_id tinyint not null, 
o_w_id smallint not null,
o_c_id int,
o_entry_d datetime,
o_carrier_id tinyint,
o_ol_cnt tinyint, 
o_all_local tinyint,
PRIMARY KEY(o_w_id, o_d_id, o_id) );
create table order_line ( 
ol_o_id int not null, 
ol_d_id tinyint not null,
ol_w_id smallint not null,
ol_number tinyint not null,
ol_i_id int, 
ol_supply_w_id smallint,
ol_delivery_d datetime, 
ol_quantity tinyint, 
ol_amount decimal(6,2), 
ol_dist_info char(24),
PRIMARY KEY(ol_w_id, ol_d_id, ol_o_id, ol_number) );
create table item (
i_id int not null, 
i_im_id int, 
i_name varchar(24), 
i_price decimal(5,2), 
i_data varchar(50),
PRIMARY KEY(i_id) );
create table stock (
s_i_id int not null, 
s_w_id smallint not null, 
s_quantity smallint, 
s_dist_01 char(24), 
s_dist_02 char(24),
s_dist_03 char(24),
s_dist_04 char(24), 
s_dist_05 char(24), 
s_dist_06 char(24), 
s_dist_07 char(24), 
s_dist_08 char(24), 
s_dist_09 char(24), 
s_dist_10 char(24), 
s_ytd decimal(8,0), 
s_order_cnt smallint, 
s_remote_cnt smallint,
s_data varchar(50),
PRIMARY KEY(s_w_id, s_i_id) );
```

此时每个底层库中共建了36张表。

### 5. 创建索引

```java
CREATE INDEX idx_customer ON customer (c_w_id,c_d_id,c_last,c_first);
CREATE INDEX idx_orders ON orders (o_w_id,o_d_id,o_c_id,o_id);
CREATE INDEX fkey_stock_2 ON stock (s_i_id);
CREATE INDEX fkey_order_line_2 ON order_line (ol_supply_w_id,ol_i_id);
```

## 三、测试

在172.18.16.156执行以下步骤：

### 1. 生成数据

```java
cd tpcc-mysql-master
./tpcc_load -h172.18.10.66 -P3307 -d sharding_db -u root -p "123456" -w 10
```

```java
# 在底层库验证数据分片
mysql -u wxy -h 172.18.10.66 -P 3306 -pmypass -e "select table_name,table_rows from information_schema.tables where table_schema in ('db1','db2') order by table_name;"
mysql -u wxy -h 172.18.18.102 -P 3306 -pmypass -e "select table_name,table_rows from information_schema.tables where table_schema in ('db1','db2') order by table_name;"
```

### 2. 执行测试

```java
./tpcc_start -h172.18.10.66 -P3307 -d sharding_db -u root -p "123456" -w 10 -c 32 -r 60 -l 300
***************************************
***easy### TPC-C Load Generator ***
***************************************
option h with value '172.18.10.66'
option P with value '3307'
option d with value 'sharding_db'
option u with value 'root'
option p with value '123456'
option w with value '10'
option c with value '32'
option r with value '60'
option l with value '300'
<Parameters>
     [server]: 172.18.10.66
     [port]: 3307
     [DBname]: sharding_db
       [user]: root
       [pass]: 123456
  [warehouse]: 10
 [connection]: 32
     [rampup]: 60 (sec.)
    [measure]: 300 (sec.)
RAMP-UP TIME.(60 sec.)
MEASURING START.
  10, trx: 3062, 95%: 111.463, 99%: 189.563, max_rt: 711.993, 3069|651.786, 306|217.951, 309|776.611, 303|592.028
  20, trx: 3022, 95%: 110.037, 99%: 199.638, max_rt: 391.838, 3015|310.603, 303|73.809, 303|668.539, 304|428.889
  30, trx: 2963, 95%: 116.442, 99%: 202.770, max_rt: 311.041, 2965|268.137, 295|60.957, 296|522.173, 295|257.502
  40, trx: 3048, 95%: 111.430, 99%: 165.624, max_rt: 313.213, 3046|297.311, 306|86.424, 300|413.657, 307|277.432
  50, trx: 3013, 95%: 112.468, 99%: 181.131, max_rt: 268.876, 3020|248.877, 301|86.293, 303|365.797, 300|270.426
  60, trx: 2900, 95%: 123.515, 99%: 218.853, max_rt: 315.579, 2891|287.822, 289|80.036, 291|464.209, 290|268.983
  70, trx: 2959, 95%: 119.015, 99%: 217.808, max_rt: 410.160, 2967|306.270, 297|166.883, 296|598.515, 295|317.983
  80, trx: 2996, 95%: 120.340, 99%: 188.488, max_rt: 294.824, 2993|261.048, 299|115.812, 297|445.097, 300|256.325
  90, trx: 2896, 95%: 114.678, 99%: 208.556, max_rt: 409.167, 2901|507.539, 290|218.929, 291|666.638, 290|359.124
 100, trx: 3017, 95%: 114.816, 99%: 183.039, max_rt: 348.340, 2998|300.141, 301|43.226, 305|441.041, 302|273.250
 110, trx: 2999, 95%: 109.676, 99%: 155.068, max_rt: 338.924, 3014|290.687, 301|152.292, 296|409.574, 299|307.160
 120, trx: 2987, 95%: 112.536, 99%: 196.613, max_rt: 376.467, 2984|403.399, 298|33.264, 301|476.778, 298|269.229
 130, trx: 3075, 95%: 102.379, 99%: 182.382, max_rt: 268.987, 3073|325.951, 308|24.234, 308|444.558, 309|291.164
 140, trx: 2990, 95%: 109.544, 99%: 171.065, max_rt: 303.076, 2998|298.628, 299|61.614, 296|427.772, 300|260.419
 150, trx: 3008, 95%: 114.609, 99%: 172.660, max_rt: 317.678, 2996|252.899, 300|69.993, 303|448.189, 301|271.076
 160, trx: 2997, 95%: 118.340, 99%: 200.656, max_rt: 354.310, 2999|341.182, 300|35.762, 299|430.661, 299|266.809
 170, trx: 2926, 95%: 116.617, 99%: 211.701, max_rt: 501.076, 2937|329.547, 293|122.047, 291|641.033, 293|264.955
 180, trx: 3080, 95%: 104.672, 99%: 175.421, max_rt: 293.909, 3067|235.559, 307|62.325, 308|558.521, 308|262.407
 190, trx: 3030, 95%: 108.793, 99%: 169.232, max_rt: 270.285, 3043|205.226, 304|23.850, 303|477.463, 302|262.811
 200, trx: 2975, 95%: 108.403, 99%: 191.961, max_rt: 328.167, 2967|313.387, 296|109.531, 296|448.603, 297|296.855
 210, trx: 2970, 95%: 123.257, 99%: 198.328, max_rt: 351.876, 2973|275.930, 299|100.404, 302|382.861, 298|281.152
 220, trx: 3013, 95%: 114.233, 99%: 181.239, max_rt: 296.523, 3006|369.986, 300|112.732, 297|401.169, 301|313.082
 230, trx: 2996, 95%: 108.630, 99%: 168.524, max_rt: 283.116, 2989|256.835, 300|144.143, 303|469.823, 302|280.525
 240, trx: 3021, 95%: 111.363, 99%: 176.264, max_rt: 251.433, 3038|261.560, 303|58.479, 300|478.107, 300|253.895
 250, trx: 3100, 95%: 100.256, 99%: 160.451, max_rt: 228.671, 3096|273.776, 309|36.466, 312|397.942, 308|242.824
 260, trx: 2980, 95%: 114.712, 99%: 188.149, max_rt: 264.282, 2976|258.548, 299|45.803, 299|569.312, 300|265.342
 270, trx: 2957, 95%: 119.479, 99%: 203.195, max_rt: 317.772, 2957|287.913, 295|85.910, 294|434.697, 297|328.697
 280, trx: 2941, 95%: 117.036, 99%: 237.063, max_rt: 359.832, 2947|395.890, 294|80.413, 295|552.508, 292|278.432
 290, trx: 2997, 95%: 113.960, 99%: 186.691, max_rt: 359.951, 2995|260.096, 299|35.765, 296|551.468, 300|266.878
 300, trx: 3023, 95%: 114.164, 99%: 196.613, max_rt: 293.087, 3019|446.366, 303|138.081, 306|409.839, 301|291.629
STOPPING THREADS................................
<Raw Results>
  [0] sc:0 lt:89941  rt:0  fl:0 avg_rt: 63.7 (5)
  [1] sc:895 lt:89044  rt:0  fl:0 avg_rt: 25.5 (5)
  [2] sc:5709 lt:3285  rt:0  fl:0 avg_rt: 6.5 (5)
  [3] sc:2498 lt:6498  rt:0  fl:0 avg_rt: 176.2 (80)
  [4] sc:0 lt:8991  rt:0  fl:0 avg_rt: 204.6 (20)
 in 300 sec.
<Raw Results2(sum ver.)>
  [0] sc:0  lt:89941  rt:0  fl:0 
  [1] sc:895  lt:89045  rt:0  fl:0 
  [2] sc:5709  lt:3285  rt:0  fl:0 
  [3] sc:2498  lt:6498  rt:0  fl:0 
  [4] sc:0  lt:8991  rt:0  fl:0 
<Constraint Check> (all must be [OK])
 [transaction percentage]
        Payment: 43.48% (>=43.0%) [OK]
   Order-Status: 4.35% (>= 4.0%) [OK]
       Delivery: 4.35% (>= 4.0%) [OK]
    Stock-Level: 4.35% (>= 4.0%) [OK]
 [response time (at least 90% passed)]
      New-Order: 0.00%  [NG] *
        Payment: 1.00%  [NG] *
   Order-Status: 63.48%  [NG] *
       Delivery: 27.77%  [NG] *
    Stock-Level: 0.00%  [NG] *
<TpmC>
                 17988.199 TpmC
```
