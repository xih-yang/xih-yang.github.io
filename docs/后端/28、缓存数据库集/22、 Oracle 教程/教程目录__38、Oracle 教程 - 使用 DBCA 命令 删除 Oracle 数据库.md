# 38、Oracle 教程 - 使用 DBCA 命令 删除 Oracle 数据库
- 来源：https://ddkk.com/zhuanlan/db/oracle/1/38.html
- 分类：缓存数据库
- 分组：教程目录
## 一、修改应答文件

### 1、查看应答文件

```java
[oracle@oracle response]$ pwd
/home/oracle/soft/database/response
[oracle@oracle response]$ ll
总用量 80
-rwxr-xr-x. 1 oracle oinstall 44533 8月  27 2013 dbca.rsp
-rw-r--r--. 1 oracle oinstall 25116 8月  27 2013 db_install.rsp
-rwxr-xr-x. 1 oracle oinstall  5871 8月  27 2013 netca.rsp
```

### 2、备份应答文件 dbca.rsp

```java
[oracle@oracle response]$ cd /home/oracle
[oracle@oracle ~]$ ll
总用量 132
-rw-r--r--. 1 oracle oinstall   907 11月 25 17:19 aa.ora
drwxr-xr-x. 2 root   root      4096 11月 25 17:33 bak_data
-rwxr-xr-x  1 oracle oinstall 44533 11月 28 18:50 dbca_dele.rsp
-rwxr-xr-x. 1 oracle oinstall 44553 11月 25 09:09 dbca.rsp
-rw-r--r--. 1 oracle oinstall 25298 11月 25 08:59 db_install.rsp
-rwxr-xr-x. 1 oracle oinstall  5871 11月 25 08:46 netca.rsp
drwxr-xr-x. 4 oracle oinstall   126 11月 25 08:44 soft
```

### 3、修改应答文件

```java
[oracle@oracle ~]$ vi dbca_dele.rsp 
[GENERAL]
#-----------------------------------------------------------------------------
# Name          : RESPONSEFILE_VERSION
# Datatype      : String
# Description   : Version of the database to create
# Valid values  : "11.1.0"
# Default value : None
# Mandatory     : Yes
#-----------------------------------------------------------------------------
RESPONSEFILE_VERSION = "11.2.0"
#-----------------------------------------------------------------------------
# Name          :OPERATION_TYPE
# Datatype      : String
# Description   : Type of operation
# Valid values  : "createDatabase" \ "createTemplateFromDB" \ "createCloneTemplate" \ "deleteDatabase" \ "configureDatabase" \ "addInstance" (RAC
-only) \ "deleteInstance" (RAC-only)# Default value : None
# Mandatory     : Yes
#-----------------------------------------------------------------------------
OPERATION_TYPE = "deleteDatabase"
#-----------------------------------------------------------------------------
# DELETEDATABASE section is used when DELETE_TYPE is defined as "deleteDatabase".
#-----------------------------------------------------------------------------
[DELETEDATABASE]
#-----------------------------------------------------------------------------
# Name          : SOURCEDB
# Datatype      : String
# Description   : The source database is the SID
#                 This database must be local and on the same ORACLE_HOME.
# Default value : none
# Mandatory     : YES
#-----------------------------------------------------------------------------
SOURCEDB = "orcl"  要删除的数据库名称
#-----------------------------------------------------------------------------
# Name          : SYSDBAUSERNAME
# Datatype      : String
# Description   : A user with DBA role.
# Default value : none
# Mandatory     : YES, if no OS authentication
#-----------------------------------------------------------------------------
#SYSDBAUSERNAME = "sys"
#-----------------------------------------------------------------------------
# Name          : SYSDBAPASSWORD
# Datatype      : String
# Description   : The password of the DBA user.
#                 You can also specify the password at the command prompt instead of here.
# Default value : none
# Mandatory     : YES, if no OS authentication
#-----------------------------------------------------------------------------
#SYSDBAPASSWORD = "password"
#-----------------------*** End of deleteDatabase section ***------------------------
.....
```

## 二、执行 dbca 命令删除数据库

```java
[oracle@oracle ~]$ dbca -silent -responseFile /home/oracle/dbca_dele.rsp
正在连接到数据库
4% 已完成
9% 已完成
14% 已完成
19% 已完成
23% 已完成
28% 已完成
47% 已完成
正在更新网络配置文件
48% 已完成
52% 已完成
正在删除实例和数据文件
76% 已完成
100% 已完成
有关详细信息, 请参阅日志文件 "/usr/local/oracle/cfgtoollogs/dbca/orcl.log"。
```
