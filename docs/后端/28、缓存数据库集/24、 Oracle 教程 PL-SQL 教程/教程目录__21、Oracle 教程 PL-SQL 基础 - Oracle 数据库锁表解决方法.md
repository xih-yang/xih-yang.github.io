# 21、Oracle 教程 PL/SQL 基础 - Oracle 数据库锁表解决方法
- 来源：https://ddkk.com/zhuanlan/db/oracle/4/21.html
- 分类：缓存数据库
- 分组：教程目录
## 锁表问题

今天执行一个删除语句的时候，一直执行不了，最后发现是因为之前对这个表使用了**for update**语句，然后又忘记提交了，从而造成了该表被锁住。

## 解决方法

(以下语句的执行，需要具有相应的权限才可以执行，如果当前用户没有该权限，请赋权或者使用管理员帐号)

执行下语句将查找到有哪些表被锁住了：

```java
select b.owner,b.object_name,a.session_id,a.locked_mode,c.sid,c.serial#,c.logon_time 
from v$locked_object a
inner join dba_objects b on b.object_id = a.object_id
inner join v$session c on a.session_id = c.sid 
```

如下图展示，可以看到SCM_OUTPUT_BILL_DETAIL表被锁住了。

执行以下语句，解锁：

```java
alter system kill session '38,5216';
```

**说明：这里的38是SID，5216是LOCKED_MODE**

**注意**：**造成锁表的原因很多，不能说这里看到有多少表被锁住了，就一昧的将这些表全部释放。**

例如：在对一个表进行update操作，如果该操作还没有完成，则这个表目前是被锁住的，如果此时将该表的锁释放，将造成不可预估的问题。

当然，一般的update语句比较快，如果想模拟出这种情况，建议写一个触发器，对然后在触发器中执行一些耗时的操作。此时在触发器代码执行完之前，这个表将一直被锁住。
