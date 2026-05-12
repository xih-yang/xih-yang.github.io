# 04、Oracle 基础教程 - 用户管理
- 来源：https://ddkk.com/zhuanlan/db/oracle/3/4.html
- 分类：缓存数据库
- 分组：教程目录
Oracle数据库中任何对象都属于一个特定用户， 用户的创建、删除、授权管理相关操作需要具备dba(数据库管理员)权限。

## 1. 创建/删除用户

**（1）创建用户**

```java
SQL> create user mytest identified by test123; 创建用户，默认表空间为users;
```

**（2）修改口令**

```java
SQL> alter user mytest identified by test456;修改密码
```

Oracle里通过概要文件实现对用户口令的统一化管理（口令有效期，最大锁定天数，锁定前允许的最大失败登录次数）。

**（3）删除用户**

```java
SQL> drop user mytest cascade; 删除用户
```

## 2. 用户授权管理

（1）对用户直接授权

```java
SQL> grant connect to mytest;               
SQL> grant select on scott.dept to mytest with grant option;
SQL> revoke select on scott.dept from mytest;  取消授权
```

（2）通过角色对用户授权

角色是一组权限的集合，将角色赋给一个用户，这个用户就拥有了这个角色中的所有权限。

```java
SQL> create role myrole;        创建角色
SQL> grant select on scott.dept to myrole;      对角色授权
SQL> grant myrole to mytest;     通过角色来控制用户
SQL> revoke myrole from mytest;   取消授权
```
