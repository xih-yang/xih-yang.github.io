# 03、Oracle 教程 - Oracle 用户的登录验证方式与密码文件（Password files）
- 来源：https://ddkk.com/zhuanlan/db/oracle/1/3.html
- 分类：缓存数据库
- 分组：教程目录
Oracle 用户登录数据库时有三种验证方式，分别为：

（1）操作系统验证：即，Oracle 用户只要能够登录操作系统，在登录数据库时不需要验证用户名和密码。此种登录方式只有在服务器本机登录有效，不适用于远程登录。

（2）密码文件验证：使用密码文件中保存的用户和密码登录数据库。

（3）数据字典验证：使用数据字典中的用户和密码登录数据库，一般用于普通用户的登录验证。

## 一、操作系统验证

Oracle 安装之后默认启用操作系统验证，这种验证方式必须在 Oracle 服务器本机登录。如果以安装 Oracle 时的用户登录操作系统，那么此时在登录 Oracle 数据库时不需要任何验证。采用此种方式登录时，数据库不需要打开，监听也可以不启动。登录方式如下：

```java
[oracle@rac1 admin]$ sqlplus / as sysdba
SQL*Plus: Release 11.2.0.4.0 Production on Sat Jul 31 16:24:38 2021
Copyright (c) 1982, 2013, Oracle.  All rights reserved.
Connected to:
Oracle Database 11g Enterprise Edition Release 11.2.0.4.0 - 64bit Production
With the Partitioning, Real Application Clusters, Automatic Storage Management, OLAP,
Data Mining and Real Application Testing options
SQL> 
```

采用操作系统验证时，不论输入什么用户（即使用户不存在）都可以连接上，登录之后连接用户都是 sys。如果忘记数据库用户的密码，可以采用这种方式登录数据库。只能在数据库服务器本机上采用这种登录方式，远程登录不能使用。但这种登录方式存在安全隐患。

```java
[oracle@rac1 admin]$ sqlplus bbb/aaa as sysdba   用户名、密码都是随便写的
SQL*Plus: Release 11.2.0.4.0 Production on Sat Jul 31 16:26:42 2021
Copyright (c) 1982, 2013, Oracle.  All rights reserved.
Connected to:
Oracle Database 11g Enterprise Edition Release 11.2.0.4.0 - 64bit Production
With the Partitioning, Real Application Clusters, Automatic Storage Management, OLAP,
Data Mining and Real Application Testing options
SQL> show user;
USER is "SYS"      用户名显示为 sys
```

使用远程登录必须输入正确的用户名和密码，否则登录失败：

```java
[oracle@rac1 admin]$ sqlplus bbb/aaa@rac-scan/orcl as sysdba
SQL*Plus: Release 11.2.0.4.0 Production on Sat Jul 31 16:41:03 2021
Copyright (c) 1982, 2013, Oracle.  All rights reserved.
ERROR:
ORA-01017: invalid username/password; logon denied
Enter user-name: 
[oracle@rac1 admin]$ sqlplus sys/oracle@rac-scan/orcl as sysdba
SQL*Plus: Release 11.2.0.4.0 Production on Sat Jul 31 16:42:23 2021
Copyright (c) 1982, 2013, Oracle.  All rights reserved.
Connected to:
Oracle Database 11g Enterprise Edition Release 11.2.0.4.0 - 64bit Production
With the Partitioning, Real Application Clusters, Automatic Storage Management, OLAP,
Data Mining and Real Application Testing options
SQL> show user
USER is "SYS"
```

如果需要屏蔽操作系统验证，可以采用两种方式：

（1）修改 $ORACLE_HOME/network/admin/sqlnet.ora 文件，如果该文件不存在，表示开启操作系统验证，则新建一个文件，设置 SQLNET.AUTHENTICATION_SERVICES 参数为 none。

```java
[oracle@rac1 admin]$ vi sqlnet.ora
SQLNET.AUTHENTICATION_SERVICES = none | all | nts
## 说明：该参数有三个取值，含义如下：
#（1）none : 关闭操作系统验证，只能使用密码验证
#（2）all : 用于 linux 或 unix 平台，启用操作系统验证
#（3）nts : 用于 windows 平台，启用操作系统验证
```

（2）修改 remote_login_passwordfile 参数的取值为 EXCLUSIVE 或 SHARED：

```java
remote_login_passwordfile= NONE | EXCLUSIVE | SHARED
# 说明：该参数有三个取值，含义如下：
#（1）NONE: 不使用密码文件，使用操作系统验证
#（2）EXCLUSIVE: 密码文件验证，但只有一个数据库实例可以使用此文件
#（3）SHARED: 密码文件验证，多个数据库实例可以使用此文件，但此设置下只有 SYS 帐号能被识别
```

### 总结：

### （1）sqlnet.authentication_services = all，同时 Remote_login_passwordfile = NONE，为操作系统验证

如下所示：

```java
[oracle@rac1 admin]$ cat sqlnet.ora 
SQLNET.AUTHENTICATION_SERVICES = all
SQL> show parameter remote_login_passwordfile
NAME				     TYPE	 VALUE
------------------------------------ ----------- ------------------------------
remote_login_passwordfile	     string	 NONE
[oracle@rac1 admin]$ sqlplus / as sysdba
SQL*Plus: Release 11.2.0.4.0 Production on Sat Jul 31 17:06:36 2021
Copyright (c) 1982, 2013, Oracle.  All rights reserved.
Connected to:
Oracle Database 11g Enterprise Edition Release 11.2.0.4.0 - 64bit Production
With the Partitioning, Real Application Clusters, Automatic Storage Management, OLAP,
Data Mining and Real Application Testing options
SQL> 
```

### （2）Sqlnet.authentication_services = NONE， 同时 Remote_login_passwordfile = EXCLUSIVE | SHARED，为密码文件验证

如下所示：

```java
[oracle@rac1 admin]$ cat sqlnet.ora 
SQLNET.AUTHENTICATION_SERVICES = none
SQL> show parameter Remote_login_passwordfile
NAME				     TYPE	 VALUE
------------------------------------ ----------- ------------------------------
remote_login_passwordfile	     string	 SHARED
# 操作系统验证失败
[oracle@rac1 admin]$ sqlplus / as sysdba
SQL*Plus: Release 11.2.0.4.0 Production on Sat Jul 31 17:13:34 2021
Copyright (c) 1982, 2013, Oracle.  All rights reserved.
ERROR:
ORA-01017: invalid username/password; logon denied
Enter user-name: 
# 密码文件验证
[oracle@rac1 admin]$ sqlplus sys/oracle as sysdba
SQL*Plus: Release 11.2.0.4.0 Production on Sat Jul 31 17:14:27 2021
Copyright (c) 1982, 2013, Oracle.  All rights reserved.
Connected to:
Oracle Database 11g Enterprise Edition Release 11.2.0.4.0 - 64bit Production
With the Partitioning, Real Application Clusters, Automatic Storage Management, OLAP,
Data Mining and Real Application Testing options
SQL> 
```

### （3）删除文件 sqlnet.ora，同时 Remote_login_passwordfile = EXCLUSIVE | SHARED，为操作系统认证和密码文件认证同时起作用

如下所示：

```java
SQL> show parameter Remote_login_passwordfile
NAME				     TYPE	 VALUE
------------------------------------ ----------- ------------------------------
remote_login_passwordfile	     string	 SHARED
# 操作系统验证成功
[oracle@rac1 admin]$ sqlplus / as sysdba
SQL*Plus: Release 11.2.0.4.0 Production on Sat Jul 31 17:17:59 2021
Copyright (c) 1982, 2013, Oracle.  All rights reserved.
Connected to:
Oracle Database 11g Enterprise Edition Release 11.2.0.4.0 - 64bit Production
With the Partitioning, Real Application Clusters, Automatic Storage Management, OLAP,
Data Mining and Real Application Testing options
SQL> 
# 密码文件验证
[oracle@rac1 admin]$ sqlplus sys/oracle@rac-scan/orcl as sysdba
SQL*Plus: Release 11.2.0.4.0 Production on Sat Jul 31 21:50:55 2021
Copyright (c) 1982, 2013, Oracle.  All rights reserved.
Connected to:
Oracle Database 11g Enterprise Edition Release 11.2.0.4.0 - 64bit Production
With the Partitioning, Real Application Clusters, Automatic Storage Management, OLAP,
Data Mining and Real Application Testing options
SQL> 
```

## 二、密码文件验证

密码文件验证是指通过密码文件校验用户名和密码正确与否。

Oracle 的密码文件保存着具有 sysdba、sysoper 权限的用户名及口令。即使数据库没有处于 open 状态，也可以通过密码文件验证来连接数据库。如果没有密码文件，在数据库未启动之前只能通过操作系统验证。

远程登录不能使用操作系统验证，只能使用密码文件验证，要想以 sysdba 权限远程连接数据库，必须使用密码文件。密码文件默认保存了 sys 用户以及密码，如果把 sysdba 权限授予普通用户，则普通用户的用户名以及密码也会保存到密码文件中。

密码文件的位置与名称为：$ORACLE_HOME/dbs/orapw：

```java
[oracle@rac1 dbs]$ pwd
/u01/app/oracle/product/11.2.0/db_1/dbs
[oracle@rac1 dbs]$ ll
total 16
-rw-rw---- 1 oracle asmadmin 1544 Jul 31 17:11 hc_orcl1.dat
-rw-r--r-- 1 oracle oinstall 2851 May 15  2009 init.ora
-rw-r----- 1 oracle oinstall   35 Apr 21 17:24 initorcl1.ora
-rw-r----- 1 oracle oinstall 1536 Jul 30 21:53 orapworcl1  密码文件
```

查看密码文件中的用户信息：

```java
SQL> select * from v$pwfile_users;
USERNAME		       SYSDB SYSOP SYSAS
------------------------------ ----- ----- -----
SYS			       TRUE  TRUE  FALSE
-- 把 sysdba 权限授予普通用户 scott
SQL> grant sysdba to scott;
Grant succeeded.
/*
remote_login_passwordfile= NONE | EXCLUSIVE | SHARED
 说明：该参数有三个取值，含义如下：
（1）NONE: 不使用密码文件，使用操作系统验证
（2）EXCLUSIVE（默认值）: 密码文件验证。以独占模式使用密码文件，此时在数据库中可以执行对于 sysdba 用户的增加，修改，删除操作
（3）SHARED: 密码文件验证。密码文件可以被一台服务器上的多个数据库或者 RAC 集群数据库共享；shared 下的密码文件不可被修改，这意味着无法授权 sysdba 权限给非 sys 用户，也不允许修改 sysdba 权限用户的密码，包括 sys 用户的密码。
Oracle 建议首先将需要 sysdba 权限的用户在 exclusive 模式下设置好，然后再将 REMOTE_LOGIN_PASSWORDFILE 修改为 shared。
*/
4.Oracle寻找口令文件的顺序：orapw$ORACLE_SID --> orapw --> Failure
### 总结：
SQL> select * from v$pwfile_users;
USERNAME		       SYSDB SYSOP SYSAS
------------------------------ ----- ----- -----
SYS			       TRUE  TRUE  FALSE
SCOTT			   TRUE  FALSE FALSE
```

使用scott 用户登录数据库：

```java
SQL> conn scott/tiger;
Connected.
SQL> show user;
USER is "SCOTT"
SQL> conn scott/tiger as sysdba;
Connected.
SQL> show user;
USER is "SYS"
```

重建密码文件：可以解决密码文件损坏，口令丢失

```java
# 删除密码文件
[oracle@rac1 dbs]$ ll
total 16
-rw-rw---- 1 oracle asmadmin 1544 Jul 31 17:11 hc_orcl1.dat
-rw-r--r-- 1 oracle oinstall 2851 May 15  2009 init.ora
-rw-r----- 1 oracle oinstall   35 Apr 21 17:24 initorcl1.ora
-rw-r----- 1 oracle oinstall 1536 Jul 30 21:53 orapworcl1
[oracle@rac1 dbs]$ 
[oracle@rac1 dbs]$ 
[oracle@rac1 dbs]$ rm orapworcl1 
[oracle@rac1 dbs]$ ll
total 12
-rw-rw---- 1 oracle asmadmin 1544 Jul 31 18:53 hc_orcl1.dat
-rw-r--r-- 1 oracle oinstall 2851 May 15  2009 init.ora
-rw-r----- 1 oracle oinstall   35 Apr 21 17:24 initorcl1.ora
# 重建密码文件，并设置密码
[oracle@rac1 dbs]$ orapwd file=orapworcl1 password=oracle
[oracle@rac1 dbs]$ ll
total 16
-rw-rw---- 1 oracle asmadmin 1544 Jul 31 18:53 hc_orcl1.dat
-rw-r--r-- 1 oracle oinstall 2851 May 15  2009 init.ora
-rw-r----- 1 oracle oinstall   35 Apr 21 17:24 initorcl1.ora
-rw-r----- 1 oracle oinstall 1536 Jul 31 19:06 orapworcl1
SQL> select * from v$pwfile_users;
USERNAME		       SYSDB SYSOP SYSAS
------------------------------ ----- ----- -----
SYS			       TRUE  TRUE  FALSE
```

## 三、数据库验证

数据库验证需要启动数据库，通过读取数据字典确定用户的用户名和密码是否正确。

## 四、操作系统验证和密码文件验证总结

（1）登录命令：conn / as sysdba，本机登陆，使用操作系统验证，有无监听都可以。

（2）登录命令：conn sys/password as sysdba，本机登陆，使用密码文件验证，有无监听都可以。

（3）登录命令：conn sys/password@dbanote as sysdba，本机登录和远程登录都可以，使用密码文件认证，必须有监听。
