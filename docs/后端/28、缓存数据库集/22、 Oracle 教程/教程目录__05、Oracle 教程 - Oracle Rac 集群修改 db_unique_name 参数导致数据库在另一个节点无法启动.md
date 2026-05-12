# 05、Oracle 教程 - Oracle Rac 集群修改 db_unique_name 参数导致数据库在另一个节点无法启动
- 来源：https://ddkk.com/zhuanlan/db/oracle/1/5.html
- 分类：缓存数据库
- 分组：教程目录
## 一、问题描述

**1、** 两个节点的Oracle11gRac集群，集群节点能够正常启动，集群状态如下：；

```java
[grid@rac1 ~]$ crs_stat -t
Name           Type           Target    State     Host        
------------------------------------------------------------
ora.BAK.dg     ora....up.type ONLINE    ONLINE    rac1        
ora.DATA.dg    ora....up.type ONLINE    ONLINE    rac1        
ora....ER.lsnr ora....er.type ONLINE    ONLINE    rac1        
ora....N1.lsnr ora....er.type ONLINE    ONLINE    rac1        
ora....N2.lsnr ora....er.type ONLINE    ONLINE    rac2        
ora....N3.lsnr ora....er.type ONLINE    ONLINE    rac2        
ora.OCR.dg     ora....up.type ONLINE    ONLINE    rac1        
ora.asm        ora.asm.type   ONLINE    ONLINE    rac1        
ora.cvu        ora.cvu.type   ONLINE    ONLINE    rac2        
ora.gsd        ora.gsd.type   OFFLINE   OFFLINE               
ora....network ora....rk.type ONLINE    ONLINE    rac1        
ora.oc4j       ora.oc4j.type  ONLINE    ONLINE    rac2        
ora.ons        ora.ons.type   ONLINE    ONLINE    rac1        
ora.orcl.db    ora....se.type ONLINE    ONLINE    rac1        
ora....SM1.asm application    ONLINE    ONLINE    rac1        
ora....C1.lsnr application    ONLINE    ONLINE    rac1        
ora.rac1.gsd   application    OFFLINE   OFFLINE               
ora.rac1.ons   application    ONLINE    ONLINE    rac1        
ora.rac1.vip   ora....t1.type ONLINE    ONLINE    rac1        
ora....SM2.asm application    ONLINE    ONLINE    rac2        
ora....C2.lsnr application    ONLINE    ONLINE    rac2        
ora.rac2.gsd   application    OFFLINE   OFFLINE               
ora.rac2.ons   application    ONLINE    ONLINE    rac2        
ora.rac2.vip   ora....t1.type ONLINE    ONLINE    rac2        
ora.scan1.vip  ora....ip.type ONLINE    ONLINE    rac1        
ora.scan2.vip  ora....ip.type ONLINE    ONLINE    rac2        
ora.scan3.vip  ora....ip.type ONLINE    ONLINE    rac2        
```

**2、** 使用sqlplus连接之后发现节点2的数据库没有启动，使用startup命令后出现如下错误；

```java
SQL> startup
ORACLE instance started.
Total System Global Area  835104768 bytes
Fixed Size		    2257840 bytes
Variable Size		  570428496 bytes
Database Buffers	  260046848 bytes
Redo Buffers		    2371584 bytes
ORA-00600: internal error code, arguments: [kccsbck_first], [2], [1607268949],
[], [], [], [], [], [], [], [], []
```

**3、** 使用srvctl命令也关闭集群数据库，然后启动时出现如下问题，显示只有一个节点数据库启动，另一个节点数据库启动失败；

```java
[oracle@rac1 dbs]$ srvctl start database -d orcl
PRCC-1014 : orcl was already running
PRCR-1004 : Resource ora.orcl.db is already running
PRCR-1079 : Failed to start resource ora.orcl.db
CRS-5017: The resource action "ora.orcl.db start" encountered the following error: 
ORA-00600: internal error code, arguments: [kccsbck_first], [1], [1607288325], [], [], []
, [], [], [], [], [], []. For details refer to "(:CLSN00107:)" in "/u01/app/11.2.0/grid/log/rac2/agent/crsd/oraag
ent_oracle/oraagent_oracle.log".
CRS-2674: Start of 'ora.orcl.db' on 'rac2' failed
CRS-2528: Unable to place an instance of 'ora.orcl.db' as all possible servers are occupi
ed by the resource
```

**4、** 经过测试发现：当节点2无法启动时，如果把节点1的数据库关闭，则节点2的数据库能够启动，反之亦然；

## 二、问题解决

在百度输入错误信息：ORA-00600: internal error code, arguments: [kccsbck_first], [2], [1607268949]，没有查询到解决办法。折腾了几个小时也没有找到解决问题的办法。

最后查看 Oracle 官方文档，发现该问题可能与 db_unique_name 参数在集群中的不同节点取值不一致有关。

[外链图片转存失败,源站可能有防盗链机制,建议将图片保存下来直接上传(img-aBHDdk4R-1628389792318)(C:\Users\Administrator\AppData\Roaming\Typora\typora-user-images\1627811279826.png)]

想起以前修改过 db_unique_name 参数，可能是修改 db_unique_name 参数时只修改了一个节点。先启动节点2，查询该参数的取值：

```java
-- 节点2
SQL> show parameter db_unique_name 
NAME				     TYPE	 VALUE
------------------------------------ ----------- ------------------------------
db_unique_name			         string	 mydb
```

把节点2 的数据库关闭，启动节点1 的数据库，查询 db_unique_name 参数的值。

```java
-- 节点1
SQL> show parameter db_unique_name 
NAME				     TYPE	 VALUE
------------------------------------ ----------- ------------------------------
db_unique_name			     string	 orcl
```

发现两个节点的 db_unique_name 参数确实不一致。使用如下命令把 db_unique_name 参数的值设置为 mydb。

```java
SQL> alter system set db_unique_name = 'orcl' scope = spfile sid = '*';
System altered.
-- 说明：sid = '*' 表示集群中的所有节点都修改。
```

### 修改 db_unique_name 参数之后，重新启动数据库。正常！！

```java
SQL> select inst_id,name,value from gv$parameter where name like '%instance_name%';
   INST_ID NAME 					      VALUE
---------- -------------------------------------------------- --------------------------
      2 instance_name				      orcl2
      1 instance_name				      orcl1
```
