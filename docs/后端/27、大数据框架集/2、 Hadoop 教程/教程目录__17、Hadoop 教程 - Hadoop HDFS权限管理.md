# 17、Hadoop 教程 - Hadoop HDFS权限管理
- 来源：https://ddkk.com/zhuanlan/bigdata/hadoop/2/17.html
- 分类：大数据框架
- 分组：教程目录
## 1. 总览概述

作为分布式文件系统，HDFS 也集成了一套兼容 POSIX 的权限管理系统。客户端在进行每次文件操时，系统会从`用户身份认证`和`数据访问授权`两个环节进行验证： 客户端的操作请求会首先通过本地的用户身份验证机制来获得 “凭证”（类似于身份证书），然后系统根据此 “凭证” 分辨出合法的用户名，再据此查看该用户所访问的数据是否已经授权。一旦这个流程中的某个环节出现异常，客户端的操作请求便会失败。

## 2. UGO权限管理

### 2.1 介绍

HDFS 的文件权限与 Linux/Unix 系统的 UGO 模型类型类似，可以简单描述为：每个文件和目录都与一个所有者和一个组相关联。该文件或目录对作为`所有者（USER）`的用户，作为该`组成员的其他用户（GROUP）`以及对所有`其他用户（OTHER）`具有单独的权限。

在HDFS 中，对于文件，需要`r`权限才能读取文件，而`w`权限才能写入或追加到文件。没有`x`可执行文件的概念。

对于目录，需要`r`权限才能列出目录的内容，需要`w`权限才能创建或删除文件或目录，并且需要`x`权限才能访问目录的子级。

### 2.2 umask权限掩码

Linux 中`umask可用来设定权限掩码`。权限掩码是由 3 个八进制的数字所组成，将`现有的存取权限减掉权限掩码后，即可产生建立文件时预设的权限`。

与Linux/Unix 系统类似，HDFS 也提供了 umask 掩码，用于设置在 HDFS 中`默认新建的文件和目录权限位`。默认 umask 值有属性`fs.permissions.umask-mode`指定，默认值 022。

创建文件和目录时使用的 umask，默认的权限就是：777-022=755。也就是`drwxr-xr-x`。

### 2.3 UGO权限相关命令

`hadoop fs -chmod 750 /user/itcast/foo`，变更目录或文件的权限位

`hadoop fs -chown :portal /user/itcast/foo`，变更目录或文件的属主或用户组

`hadoop fs -chgrp itcast _group1 /user/itcast/foo`，变更用户组

需要注意的是，使用这个命令的用户必须是超级用户，或者是该文件的属主，同时也是该用户组的成员。

### 2.4 Web页面修改UGO权限

Hadoop3.0 之后，支持在 HDFS Web 页面上使用鼠标修改。

粘滞位（Sticky bit）用法在目录上设置，如此以来，只有目录内文件的所有者或者`root`才可以删除或移动该文件。如果不为目录设置粘滞位，任何具有该目录写和执行权限的用户都可以删除和移动其中的文件。实际应用中，`粘滞位一般用于/tmp目录，以防止普通用户删除或移动其他用户的文件`。

## 3. 用户身份认证

用户身份认证独立于 HDFS 之外，也就说 HDFS 并不负责用户身份合法性检查，但 HDFS 会通过相关接口来获取相关的用户身份，然后用于后续的权限管理。用户是否合法，完全取决于集群使用认证体系。目前社区支持两种身份认证，即`简单认证（Simple）`和`Kerberos`。模式由`hadoop.security.authentication`属性指定，默认`simple`。

### 3.1 Simple认证

`基于客户端所在的Linux/Unix系统的登录用户名来进行认证`。只要用户能正常登录就认证成功。客户端与 NameNode 交互时，会将用户的登录账号（通过类似 whoami 的命令来获取）作为合法用户名传递至 Namenode。 这意味着使用不同的账号登录到同一个客户端，会产生不同的用户名，故在多租户条件这种认证会导致权限混淆；同时恶意用户也可以伪造其他人的用户名非法获得相应的权限，对数据安全造成极大的隐患。线上生产环境一般不会使用。simple 认证时，HDFS 想法是：防止好人误做坏事，不防止坏人做坏事。

### 3.2 Kerberos认证

在神话里，Kerberos 是 Cerberus 的希腊语，是一只守护地狱入口的三头巨犬，它确保没有人能在进入地狱后离开。

从技术角度来说，Kerberos 是麻省理工学院（MIT）开发的一种`网络身份认证协议`。它旨在通过`使用密钥加密技术为客户端/服务器应用程序提供强身份验证`。

## 4. Group Mapping组映射

在用户身份验证成功之后，接下来会检查该用户所拥有的权限。HDFS 的文件权限也是采用 UGO 模型，分成用户、组和其他权限。但与 Linux/Unix 系统不同，HDFS 的用户和组都是使用字符串存储的，在 Linux/Unix 上通用的 UID 和 GID 是无法在 HDFS 使用的。

此外，`HDFS的组`需要通过`外部的用户组关联（Group Mapping）服务来获取`。用户到组的映射可以使用系统自带的方案（使用 NameNode 服务器上的用户组系统），也可以通过其他实现类似功能的插件（LDAP、Ranger等）方式来代替。在拿到用户名后，NameNode 会通过用户组关联服务获取该用户所对应的用户组列表，并用于后期的用户组权限校验。下面是两种主要的实现方式 。

### 4.1 基于Linux/Unix系统的用户和用户组

Linux/Unix 系统上的用户和用户组信息存储在`/etc/passwd`和`/etc/group`文件中。默认情况下，HDFS 会通过调用外部的 Shell 命令来获取用户的所有用户组列表。 此方案的优点在于组映射服务十分稳定，不易受外部服务的影响。但是用户和用户组管理涉及到`root`权限等，同时会在服务器上生成大量的用户组，后续管理，特别是自动化运维方面会有较大影响。

### 4.2 基于使用LDAP协议的数据库

OpenLDAP 是一个开源 LDAP 的数据库，通过 phpLDAPadmin 等管理工具或相关接口可以方便地添加用户和修改用户组。HDFS 可以使用 LdapGroupsMappings 来使用 LDAP 服务。通过配置 LDAP 的相关属性，可以通过接口来直接获取到某个用户所有的用户组列表（memberOf）。 使用 LDAP 的不足在于需要保障 LDAP 服务的可用性和性能，关于 LDAP 的管理和使用将会后续再作介绍。 不同的 LDAP 有不同的实现，需要使用不同类型的 LDAP Schema 来构建，譬如示例中使用的是 Person 和 GroupOfNames 类型而不是 PosixAccount 和 PosixGroup 类型 以下是开启 LDAP 关联的配置文件：

```java
<property>
    <name>hadoop.security.group.mapping</name>
    <value>org.apache.hadoop.security.LdapGroupsMapping</value>
</property>
<property>
    <name>hadoop.security.group.mapping.ldap.bind.user</name>
    <value>cn=Manager,dc=hadoop,dc=apache,dc=org</value>
</property>
<property>
    <name>hadoop.security.group.mapping.ldap.bind.password</name>
    <value>hadoop</value>
</property>
<property>
    <name>hadoop.security.group.mapping.ldap.url</name>
    <value>ldap://localhost:389/dc=hadoop,dc=apache,dc=org</value>
</property>
<property>
    <name>hadoop.security.group.mapping.ldap.url</name>
    <value>ldap://localhost:389/dc=hadoop,dc=apache,dc=org</value>
</property>
<property>
    <name>hadoop.security.group.mapping.ldap.base</name>
    <value></value>
</property>
<property>
    <name>hadoop.security.group.mapping.ldap.search.filter.user</name>
    <value>(&(|(objectclass=person)(objectclass=applicationProcess))(cn={0}))</value>
</property>
<property>
    <name>hadoop.security.group.mapping.ldap.search.filter.group</name>
    <value>(objectclass=groupOfNames)</value>
</property>
<property>
    <name>hadoop.security.group.mapping.ldap.search.attr.member</name>
    <value>member</value>
</property>
<property>
    <name>hadoop.security.group.mapping.ldap.search.attr.group.name</name>
    <value>cn</value>
</property>
```

## 5. ACL权限管理

### 5.1 背景和介绍

在UGO 权限中，用户对文件只有三种身份，就是属主（user）、属组（group）和其他人（other）：每种用户身份拥有读（read）、写（write）和执行（execute）三种权限。但是在实际工作中，使用 UGO 来控制权限可以满足大部分场景下的数据安全性要求，但是对于一些复杂的权限需求则无能为力。

文件系统根目录中有一个`/project`目录，这是班级的项目目录。班级中的每个学员都可以访问和修改这个目录，老师也需要对这个目录拥有访问和修改权限，其他班级的学员当然不能访问这个目录。需要怎么规划这个目录的权限呢？应该这样：老师使用 root 用户，作为这个目录的属主，权限为 rwx；班级所有的学员都加入 tgroup 组，使 tgroup 组作为`/project`目录的属组，权限是 rwx；其他人的权限设定为 0。这样这个目录的权限就可以符合我们的项目开发要求了。

有一天，班里来了一位试听的学员 st，她必须能够访问`/project`目录，所以必须对这个目录拥有 r 和 x 权限；但是她又没有学习过以前的课程，所以不能赋予她 w 权限，怕她改错了目录中的内容，所以学员 st 的权限就是 r-x。可是如何分配她的身份呢？变为属主？当然不行，要不 root 该放哪里？加入 tgroup 组？也不行，因为 tgroup 组的权限是 rwx，而我们要求学员 st 的权限是 r-x。如果把其他人的权限改为 r-x 呢？这样一来，其他班级的所有学员都可以访问`/project`目录了。

当出现这种情况时，普通权限中的三种身份就不够用了。ACL 权限就是为了解决这个问题的。在使用 ACL 权限给用户 st 陚予权限时，st 既不是`/project`目录的属主，也不是属组，仅仅赋予用户 st 针对此目录的 r-x 权限。

`ACL`是Access Control List（访问控制列表）的缩写，ACL提供了一种方法，可以`为特定的用户或组设置不同的权限，而不仅仅是文件的所有者和文件的组`。

### 5.2 ACL Shell命令

`hadoop fs -getfacl [-R] `

显示文件和目录的访问控制列表（ACL）。如果目录具有默认 ACL，则 getfacl 还将显示默认 ACL。

`hadoop fs [generic options] -setfacl [-R] [{-b|-k} {-m|-x } ]|[--set  ]`

设置文件和目录的访问控制列表（ACL）。

`hadoop fs -ls `

ls 的输出将在带有 ACL 的任何文件或目录的权限字符串后附加一个 ‘+’ 字符。

### 5.3 ACL操作实战

hadoop 用户创建文件夹：`hadoop fs -mkdir /itheima`

此时使用普通用户 test 去操作`/itheima`，发现没有`w`权限

```java
[test@hadoop1 ~]$ echo 1 >> 1.txt
[test@hadoop1 ~]$ hadoop fs -put 1.txt /itheima
put: Permission denied: user=test, access=WRITE, inode="/itheima":hadoop:supergroup:drwxr-xr-x
```

接下来使用 ACL 给 test 用户单独添加`rwx`权限

```java
[test@hadoop1 ~]$ hadoop fs -setfacl -m user:test:rwx /itheima
setfacl: Permission denied. user=test is not the owner of inode=/itheima
```

发现报错 原因是ACL功能默认是关闭的。

在`hdfs-site.xml`中设置`dfs.namenode.acls.enabled=true`开启 ACL，并重启 HDFS 集群

```java
<property>
  <name>dfs.namenode.acls.enabled</name>
  <value>true</value>
</property>
```

再次设置 ACL 权限

```java
hadoop fs -setfacl -m user:test:rwx /itheima
```

设置成功之后查看 ACL 权限

```java
[hadoop@hadoop1 test]$ hadoop fs -getfacl /itheima
# file: /itheima
# owner: hadoop
# group: supergroup
user::rwx
user:test:rwx	#发现test权限配置成功
group::r-x
mask::rwx
other::r-x
```

再使用普通用户 test 去操作，发现可以成功了

如果切换其他普通用户 发现还是无法操作

```java
[test1@hadoop1 ~]$ echo 2 >> 2.txt
[test1@hadoop1 ~]$ hadoop fs -put 2.txt /itheima
put: Permission denied: user=test1, access=WRITE, inode="/itheima":hadoop:supergroup:drwxrwxr-x
```

**ACL其他操作命令：**

**1、** 带有ACL的任何文件或目录的权限字符串后附加一个‘+’字符；

```java
[hadoop@hadoop1 hadoop-3.3.1]$ hadoop fs -ls /
Found 13 items
drwxr-xr-x   - hadoop supergroup          0 2022-01-11 15:25 /benchmarks
drwxr-xr-x   - hadoop supergroup          0 2022-01-13 14:45 /data
drwxr-xr-x   - hadoop supergroup          0 2022-01-12 13:09 /hdfsapi
drwxr-xr-x   - hadoop supergroup          0 2022-01-24 16:52 /input
drwxrwxr-x+  - hadoop supergroup          0 2022-01-25 10:10 /itheima
drwxr-xr-x   - hadoop supergroup          0 2022-01-24 11:31 /outputdir
-rw-r--r--   3 hadoop supergroup       5945 2022-01-24 15:02 /seq.out
drwxr-xr-x   - hadoop supergroup          0 2022-01-24 11:24 /smallfile
drwxr-xr-x   - hadoop supergroup          0 2022-01-24 14:29 /smallfile1
drwxr-xr-x   - hadoop supergroup          0 2022-01-12 17:07 /test
drwxr-xr-x   - hadoop supergroup          0 2022-01-13 19:53 /test1
drwx------   - hadoop supergroup          0 2022-01-11 13:34 /tmp
drwxr-xr-x   - hadoop supergroup          0 2022-01-11 12:15 /user
```

**1、** 删除指定的ACL条目；

```java
hadoop fs -setfacl -x user:test /itheima
```

**1、** 删除基本ACL条目以外的所有条目保留用户，组和其他条目以与权限位兼容；

```java
hadoop fs -setfacl -b /itheima
```

**1、** 设置默认的ACL权限，以后在该目录中新建文件或者子目录时，新建的文件/目录的ACL权限都是之前设置的defaultACLs；

```java
[hadoop@hadoop1 hadoop-3.3.1]$ hadoop fs -setfacl -m default:user:test:rwx /itheima
[hadoop@hadoop1 hadoop-3.3.1]$ hadoop fs -getfacl /itheima
# file: /itheima
# owner: hadoop
# group: supergroup
user::rwx
group::r-x
mask::r-x
other::r-x
default:user::rwx
default:user:test:rwx
default:group::r-x
default:mask::rwx
default:other::r-x
```

**1、** 删除默认ACL权限；

```java
hadoop fs -setfacl -k /itheima 
```

**1、**`--set`:完全替换ACL，丢弃所有现有条目acl_spec必须包含用户，组和其他条目，以便与权限位兼容；

```java
hadoop fs -setfacl --set user::rw-,user:hadoop:rw-,group::r--,other::r-- /file
```
