# 20、Oracle 教程 PL/SQL 基础 - Oracle 创建约束
- 来源：https://ddkk.com/zhuanlan/db/oracle/4/20.html
- 分类：缓存数据库
- 分组：教程目录
说明：该文只是做一个简单的总结，方便在使用的时候可以查阅，如果想了解详细的内容，还得查阅其他相关资料。

### 主键约束

**在创建表的是时候添加主键约束**：在创建表的最后添加：（当然，也可以不放在最后，放在定义类的后边，即not null 的后边）

```java
create table p_article (
   id                   NVARCHAR2(32)        default SYS_GUID() not null,
   name             NVARCHAR2(64)        not null,
   constraint 主键名字 primary key (id)
);
```

**在已有的表上添加主键约束：**

```java
ALTER TABLE 表名 ADD CONSTRAINTS  主键名 PRIMARY KEY (列名)；
```

**移除主键约束：**

```java
ALTER TABLE</font>  表名 DROP CONSTRAINT  主键名；
```

### 外键约束

**在创建表的时候添加外键约束**：同主键约束一样，也是在那个位置添加：

```java
CONSTRAINT 外键名字 FOREIGN KEY(列名) REFERENCE 引用表的表名（引用表的列名）[ON DELETE CASCADE]；
```

说明：**ON DELETE CASCADE**是设置级联删除，当主键字段被删除时，外键所对应的字段也被同时删除；

**在已有表中添加外键：**

```java
alter table 需要添加外键的表名 add constraint 外键名字 foreign key (列名)  references引用表的表名（引用表的列名）;
```

**移除外键约束：**

```java
ALTER TABLE 表名 DROP CONSTRAINT 外键名；
```

### CHECK约束

**创建表的时候，添加CHECK约束**：同主键约束一样，也是在那个位置：

```java
constraint 约束名字 check (列名 between 0 and 999)；
```

说明：这个括号里的条件可以随便写，比如大于小于之类的；

**在已有的表上添加CHECK约束：**

```java
ALTER TABLE 表名 ADD CONSTRAINTS CHECK约束名 CHECK(约束条件)；
```

**移除CHECK约束：**

```java
ALTER TABLE 表名 DROP CONSTRAINT CHECK约束名；
```

### UNIQUE约束：

**创建表的时候，添加唯一约束**：同主键约束一样，也是在那个位置：

```java
CONSTRAINT 约束名字 UNIQUE（列名）;
```

**在已有表中添加唯一约束：**

```java
alter table 表名 UNIQUE（列名）
```

**移除唯一约束：**

```java
ALTER TABLE 表名 DROP CONSTRAINT 约束名；
```

### NOT NULL约束：

**创建表的时候，添加非空约束**：同主键约束的列子，直接加上**not null** 就可以了；

**在已有表中添加唯一约束**：

```java
ALTER TABLE 表名 MODIFY 列名 NOT NULL;
```

对于非空约束是不需要删除的，如果要取消某个列的非空约束，直接使用MODIFY语句，把NOT NULL改成NULL即可。
