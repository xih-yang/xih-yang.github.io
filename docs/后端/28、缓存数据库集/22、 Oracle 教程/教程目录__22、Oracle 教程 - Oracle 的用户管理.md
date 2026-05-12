# 22、Oracle 教程 - Oracle 的用户管理
- 来源：https://ddkk.com/zhuanlan/db/oracle/1/22.html
- 分类：缓存数据库
- 分组：教程目录
Oracle 用户（user）就是访问 oracle 数据库的人。通过对用户的各种安全参数进行控制，以维护数据库的安全性，这些概念包括模式（schema）、权限、角色、存储设置、空间限额、存取资源限制、数据库审计等。当用户登录 Oracle 时需要进行身份认证，以便确认该用户能够进行的操作。

## 一、Oracle 用户认证方法

认证是指对需要使用数据、资源或应用程序的用户进行身份确认。通过认证后，可以为用户后面的数据库操作提供一种可靠的连接关系。Oracle 提供了多种身份认证方式：操作系统身份认证，Oracle 数据库身份认证，管理员身份认证。

（1）操作系统身份认证：主要对登录操作系统的用户的合法身份进行认证。如：sqlplus / as sysdba

（2）Oracle 数据库身份认证：使用存储在数据库中的信息对试图连接数据库的用户进行身份认证。在用户连接数据库时，必须提供正确的用户名和密码，才能登录到 Oracle 数据库。

（3）数据库管理员（DBA）认证：DBA 拥有最高的管理权限，可以执行一些特殊的操作，比如关闭或启动数据库。

## 二、和用户相关的概念

### 1、用户默认表空间

表空间是信息存储的最大逻辑单位、当用户连接到数据库时，若未指出数据的目标存储表空间时，则数据存储在用户的默认表空间中。用户的默认表空间可以在创建用户时指定，也可以使用 aler user 命令指定。如果创建用户时不指定默认表空间，则普通用户的默认空间为 users，sys 用户的默认表空间为 system，可以通过 dba_users 查看。

### 2、用户临时表空间

临时表空间用来管理数据库排序操作以及用于存储临时表、中间排序结果等临时对象。当 ORACLE 需要用到排序时，并且 PGA 中 sort_area_size 大小不足时，将会把数据放入临时表空间里进行排序。如果创建用户时，不指定默认的临时表空间，则默认临时表空间为 temp。

### 3、用户资源文件

用户资源文件用来对用户的资源存取进行限制，防止非正常连接数据库。包括：cpu 使用时间限制、内存逻辑读个数限制、每个用户同时可以连接的会话数限制、一个会话的空间和时间限制、一个会话的持续时间限制、每次会话的专用 SGA 空间限制。

创建资源文件命令如下：

```java
create profile profile_name limit 参数 ...;
/* 资源文件的参数如下：
connect_time：指定一个会话能保持连接到数据库的总时间
cpu_per_call：限制事务内每个调用使用CPU的时间。
cpu_per_sessin：限制每个会话内使用CPU的时间。
sessions_per_time：限制用户可以打开并发的最大会话数。
idle_time：限制用户的最大空闲时间。
logical_reads_per_session：限制数据块读取的总数目。
logical_reads_per_call：限制每个会话调用总的逻辑读取数。
private_sga：指定一个在SGA的共享池组件中分配的空间限额（仅适用于共享服务器）。
composite_limit：对资源设置使用一个总的限制。Oracle考虑用四个参数来计算加权的composite_limit。分别为:cpu_per_session, logical_reads_per_sessions, connect_time, private_sga。可以使用 alter resource cost来设置.。
密码类：
failed_login_attempts：指用户被锁之前可以尝试的最大登录数。
password_life_time：指定使用特定密码的时间限制，如果超出此时间间隔，那么密码将过期。
password_grace_time：设置一个时间段，在此时间段内将发出一个密码过期警告。
password_lock_time：设置用户被锁定的天数，过了此天数，用户将自行解锁。
password_reuse_time：指定重新使用密码要经过多少天。
password_reuse_max：指定重新使用某个特定密码前，要经过多少次修改。
passwrod_verify_function：此参数允许指定Oracle提供的密码验证函数来建立自动密码验证。
*/
```

### 4、用户表空间限额

配额大小指的是用户指定使用表空间的的大小，默认情况下用户没有配额限制。在创建或修改用户时，可以由参数 quota 指定。若用户在向表空间存储数据时，超出了此限额，则会产生错误。错误信息如：‘ORA-01536:space quota exceeded for tablespace tablespacename…’。

通过查询字典 dba_ts_quotas 查看表空间限额信息：

```java
SQL> select tablespace_name, username, bytes/1024/1024 size_MB, max_bytes from dba_ts_quotas;
TABLESPACE_NAME 	       USERNAME 			 SIZE_MB  MAX_BYTES
------------------------------ ------------------------------ ---------- ----------
SYSAUX			       FLOWS_FILES			       0	 -1
SYSAUX			       OLAPSYS				   5.125	 -1
SYSAUX			       SYSMAN				 46.0625	 -1
SYSAUX			       APPQOSSYS			       0	 -1
```

## 三、创建用户

### 1、创建用户资源文件

```java
SQL> show parameter resource_limit
NAME				     TYPE	 VALUE
------------------------------------ ----------- ------------------------------
resource_limit			     boolean	 FALSE
--修改初始化参数 resource_limit 的值为 TRUE 
SQL> alter system set resource_limit=true;
System altered.
SQL> show parameter resource_limit
NAME				     TYPE	 VALUE
------------------------------------ ----------- ------------------------------
resource_limit			     boolean	 TRUE
SQL> create profile wgx_profile limit
     FAILED_LOGIN_ATTEMPTS 3
     PASSWORD_LOCK_TIME 5
     PASSWORD_LIFE_TIME 60;
Profile created.
/* 说明：
（1）FAILED_LOGIN_ATTEMPTS：指定锁定用户的登录失败次数为3次
（2）PASSWORD_LOCK_TIME：指定用户被锁定天数为5天
（3）PASSWORD_LIFE_TIME：指定口令可用天数为30天
*/
```

### 2、创建用户 wgx

### （1）创建用户的语法如下：

```java
CREATE USER user_name
IDENTIFIED BY password
DEFAULT TABLESPACE tablespace_name
TEMPORARY TABLESPACE tablespace_name
PROFILE profile_name
QUOTA integer|UNLIMITED ON tablespace;
/*说明：
（1）IDENTIFIED BY password：用户口令
（2）DEFAULT TABLESPACE tablespace：默认表空间。如果不指定，默认空间为 users
（3）TEMPORARY TABLESPACE tablespace：临时表空间。如果不指定，默认为 temp
（4）PROFILE profile|DEFAULT：用户资源文件；
（5）QUOTA integer[K|M]|UNLIMITED ON tablespace：用户在表空间上的空间使用限额
*/
```

### （2）创建用户 wgx

```java
SQL> create user wgx
     identified by "wgx"
     default tablespace ts001
     temporary tablespace temp02
     profile wgx_profile
     quota 1000m on ts001;
User created.
```

### （3）查询用户的默认表空间

```java
SQL> select username, default_tablespace, temporary_tablespace from dba_users
     where username = 'WGX';
USERNAME		       DEFAULT_TABLESPACE	      TEMPORARY_TABLESPACE
------------------------------ ------------------------------ ------------------------------
WGX			       TS001			      TEMP02
```

### （4）查询用户 wgx 的资源文件名

```java
SQL> select username,profile from dba_users where username='WGX';
USERNAME		       PROFILE
------------------------------ ------------------------------
WGX			       WGX_PROFILE
```

## 四、修改用户

### 1、修改用户的语法如下

```java
-- 该命令各部分参数的含义与 create user 完全相同
Alter User user_name
Identified by password
Default Tablespace tablespace_name
Temporary Tablespace tablespace_name
Profile profile_name
Quota integer/unlimited on tablespace;
```

### 2、创建资源文件 wgx_new_profile

```java
SQL> create profile wgx_new_profile limit
     cpu_per_session UNLIMITED
     connect_time 30
     logical_reads_per_session DEFAULT
     logical_reads_per_call 1000
     private_sga 15K
     composite_limit 500000
     password_life_time 90;
Profile created.
```

### 3、修改用户 wgx 的密码

```java
SQL> alter user wgx identified by "WGX123456";
User altered.
--注：密码用双引号括起来
```

### 4、修改用户 wgx 的默认表空间

```java
SQL> alter user wgx default tablespace ts003;
User altered.
```

### 5、修改用户 wgx 的默认临时表空间

```java
SQL> alter user wgx temporary tablespace temp03;
User altered.
```

### 6、修改用户 wgx 的资源文件

```java
SQL> alter user wgx profile wgx_new_profile;
User altered.
```

### 7、查看用户 wgx 的信息

```java
SQL> select username,default_tablespace,temporary_tablespace,profile 
     from dba_users where username ='WGX';
USERNAME		  DEFAULT_TABLESPACE	      TEMPORARY_TABLESPACE	     PROFILE
------------------------- ------------------------------ ------------------------------
WGX			       TS003			      TEMP03			     WGX_NEW_PROFILE
```

### 8、为用户 wgx 授予权限

```java
SQL> grant connect,resource to wgx;
Grant succeeded.
```

### 9、强制用户 wgx 修改密码

```java
SQL> Alter user wgx password expire;
User altered.
--当用户 wgx 登录时强制要求修改密码
SQL> conn wgx/WGX123456
ERROR:
ORA-28001: the password has expired
Changing password for wgx
New password: 
Retype new password: 
Password changed
Connected.
```

### 10、用户加锁与解锁

### （1）为用户加锁

```java
SQL> alter user wgx account lock;
User altered.
--以 wgx 用户登录时显示用户被锁定
SQL> conn wgx
Enter password: 
ERROR:
ORA-28000: the account is locked
Warning: You are no longer connected to ORACLE.
```

### （2）为用户解锁

```java
SQL> alter user wgx account unlock;
User altered.
-- 用户wgx 可以正常登录
SQL> conn wgx/wgx123456;
Connected.
SQL> create table t001(id int);
Table created.
SQL> create table t002(id int,name varchar2(20));
Table created.
SQL> insert into t002 values(1,'Jack');
1 row created.
SQL> commit;
Commit complete.
```

## 五、用户监控

### 1、查询用户会话信息

```java
SQL> select username, sid, serial#, machine from v$session
     where username = 'WGX';
USERNAME			  SID    SERIAL#        MACHINE
----------------------------------------------------------------
WGX				       34	  73            rac2
```

### 2、删除用户会话信息

```java
--命令格式：
Alter system kill session 'sid, serial#';
SQL> alter system kill session '34,73';
System altered.
SQL> select username, sid, serial#,status, machine from gv$session where username ='WGX';
USERNAME			   SID    SERIAL#   STATUS   MACHINE
----------------------------------------------------------------
WGX				       34	  73       KILLED      rac2
```

## 六、删除用户

### 1、删除用户的语法

```java
drop user user_name [descade];
--说明：如果要删除的用户包含对象，需要使用 descade 参数连同包含的对象一并删除
```

### 2、删除用户 wgx

```java
SQL> drop user wgx;
drop user wgx
*
ERROR at line 1:
ORA-01922: CASCADE must be specified to drop 'WGX'
```

### 3、使用 cascade 参数删除用户 wgx

```java
SQL> drop user wgx cascade;
User dropped.
```

### 4、查看用户 wgx 信息

```java
SQL> select * from dba_users where username ='WGX';
no rows selected
-- wgx 用户已删除
```
