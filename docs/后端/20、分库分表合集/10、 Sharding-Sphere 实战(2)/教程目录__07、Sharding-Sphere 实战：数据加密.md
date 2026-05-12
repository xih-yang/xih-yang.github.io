# 07、Sharding-Sphere 实战：数据加密
- 来源：https://ddkk.com/zhuanlan/sharding/shardingsphere/2/7.html
- 分类：分库分表
- 分组：教程目录
## 一、功能详解

### 1. 背景

安全控制一直是治理的重要环节，数据加密属于安全控制的范畴。无论对互联网公司还是传统行业来说，数据安全一直是极为重视和敏感的话题。数据加密是指对某些敏感信息通过加密规则进行数据的变形，实现敏感隐私数据的可靠保护。涉及客户安全数据或者一些商业性敏感数据，如身份证号、手机号、卡号、客户号等个人信息按照相关部门规定，都需要进行数据加密。

对于数据加密的需求，在现实的业务场景中一般分为两种情况：

**1、** 新业务上线，安全部门规定需将涉及用户敏感信息，例如银行、手机号码等进行加密后存储到数据库，在使用的时候再进行解密处理因为是全新系统，没有存量数据清洗问题，所以实现相对简单；

**2、** 已上线业务，之前一直将明文存储在数据库中相关部门突然需要对已上线业务进行加密整改这种场景一般需要处理三个问题：；

- 历史数据需要如何进行加密处理，即洗数。
- 如何能在不改动业务 SQL 和逻辑情况下，将新增数据进行加密处理，并存储到数据库；在使用时，再进行解密取出。
- 如何较为安全、无缝、透明化地实现业务系统在明文与密文数据间的迁移。

在真实业务场景中，相关业务开发团队则往往需要针对公司安全部门需求，自行实行并维护一套加解密系统。而当加密场景发生改变时，自行维护的加密系统往往又面临着重构或修改风险。此外，对于已经上线的业务，在不修改业务逻辑和 SQL 的情况下，透明化、安全低风险地实现无缝进行加密改造也相对复杂。

根据业界对加密的需求及业务改造痛点，提供了一套完整、安全、透明化、低改造成本的数据加密整合解决方案，是 ShardingSphere 数据加密模块的主要设计目标。

### 2. 核心概念

- 逻辑列：用于计算加解密列的逻辑名称，是 SQL 中列的逻辑标识。逻辑列包含密文列（必须）、查询辅助列（可选）和明文列（可选）。
- 密文列：加密后的数据列。
- 查询辅助列：用于查询的辅助列。对于一些安全级别更高的非幂等加密算法，提供不可逆的幂等列用于查询。
- 明文列：存储明文的列，用于在加密数据迁移过程中仍旧提供服务。在洗数结束后可以删除。

### 3. 使用规范

#### （1）支持项

- 对数据库表中某个或多个列进行加解密。
- 兼容所有常用 SQL。

#### （2）不支持项

- 需自行处理数据库中原始的存量数据。
- 加密字段无法支持查询不区分大小写功能。
- 加密字段无法支持比较操作，如：大于、小于、ORDER BY、BETWEEN、LIKE 等。
- 加密字段无法支持计算操作，如：AVG、SUM 以及计算表达式。

## 二、实现细节

### 1. 处理流程详解

ShardingSphere 通过对用户输入的 SQL 进行解析，并依据用户提供的加密规则对 SQL 进行改写，从而实现对原文数据进行加密，并将原文数据（可选）及密文数据同时存储到底层数据库。在用户查询数据时，它仅从数据库中取出密文数据，并对其解密，最终将解密后的原始数据返回给用户。ShardingSphere 自动化、透明化了数据加密过程，让用户无需关注数据加密的实现细节，像使用普通数据那样使用加密数据。此外，无论是已在线业务进行加密改造，还是新上线业务使用加密功能，ShardingSphere 都可以提供一套相对完善的解决方案。

### 2. 整体架构

加密模块将用户发起的 SQL 进行拦截，并通过 SQL 语法解析器进行解析，理解 SQL 行为，再依据用户传入的加密规则，找出需要加密的字段和所使用的加解密算法对目标字段进行加解密处理后，再与底层数据库进行交互。ShardingSphere 会将用户请求的明文进行加密后存储到底层数据库，并在用户查询时，将密文从数据库中取出进行解密后返回给终端用户。通过屏蔽对数据的加密处理，使用户无需感知解析 SQL、数据加密、数据解密的处理过程，就像在使用普通数据一样使用加密数据。

### 3. 加密规则

在详解整套流程之前，我们需要先了解下加密规则与配置，这是认识整套流程的基础。加密配置主要分为四部分：数据源配置、加密算法配置、加密表配置以及查询属性配置，其详情如下图所示。

- 数据源配置：指数据源配置。
- 加密算法配置：指使用什么加密算法进行加解密。目前 ShardingSphere 内置了五种加解密算法：AES、MD5、RC4、SM3 和 SM4。用户还可以通过实现 ShardingSphere 提供的接口，自行实现一套加解密算法。
- 加密表配置：用于告诉 ShardingSphere 数据表里哪个列用于存储密文数据（cipherColumn）、使用什么算法加解密（encryptorName）、哪个列用于存储辅助查询数据（assistedQueryColumn）、使用什么算法加解密（assistedQueryEncryptorName）、哪个列用于存储明文数据（plainColumn）以及用户想使用哪个列进行 SQL 编写（logicColumn）。
- 查询属性的配置：当底层数据库表里同时存储了明文数据、密文数据后，该属性开关用于决定是直接查询数据库表里的明文数据进行返回，还是查询密文数据通过 ShardingSphere 解密后返回。该属性开关支持表级别和整个规则级别配置，表级别优先级最高。

如何理解“用户想使用哪个列进行 SQL 编写（logicColumn）”？我们可以从加密模块存在的意义来理解。加密模块最终目的是希望屏蔽底层对数据的加密处理，也就是说我们不希望用户知道数据是如何被加解密的，如何将明文数据存储到 plainColumn，将密文数据存储到 cipherColumn，将辅助查询数据存储到 assistedQueryColumn。 换句话说，我们不希望用户知道 plainColumn、cipherColumn 和 assistedQueryColumn 的存在和使用。

所以，我们需要给用户提供一个概念意义上的列，这个列可以脱离底层数据库的真实列。它可以是数据库表里的一个真实列，也可以不是，从而使得用户可以随意改变底层数据库的 plainColumn、cipherColumn 和 assistedQueryColumn 的列名；或者删除 plainColumn，选择永远不再存储明文，只存储密文。只要用户的 SQL 面向这个逻辑列进行编写，并在加密规则里给出 logicColumn 和 plainColumn、cipherColumn、assistedQueryColumn 之间正确的映射关系即可。

这样做是为了让已上线的业务能无缝、透明、安全地进行数据加密迁移。

### 4. 加密处理过程

举例说明，假如数据库里有一张表叫做 t_user，这张表里的 pwd_plain 字段用于存放明文数据，pwd_cipher 字段用于存放密文数据，pwd_assisted_query 字段用于存放辅助查询数据。同时定义 logicColumn 为 pwd。 那么，用户在编写 SQL 时应该面向 logicColumn 进行编写，即 INSERT INTO t_user SET pwd = '123'。ShardingSphere 接收到该 SQL，通过用户提供的加密配置，发现 pwd 是 logicColumn，于是便对逻辑列及其对应的明文数据进行加密处理。ShardingSphere 将面向用户的逻辑列与面向底层数据库的明文列和密文列进行了列名以及数据的加密映射转换，如下图所示。

即依据用户提供的加密规则，将用户 SQL 与底层数据表结构割裂开来，使得用户的 SQL 编写不再依赖于真实的数据库表结构。而用户与底层数据库之间的衔接、映射、转换交由 ShardingSphere 进行处理。

使用加密模块进行增删改查时，其中的处理流程和转换逻辑如下图所示。

### 5. 解决方案详解

在了解了 ShardingSphere 加密处理流程后，即可将加密配置、加密处理流程与实际场景进行结合。所有的设计开发都是为了解决业务场景遇到的痛点。那么面对之前提到的业务场景需求，又应该如何使用 ShardingSphere 这把利器来满足业务需求呢？

#### （1）新上线业务

- 业务场景分析：新上线业务由于一切从零开始，不存在历史数据清洗问题，所以相对简单。
- 解决方案说明：选择合适的加密算法，如 AES 后，只需配置逻辑列（面向用户编写 SQL ）和密文列（数据表存密文数据）即可，逻辑列和密文列可以相同也可以不同。建议配置如下（YAML 格式展示）：

```java
-!ENCRYPT
  encryptors:
    aes_encryptor:
      type: AES
      props:
        aes-key-value: 123456abc
  tables:
    t_user:
      columns:
        pwd:
          cipherColumn: pwd_cipher
          encryptorName: aes_encryptor
          assistedQueryColumn: pwd_assisted_query
          assistedQueryEncryptorName: pwd_assisted_query_cipher
          queryWithCipherColumn: true
```

使用这套配置， ShardingSphere 只需将 logicColumn 和 cipherColumn、assistedQueryColumn 进行转换，底层数据表不存储明文，只存储了密文，这也是安全审计部分的要求所在。如果用户希望将明文、密文一同存储到数据库，只需添加 plainColumn 配置即可。整体处理流程如下图所示：

#### （2）已上线业务改造

- 业务场景分析

由于业务已经在线上运行，数据库里必然存有明文历史数据。现在的问题是如何让历史数据得以加密清洗、如何让增量数据得以加密处理、如何让业务在新旧两套数据系统之间进行无缝、透明化迁移。

- 解决方案说明

在提供解决方案之前，我们先来头脑风暴一下。首先，既然是旧业务需要进行加密改造，那一定存储了非常重要且敏感的信息。这些信息含金量高且业务相对基础重要。不应该采用停止业务禁止新数据写入，再找个加密算法把历史数据全部加密清洗，再把之前重构的代码部署上线，使其能把存量和增量数据进行在线加密解密。

那么另一种相对安全的做法是：重新搭建一套和生产环境一模一样的预发环境，然后通过相关迁移洗数工具把生产环境的存量原文数据加密后存储到预发环境，而新增数据则通过例如 MySQL 主从复制及业务方自行开发的工具加密后存储到预发环境的数据库里，再把重构后可以进行加解密的代码部署到预发环境。这样生产环境是一套以明文为核心的查询修改的环境；预发环境是一套以密文为核心加解密查询修改的环境。在对比一段时间无误后，可以夜间操作将生产流量切到预发环境中。此方案相对安全可靠，只是时间、人力、资金、成本较高，主要包括：预发环境搭建、生产代码整改、相关辅助工具开发等。

业务开发人员最希望的做法是：减少资金费用的承担、最好不要修改业务代码、能够安全平滑迁移系统。于是，ShardingSphere 的加密功能模块便应运而生，可分为三步进行：

**1. 系统迁移前**

假设系统需要对 t_user 的 pwd 字段进行加密处理，业务方使用 ShardingSphere 来代替标准化的 JDBC 接口，此举基本不需要额外改造（ShardingSphere 还提供了 Spring Boot Starter、Spring 命名空间、YAML 等接入方式，满足不同业务方需求）。另外，提供一套如下所示的加密配置规则。

```java
-!ENCRYPT
  encryptors:
    aes_encryptor:
      type: AES
      props:
        aes-key-value: 123456abc
  tables:
    t_user:
      columns:
        pwd:
          plainColumn: pwd
          cipherColumn: pwd_cipher
          encryptorName: aes_encryptor
          assistedQueryColumn: pwd_assisted_query
          assistedQueryEncryptorName: pwd_assisted_query_cipher
          queryWithCipherColumn: false
```

依据上述加密规则可知，首先需要在数据库表 t_user 里新增一个字段叫做 pwd_cipher，即 cipherColumn，用于存放密文数据，同时我们把 plainColumn 设置为 pwd，用于存放明文数据，而把 logicColumn 也设置为 pwd。 由于之前的代码 SQL 就是使用 pwd 进行编写，即面向逻辑列进行 SQL 编写，所以业务代码无需改动。通过 ShardingSphere，针对新增的数据，会把明文写到 pwd 列，并同时把明文进行加密存储到 pwd_cipher 列。 此时，由于 queryWithCipherColumn 设置为 false，对业务应用来说，依旧使用 pwd 这一明文列进行查询存储，却在底层数据库表 pwd_cipher 上额外存储了新增数据的密文数据，其处理流程如下图所示。

新增数据在插入时，就通过 ShardingSphere 加密为密文数据，并被存储到了 cipherColumn。而现在就需要处理历史明文存量数据。由于 ShardingSphere 目前并未提供相关迁移洗数工具，此时需要业务方自行将 pwd 中的明文数据进行加密处理存储到 pwd_cipher。

**2. 系统迁移中**

新增的数据已被 ShardingSphere 将密文存储到密文列，明文存储到明文列；历史数据被业务方自行加密清洗后，将密文也存储到密文列。也就是说现在的数据库里既存放着明文也存放着密文，只是由于配置项中的 queryWithCipherColumn = false，所以密文一直没有被使用过。 现在我们为了让系统能切到密文数据进行查询，需要将加密配置中的 queryWithCipherColumn 设置为 true。 在重启系统后，系统业务一切正常，但是 ShardingSphere 已经开始从数据库里取出密文列的数据，解密后返回给用户； 而对于用户的增删改需求，则依旧会把原文数据存储到明文列，加密后密文数据存储到密文列。

虽然现在业务系统通过将密文列的数据取出，解密后返回，但是，在存储的时候仍旧会存一份原文数据到明文列，这是为什么呢？答案是：为了能够进行系统回滚。因为只要密文和明文永远同时存在，我们就可以通过开关项配置自由将业务查询切换到 cipherColumn 或 plainColumn。也就是说，如果将系统切到密文列进行查询时，发现系统报错，需要回滚，那么只需将 queryWithCipherColumn = false，ShardingSphere 将会还原，即又重新开始使用 plainColumn 进行查询。处理流程如下图所示：

**3. 系统迁移后**

由于安全审计部门要求，业务系统一般不可能让数据库的明文列和密文列永久同步保留，我们需要在系统稳定后将明文列数据删除。即我们需要在系统迁移后将 plainColumn，即 pwd 进行删除。那问题来了，现在业务代码都是面向 pwd 进行编写 SQL 的，把底层数据表中的存放明文的 pwd 删除了， 换用 pwd_cipher 进行解密得到原文数据，那岂不是意味着业务方需要整改所有 SQL，从而不使用即将要被删除的 pwd 列？还记得 ShardingSphere 的核心意义所在吗？即依据用户提供的加密规则，将用户 SQL 与底层数据库表结构割裂开来，使得用户的 SQL 编写不再依赖于真实的数据库表结构。用户与底层数据库之间的衔接、映射、转换交由 ShardingSphere 进行处理。

因为有logicColumn 存在，用户的编写 SQL 都面向这个虚拟列，ShardingSphere 就可以把这个逻辑列和底层数据表中的密文列进行映射转换。于是迁移后的加密配置即为：

```java
-!ENCRYPT
  encryptors:
    aes_encryptor:
      type: AES
      props:
        aes-key-value: 123456abc
  tables:
    t_user:
      columns:
        pwd: pwd 与 pwd_cipher 的转换映射
          cipherColumn: pwd_cipher
          encryptorName: aes_encryptor
          assistedQueryColumn: pwd_assisted_query
          assistedQueryEncryptorName: pwd_assisted_query_cipher
          queryWithCipherColumn: true
```

其处理流程如下：

**4. 系统迁移完成**

安全审计部门再要求，业务系统需要定期或某些紧急安全事件触发修改密钥，我们需要再次进行迁移洗数，即使用旧密钥解密后再使用新密钥加密。既要又要还要的问题来了，明文列数据已删除，数据库表中数据量千万级，迁移洗数需要一定时间，迁移洗数过程中密文列在变化，系统还需正确提供服务。怎么办？答案是：辅助查询列。因为辅助查询列一般使用不可逆的 MD5 和 SM3 等算法，基于辅助列进行查询，即使在迁移洗数过程中，系统也是可以提供正确服务。

至此，已在线业务加密整改解决方案全部叙述完毕。ShardingSphere 提供了 Java、YAML、Spring Boot Starter、Spring 命名空间多种方式供用户选择接入，力求满足业务不同的接入需求。

### 6. 中间件加密服务优势

- 自动化 & 透明化数据加密过程，用户无需关注加密中间实现细节。
- 提供多种内置、第三方（AKS）的加密算法，用户仅需简单配置即可使用。
- 提供加密算法 API 接口，用户可实现接口，从而使用自定义加密算法进行数据加密。
- 支持切换不同的加密算法。
- 针对已上线业务，可实现明文数据与密文数据同步存储，并通过配置决定使用明文列还是密文列进行查询。可实现在不改变业务查询 SQL 前提下，已上线系统对加密前后数据进行安全、透明化迁移。

### 7. 加密算法解析

ShardingSphere 提供了加密算法用于数据加密，即 EncryptAlgorithm。一方面，ShardingSphere 为用户提供了内置的加解密实现类，用户只需进行配置即可使用；另一方面，为了满足用户不同场景的需求，ShardingSphere 还开放了相关加解密接口，用户可依据这两种类型的接口提供具体实现类。再进行简单配置，即可让 ShardingSphere 调用用户自定义的加解密方案进行数据加密。

EncryptAlgorithm 解决方案通过提供 encrypt()、decrypt() 两种方法对需要加密的数据进行加解密。在用户进行 INSERT、DELETE、UPDATE 时，ShardingSphere 会按照用户配置，对 SQL 进行解析、改写、路由，并调用 encrypt() 将数据加密后存储到数据库，而在 SELECT 时，则调用 decrypt() 方法将从数据库中取出的加密数据进行逆向解密，最终将原始数据返回给用户。

当前，ShardingSphere 针对这种类型的加密解决方案提供了五种具体实现类，分别是 MD5（不可逆）、AES（可逆）、RC4（可逆）、SM3（不可逆）、SM4（可逆），用户只需配置即可使用这五种内置的方案。

## 三、用例测试

需求：使用 ShardingSphere 对t_user表的pwd列进行加密处理，要求对应用透明，并尽量缩短业务影响时间。

**注意：ShardingSphere 5.1.1 的数据加密模块需要使用JDK 8，用JDK 17报错：**

```java
Exception in thread "ShardingSphere-Command-16" java.lang.NoClassDefFoundError: javax/xml/bind/DatatypeConverter
```

### 1. 准备测试用例环境

在172.18.26.198:3306数据库实例上执行：

```java
drop database if exists encrypt_db;
create database encrypt_db;
use encrypt_db;
create table t_user (id bigint auto_increment primary key, pwd varchar(50));
insert into t_user(pwd) values ('Hlws5Mb18XIeYZvs'),('fRV$wtz5FMV8bwH9'),('%g&a5gEhP^KN3zZU');
```

### 2. 执行数据加密

连接Proxy：

```java
mysql -u root -h 172.18.10.66 -P 3307 -p123456
```

#### （1）创建逻辑库

```java
drop database if exists encrypt_db;
create database encrypt_db;
use encrypt_db;
```

#### （2）添加资源

```java
mysql> add resource resource_source (host=172.18.26.198, port=3306, db=encrypt_db, user=wxy, password=mypass);
Query OK, 0 rows affected (0.04 sec)
mysql> show schema resources\G
*************************** 1. row ***************************
                           name: resource_source
                           type: MySQL
                           host: 172.18.26.198
                           port: 3306
                             db: encrypt_db
connection_timeout_milliseconds: 30000
      idle_timeout_milliseconds: 60000
      max_lifetime_milliseconds: 2100000
                  max_pool_size: 50
                  min_pool_size: 1
                      read_only: false
               other_attributes: {"dataSourceProperties":{"maintainTimeStats":"false","rewriteBatchedStatements":"true","tinyInt1isBit":"false","cacheResultSetMetadata":"false","useServerPrepStmts":"true","netTimeoutForStreamingResults":"0","useSSL":"false","prepStmtCacheSqlLimit":"2048","elideSetAutoCommits":"true","cachePrepStmts":"true","serverTimezone":"UTC","zeroDateTimeBehavior":"round","prepStmtCacheSize":"200000","useLocalSessionState":"true","cacheServerConfiguration":"true"},"healthCheckProperties":{},"initializationFailTimeout":1,"validationTimeout":5000,"leakDetectionThreshold":0,"registerMbeans":false,"allowPoolSuspension":false,"autoCommit":true,"isolateInternalQueries":false}
1 row in set (0.01 sec)
```

#### （3）原表增加加密字段

```java
mysql> alter table t_user add pwd_cipher varchar(50);
Query OK, 0 rows affected (0.05 sec)
mysql> select * from t_user;
+----+------------------+------------+
| id | pwd              | pwd_cipher |
+----+------------------+------------+
|  1 | Hlws5Mb18XIeYZvs | NULL       |
|  2 | fRV$wtz5FMV8bwH9 | NULL       |
|  3 | %g&a5gEhP^KN3zZU | NULL       |
+----+------------------+------------+
3 rows in set (0.01 sec)
```

#### （4）创建加密规则

```java
mysql> create encrypt rule t_user (columns((name=pwd,plain=pwd,cipher=pwd_cipher,type(name=aes,properties('aes-key-value'='123456abc')))),query_with_cipher_column=false);
Query OK, 0 rows affected (0.61 sec)
mysql> show encrypt table rule t_user\G
*************************** 1. row ***************************
                   table: t_user
            logic_column: pwd
         logic_data_type: 
           cipher_column: pwd_cipher
        cipher_data_type: 
            plain_column: pwd
         plain_data_type: 
   assisted_query_column: 
assisted_query_data_type: 
          encryptor_type: aes
         encryptor_props: aes-key-value=123456abc
query_with_cipher_column: false
1 row in set (0.02 sec)
```

### 3. 测试

查询存量数据：

```java
mysql> preview select * from t_user where pwd='%g&a5gEhP^KN3zZU';
+------------------+----------------------------------------------------------------------------------------+
| data_source_name | actual_sql                                                                             |
+------------------+----------------------------------------------------------------------------------------+
| resource_source  | select t_user.id, t_user.pwd AS pwd from t_user where pwd='%g&a5gEhP^KN3zZU' |
+------------------+----------------------------------------------------------------------------------------+
1 row in set (0.17 sec)
mysql> select * from t_user where pwd='%g&a5gEhP^KN3zZU';
+----+------------------+
| id | pwd              |
+----+------------------+
|  3 | %g&a5gEhP^KN3zZU |
+----+------------------+
1 row in set (0.05 sec)
```

添加增量数据：

```java
mysql> insert into t_user(pwd) values ('123'),('456'),('789');
Query OK, 3 rows affected (0.17 sec)
```

查询：

```java
mysql> select * from t_user;
+----+------------------+
| id | pwd              |
+----+------------------+
|  1 | Hlws5Mb18XIeYZvs |
|  2 | fRV$wtz5FMV8bwH9 |
|  3 | %g&a5gEhP^KN3zZU |
|  4 | 123              |
|  5 | 456              |
|  6 | 789              |
+----+------------------+
6 rows in set (0.03 sec)
```

在MySQL里查询：

```java
mysql> select * from t_user;
+----+------------------+--------------------------+
| id | pwd              | pwd_cipher               |
+----+------------------+--------------------------+
|  1 | Hlws5Mb18XIeYZvs | NULL                     |
|  2 | fRV$wtz5FMV8bwH9 | NULL                     |
|  3 | %g&a5gEhP^KN3zZU | NULL                     |
|  4 | 123              | DZEHT99l6UjthceKuCCKIw== |
|  5 | 456              | 2uY82tVK909q01NgQ21/Ww== |
|  6 | 789              | 9tyPgiuAavrIGG2c4q+pPg== |
+----+------------------+--------------------------+
6 rows in set (0.00 sec)
```

### 4. 割接

（1）手工更新存量数据

**这一步不能使用MySQL完成，因为MySQL的AES函数的结果与 ShardingSphere 的不一样：**

```java
mysql> select *, to_base64(AES_ENCRYPT(pwd, "123456abc")) from t_user;
+----+------------------+--------------------------+----------------------------------------------+
| id | pwd              | pwd_cipher               | to_base64(AES_ENCRYPT(pwd, "123456abc"))     |
+----+------------------+--------------------------+----------------------------------------------+
|  1 | Hlws5Mb18XIeYZvs | NULL                     | yC81CxCh3To7XKkehDBY2DLWHCA31RdEiQCtSK1KgqQ= |
|  2 | fRV$wtz5FMV8bwH9 | NULL                     | 2xPXaMMndGl7I8CfQRVVwjLWHCA31RdEiQCtSK1KgqQ= |
|  3 | %g&a5gEhP^KN3zZU | NULL                     | l+PE+PZE55+94oDpoqt2OjLWHCA31RdEiQCtSK1KgqQ= |
|  4 | 123              | DZEHT99l6UjthceKuCCKIw== | LR3Zm3Bn6ANef7HMwBY5VQ==                     |
|  5 | 456              | 2uY82tVK909q01NgQ21/Ww== | BqiGFYCZJhBd2h1wtSK/eg==                     |
|  6 | 789              | 9tyPgiuAavrIGG2c4q+pPg== | DaBJtdtVqZKYXxTlDoEwoA==                     |
+----+------------------+--------------------------+----------------------------------------------+
6 rows in set (0.00 sec)
```

原因是MySQL默认使用的128位，加密方法为"ECB"，填充方法为"PKCS7"；Java默认使用的是128位，加密方式为"ECB"，填充方法为"PKCS5"。

（2）原数据库应用停写

（3）修改加密规则

```java
alter encrypt rule t_user (columns((name=pwd,cipher=pwd_cipher,type(name=aes,properties('aes-key-value'='123456abc')))),query_with_cipher_column=true);
```

（4）应用连接到Proxy访问数据库

（5）验证

```java
mysql> preview select * from t_user;
+------------------+------------------------------------------------------------------+
| data_source_name | actual_sql                                                       |
+------------------+------------------------------------------------------------------+
| resource_source  | select t_user.id, t_user.pwd_cipher AS pwd from t_user |
+------------------+------------------------------------------------------------------+
1 row in set (0.00 sec)
mysql> select * from t_user;
+----+------+
| id | pwd  |
+----+------+
|  1 | NULL |
|  2 | NULL |
|  3 | NULL |
|  4 | 123  |
|  5 | 456  |
|  6 | 789  |
+----+------+
6 rows in set (0.03 sec)
```
