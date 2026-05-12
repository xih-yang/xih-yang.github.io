# 18、Hadoop 教程 - Hadoop HDFS Transparent Encryption透明加密
- 来源：https://ddkk.com/zhuanlan/bigdata/hadoop/2/18.html
- 分类：大数据框架
- 分组：教程目录
## 1. HDFS明文存储弊端

HDFS 中的数据会以 block 的形式保存在各台数据节点的本地磁盘中，但这些 block 都是明文的，如果`在操作系统下，直接访问block所在的目录，通过Linux的cat命令是可以直接查看里面的内容的，而且是明文`。

下面我们直接去 DataNode 本地存储 block 的目录，直接查看 block 内容：

## 2. 背景和应用

### 2.1 常见的加密层级

- **应用层加密**
- 这是最安全也是最灵活的方式。加密内容最终由应用程序来控制，并且可以精确的反映用户的需求。但是，编写应用程序来实现加密一般都比较困难。
- **数据库层加密**
- 类似于应用程序加密。大多数数据库厂商都提供某种形式的加密，但是可能会有性能问题，另外比如说索引没办法加密。
- **文件系统层加密**
- 这种方式对性能影响不大，而且对应用程序是透明的，一般也比较容易实施。但是应用程序细粒度的要求策略，可能无法完全满足。
- **磁盘层加密**
- 易于部署和高性能，但是相当不灵活，只能防止用户从物理层面盗窃数据。

HDFS 的透明加密属于数据库层和文件系统层的加密。拥有不错的性能，且对于现有的应用程序是透明的。HDFS 加密可以防止在文件系统或之下的攻击，也叫操作系统级别的攻击（OS-level attacks）。操作系统和磁盘只能与加密的数据进行交互，因为数据已经被 HDFS 加密了。

### 2.2 应用场景

数据加密对于全球许多政府，金融和监管机构都是强制性的，以满足隐私和其他安全要求。例如，卡支付行业已采用 “支付卡行业数据安全标准”（PCI DSS）来提高信息安全性。其他示例包括美国政府的《联邦信息安全管理法案》（FISMA）和《健康保险可移植性和责任法案》（HIPAA）提出的要求。加密存储在HDFS中的数据可以帮助您的组织遵守此类规定。

## 3. 透明加密介绍

`HDFS透明加密`（Transparent Encryption）支持端到端的透明加密，启用以后，对于一些需要加密的 HDFS 目录里的文件可以实现透明的加密和解密，而不需要修改用户的业务代码。`端到端是指加密和解密只能通过客户端`。对于加密区域里的文件，HDFS 保存的即是加密后的文件，文件加密的秘钥也是加密的。让非法用户即使`从操作系统层面拷走文件，也是密文，没法查看`。

HDFS 透明加密具有以下功能特点：

- 只有 HDFS 客户端可以加密或解密数据。
- 密钥管理在 HDFS 外部。HDFS 无法访问未加密的数据或加密密钥。HDFS 的管理和密钥的管理是独立的职责，由不同的用户角色（HDFS 管理员，密钥管理员）承担，从而确保没有单个用户可以不受限制地访问数据和密钥。
- 操作系统和 HDFS 仅使用加密的 HDFS 数据进行交互，从而减轻了操作系统和文件系统级别的威胁。
- HDFS 使用高级加密标准计数器模式（AES-CTR）加密算法。AES-CTR 支持 128 位加密密钥（默认），或者在安装 Java Cryptography Extension（JCE）无限强度 JCE 时支持 256 位加密密钥。

## 4. 透明加密关键概念和架构

### 4.1 加密区域和密钥

HDFS 的透明加密有一个新的概念，`加密区域（the encryption zone）`。加密区域`是一个特殊的目录，写入文件的时候会被透明加密，读取文件的时候又会被透明解密`。

当加密区域被创建时，都会有一个`加密区域秘钥`（`EZ密钥`，encryption zone key）与之对应，EZ 密钥存储在 HDFS 外部的备份密钥库中。加密区域里的每个文件都有其自己加密密钥，叫做`数据加密秘钥`（`DEK`，data encryption key）。DEK 会使用其各自的加密区域的 EZ 密钥进行加密，以形成加密数据加密密钥（`EDEK`）HDFS 不会直接处理 DEK，HDFS 只会处理 EDEK。客户端会解密 EDEK，然后用后续的 DEK 来读取和写入数据。

关于 EZ 密钥、DEK、EDEK 三者关系如下所示：

### 4.2 Keystore和Hadoop KMS

存储`密钥（key）`的叫做`密钥库（keystore）`，将 HDFS 与外部企业级密钥库（keystore）集成是部署透明加密的第一步。这是因为密钥（key）管理员和 HDFS 管理员之间的职责分离是此功能的非常重要的方面。但是，大多数密钥库都不是为 Hadoop 工作负载所见的加密/解密请求速率而设计的。

为此，Hadoop 进行了一项新服务的开发，该服务称为`Hadoop密钥管理服务器（Key Management Server，简写KMS）`，该服务用作 HDFS 客户端与密钥库之间的代理。密钥库和 Hadoop KMS 相互之间以及与 HDFS 客户端之间都必须使用 Hadoop 的 KeyProvider API 进行交互。

KMS 主要有以下几个职责：

**1、** 提供访问保存的加密区域秘钥（EZkey）；

**2、** 生成EDEK，EDEK存储在NameNode上；

**3、** 为HDFS客户端解密EDEK；

### 4.3 访问加密区域内的文件

#### 4.3.1 写入加密文件过程

前提：创建 HDFS 加密区时会创建一个 HDFS 加密区（目录），同时会在 KMS 服务里创建一个 key 及其 EZ Key，及两者之间的关联。

**1、** Client向NN请求在HDFS某个加密区新建文件；

**2、** NN向KMS请求此文件的EDEK，KMS用对应的EZkey生成一个新的EDEK发送给NN;；

**3、** 这个EDEK会被NN写入到文件的metadata中；

**4、** NN发送EDEK给Client；

**5、** Client发送EDEK给KMS请求解密，KMS用对应的EZkey将EDEK解密为DEK发送给Client；

**6、** Client用DEK加密文件内容发送给datanode进行存储；

`DEK是加解密一个文件的密匙，而KMS里存储的EZ key是用来加解密所有文件的密匙（DEK）的密匙`。所以，EZ Key 是更为重要的数据，只在 KMS 内部使用（DEK 的加解密只在 KMS 内存进行），不会被传递到外面使用，而 HDFS 服务端只能接触到 EDEK，所以 HDFS 服务端也不能解密加密区文件。

#### 4.3.2 读取解密文件过程

读流程与写流程类型，区别就是 NN 直接读取加密文件元数据里的 EDEK 返回给客户端，客户端一样把 EDEK 发送给 KMS 获取 DEK。再对加密内容解密读取。

`EDEK的加密和解密完全在KMS上进行`。更重要的是，请求创建或解密 EDEK 的客户端永远不会处理 EZ 密钥。仅 KMS 可以根据要求使用 EZ 密钥创建和解密 EDEK。

## 5. KMS配置

### 5.1 关闭HDFS集群

在hadoop1 上执行`stop-dfs.sh`。

### 5.2 key密钥生成

```java
[hadoop@hadoop1 hadoop-3.3.1]$ keytool -genkey -alias 'itcast'
Enter keystore password:  
Re-enter new password: 
What is your first and last name?
  [Unknown]:  
What is the name of your organizational unit?
  [Unknown]:  
What is the name of your organization?
  [Unknown]:  
What is the name of your City or Locality?
  [Unknown]:  
What is the name of your State or Province?
  [Unknown]:  
What is the two-letter country code for this unit?
  [Unknown]:  
Is CN=Unknown, OU=Unknown, O=Unknown, L=Unknown, ST=Unknown, C=Unknown correct?
  [no]:  yes
Enter key password for <itcast>
	(RETURN if same as keystore password):  
Re-enter new password: 
```

### 5.3 配置kms-site.xml

配置文件路径：`/data/hadoop-3.3.1/etc/hadoop/kms-site.xml`

```java
<configuration>
	<!-- ${user.home}/kms.jks : 它会根据用户名来设定值，需要注意的：在前面执行keytool 命令的用户需要与后面执行kms.sh start是同一个用户。
	     	原因：keytool执行命令之后，会在当前用户的根目录下面生成一个配置文件： -->
	<property>
		<name>hadoop.kms.key.provider.uri</name>
		<value>jceks://file@/${user.home}/kms.jks</value>
	</property>
	<property>
		<name>hadoop.security.keystore.java-keystore-provider.password-file</name>
		<value>kms.keystore.password</value>
	</property>
	<property>
		 <name>dfs.encryption.key.provider.uri</name>
		 <value>kms://http@192.168.68.101:16000/kms</value>
	</property>
	<property>
		<name>hadoop.kms.authentication.type</name>
		<value>simple</value>
	</property>
</configuration>
```

KMS 访问 java 密钥库的密码文件需配置在 Hadoop 的配置目录下：

### 5.4 kms-env.sh

```java
export KMS_HOME=/data/hadoop-3.3.1
export KMS_LOG=${KMS_HOME}/logs/kms
export KMS_HTTP_PORT=16000
export KMS_ADMIN_PORT=16001
```

### 5.5 修改core|hdfs-site.xml

**core-site.xml**

```java
<property>
	<name>hadoop.security.key.provider.path</name>
	<value>kms://http@192.168.68.101:16000/kms</value>
</property>
```

**hdfs-site.xml**

```java
<property>
	<name>dfs.encryption.key.provider.uri</name>
	<value>kms://http@192.168.68.101:16000/kms</value>
</property>
```

同步配置文件：

```java
scp core-site.xml hadoop@192.168.68.102:$PWD
scp core-site.xml hadoop@192.168.68.103:$PWD
scp hdfs-site.xml hadoop@192.168.68.102:$PWD
scp hdfs-site.xml hadoop@192.168.68.103:$PWD
scp kms-site.xml hadoop@192.168.68.102:$PWD
scp kms-site.xml hadoop@192.168.68.103:$PWD
scp kms-env.sh hadoop@192.168.68.102:$PWD
scp kms-env.sh hadoop@192.168.68.103:$PWD
```

### 5.6 服务启动

#### 5.6.1 KMS服务启动

```java
hadoop --daemon start kms
```

#### 5.6.2 HDFS集群启动

`start-dfs.sh`

## 6. 透明加密使用

### 6.1 创建key

切换为普通用户`test`操作：

```java
su test
hadoop key create itcast 
hadoop key list -metadata
```

### 6.2 创建加密区

使用`hadoop`用户操作：

```java
＃创建一个新的空目录，并将其设置为加密区域
hadoop fs -mkdir /zone 
hdfs crypto -createZone -keyName itcast -path /zone
```

```java
＃将其chown给普通用户
hadoop fs -chown test:test /zone
```

### 6.3 测试加密效果

以普通用户操作：

```java
＃以普通用户的身份放入文件，然后读出来
echo helloitcast >> helloWorld
hadoop fs -put helloWorld /zone 
hadoop fs -cat /zone /helloWorld 
＃作为普通用户，从文件获取加密信息
hdfs crypto -getFileEncryptionInfo -path /zone/helloWorld 
```

直接下载文件的 block，发现是无法读取数据的。
