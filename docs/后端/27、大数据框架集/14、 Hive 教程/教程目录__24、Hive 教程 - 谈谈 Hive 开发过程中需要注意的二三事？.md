# 24、Hive 教程 - 谈谈 Hive 开发过程中需要注意的二三事？
- 来源：https://ddkk.com/zhuanlan/bigdata/hive/2/24.html
- 分类：大数据框架
- 分组：教程目录
## 一、前言

主要讲讲一些 Hive 开发过程中需要注意的一些规范，大家可要注意┗|｀O′|┛ 嗷~~ 🚢

## 二、建表规范

Hive 分为内部表和外部表，一般情况，只允许建外部表，不建议使用内部表 ❗

### 2.1 LZO标准建表模板如下所示

```java
create EXTERNAL table app_sku_pur_attrib (
stat_dt string comment '统计日期' ,
ord_item_units double comment '下单商品件数',
valid_ord_qtty bigint comment '有效订单量' )
comment '商品采销属性'
PARTITIONED BY ( dt string )
ROW FORMAT SERDE 'org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe'
WITH SERDEPROPERTIES ( 'field.delim'='\t' )
STORED AS INPUTFORMAT "com.hadoop.mapred.DeprecatedLzoTextInputFormat"
OUTPUTFORMAT "org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat";
##建表时需要加上表注释、字段注释；
```

### 2.2 ORC标准建表模板如下所示

```java
create external table app_jdw_jmart_zbinfo_test_test(
capacity_all float comment '数据总容量PB',
deal_data_dt float comment '日处理数据量PB',
add_data_dt float comment '日新增数据量PB',
add_job_dt float comment '日运行job数W',
machine_num int comment '平台总机器数',
corejob_avgtime string comment '核心任务平均运行时长')
PARTITIONED BY ( week_nm string,dt string )
ROW FORMAT DELIMITED FIELDS TERMINATED BY '\t' (列分隔符)
NULL DEFINED AS "" (空值展示为"")
STORED AS ORC (存储格式为ORC，不可少)
LOCATION '*************' (指定表的location)
tblproperties ('orc.compress'='SNAPPY'); (ORC压缩格式为SNAPPY)
```

## 三、字段类型使用 Hive 标准字段

```java
**原生类型：**
    TINYINT
    SMALLINT
    INT
    BIGINT
    BOOLEAN
    FLOAT
    DOUBLE
    STRING
    BINARY (Hive 0.8.0以上才可用)
    TIMESTAMP (Hive 0.8.0以上才可用)
**复合类型：**
    arrays: ARRAY<data_type>
    maps: MAP<primitive_type, data_type>
    structs: STRUCT<col_name : data_type [COMMENT col_comment], ...>
    union: UNIONTYPE<data_type, data_type, ...>
```

## 四、数据类型标准

为了提高通用性，代码字段尽量不用数字型，建议多采用STRING类型；

日期类型字段由于格式多样，造成在信息加工处理过程中的格式转换复杂且易出错，因此对日期类型字段统一制定如下规范

以`“2013-01-01 13:35:23.71”` 为例说明日期字段类型规范内容。

## 五、HDFS 目录规范

### 5.1 表的 HDFS 目录与分区层级的名称和顺序保持一致

**正确：**

```java
表分区dt=update
Hdfs目录：hdfs://ns3/user/jd_ad/chenyanan/source_id_base64/dt=update
表分区：dt，dp
Hdfs目录：
hdfs://ns3/user/jd_ad/ad.db/ad_ads_swc_request_log/dt=20161104/dp=03
```

**错误：**

```java
表分区dt=update
hdfs目录：hdfs://ns3/user/jd_ad/chenyanan/source_id_base64/update
表分区：dt，dp
Hdfs目录：
hdfs://ns3/user/jd_ad/ad.db/ad_ads_swc_request_log/2016110403
```

### 5.2 表的 HDFS 目录中不能有特殊字符（只能包含字母、数字、=、-）

```java
错误：hdfs://ns3/user/jd_ad/ad.db/ad_base_model_click/dt=%22%22%22+ ht.data_day_str + %22%22%22，包含%符号
正确：hdfs://ns3/user/jd_ad/ad.db/ad_base_model_click/dt=222222
```
