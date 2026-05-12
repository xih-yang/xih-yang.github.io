# 11、Spring Security 实战 - 数据库方式配置用户
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/9/11.html
- 分类：安全框架
- 分组：教程目录
## 前言

在[之前](/zhuanlan/security/springsecurity/9/2.html)文章中，用户是在内存中配置的，接下来将用户信息存放到数据库中，然后从数据库读取用户信息。

## 表设计

这里会设计到用户，角色，权限表

创建用户表

```java
DROP TABLE IF EXISTS sys_user;
CREATE TABLE sys_user (
  id char(19) COLLATE utf8mb4_general_ci NOT NULL COMMENT '主键id',
  nick_name varchar(64) COLLATE utf8mb4_general_ci NOT NULL COMMENT '昵称',
  mobile char(11) COLLATE utf8mb4_general_ci NOT NULL COMMENT '手机号',
  username varchar(64) COLLATE utf8mb4_general_ci NOT NULL COMMENT '用户名',
  password varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '密码',
  user_face varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '头像',
  is_disabled tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '是否禁用，0：否，1：是',
  is_locked tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '是否锁定，0：否，1：是',
  is_expired tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '是否过期，0：否，1：是',
  is_credentials_expired tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '凭证是否过期，0：否，1是',
  create_time datetime NOT NULL COMMENT '创建时间',
  update_time datetime NOT NULL COMMENT '更新时间',
  is_deleted tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '是否删除，0：未删除，1：删除',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='系统用户';
```

导入测试用户，密码是通过加密过后的（123）

```java
INSERT INTO sys_user VALUES ('1', '系统管理员', '13821856321', 'admin', '$2a$10$oE39aG10kB/rFu2vQeCJTu/V/v4n6DRR0f8WyXRiAYvBpmadoOBE.', 'https://liuym-edu.oss-cn-beijing.aliyuncs.com/avatar/default/9e7fbeaa-6f50-4aaa-8207-73cb4ec3d1f2.jpg', 0, 0, 0, 0, '2021-5-5 11:48:04', '2021-5-5 11:48:06', 0);
INSERT INTO sys_user VALUES ('2', '普通用户', '15667056321', 'user', '$2a$10$oE39aG10kB/rFu2vQeCJTu/V/v4n6DRR0f8WyXRiAYvBpmadoOBE.', 'https://liuym-edu.oss-cn-beijing.aliyuncs.com/avatar/default/9e7fbeaa-6f50-4aaa-8207-73cb4ec3d1f2.jpg', 0, 0, 0, 0, '2021-5-17 23:01:02', '2021-5-17 23:01:05', 0);
```

创建角色表

```java
DROP TABLE IF EXISTS sys_role;
CREATE TABLE sys_role (
  id char(19) NOT NULL COMMENT '主键',
  name_en varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '角色英文名',
  name_zh varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '角色中文名',
  remark varchar(64) NOT NULL COMMENT '备注',
  create_time datetime NOT NULL COMMENT '创建时间',
  update_time datetime NOT NULL,
  is_deleted tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '是否删除，0：否，1：是',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='系统角色';
```

导入测试角色

```java
INSERT INTO sys_role VALUES ('1', 'ROLE_admin', '系统管理员', '拥有所有权限', '2021-05-05 17:25:44', '2021-05-05 17:25:47', '0');
INSERT INTO sys_role VALUES ('2', 'ROLE_user', '普通员工', '拥有查看权限', '2021-05-05 17:25:44', '2021-05-05 17:25:47', '0');
```

创建用户角色表

```java
DROP TABLE IF EXISTS sys_user_role;
CREATE TABLE sys_user_role (
  id char(19) COLLATE utf8mb4_general_ci NOT NULL COMMENT '主键',
  user_id char(19) COLLATE utf8mb4_general_ci NOT NULL COMMENT '用户ID',
  role_id char(19) COLLATE utf8mb4_general_ci NOT NULL COMMENT '角色ID',
  PRIMARY KEY (id),
  KEY user_id (user_id),
  KEY role_id (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='用户角色';
```

导入测试数据

```java
INSERT INTO sys_user_role VALUES ('1', '1', '1');
INSERT INTO sys_user_role VALUES ('2', '2', '2');
```

创建资源表

```java
DROP TABLE IF EXISTS sys_menu;
CREATE TABLE sys_menu (
  id char(19) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '主键',
  url varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '请求路径',
  path varchar(64) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '页面跳转路径',
  component varchar(32) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '页面组件',
  name varchar(16) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '菜单名称',
  icon varchar(32) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '显示图标',
  type tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '类型，0：菜单，1：按钮',
  parent_id char(19) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '父Id',
  create_time datetime NOT NULL COMMENT '创建时间',
  update_time datetime NOT NULL COMMENT '更新时间',
  is_deleted tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '是否删除，0：否，1：是',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='系统权限';
```

导入测试数据

```java
INSERT INTO sys_menu VALUES ('1', '/sys/user/list', '/home', 'SysUser', '用户管理', 'fa fa-user-circle-o', 0, '', '2021-5-5 17:30:39', '2021-5-5 17:30:42', 0);
INSERT INTO sys_menu VALUES ('10', '/sys/role/delete/{id}', '', '', '删除角色', '', 1, '2', '2021-5-18 22:32:50', '2021-5-18 22:32:53', 0);
INSERT INTO sys_menu VALUES ('11', '/sys/role/add', '', '', '新增角色', '', 1, '2', '2021-5-18 22:33:00', '2021-5-18 22:33:03', 0);
INSERT INTO sys_menu VALUES ('12', '/sys/menu/query', '', '', '查询权限', '', 1, '3', '2021-5-18 22:33:11', '2021-5-18 22:33:14', 0);
INSERT INTO sys_menu VALUES ('13', '/sys/menu/edit/{id}', '', '', '编辑权限', '', 1, '3', '2021-5-18 22:35:02', '2021-5-18 22:35:05', 0);
INSERT INTO sys_menu VALUES ('14', '/sys/menu/delete/{id}', '', '', '删除权限', '', 1, '3', '2021-5-18 22:35:09', '2021-5-18 22:35:11', 0);
INSERT INTO sys_menu VALUES ('15', '/sys/menu/add', '', '', '新增权限', '', 1, '3', '2021-5-18 22:35:35', '2021-5-18 22:35:37', 0);
INSERT INTO sys_menu VALUES ('2', '/sys/role/list', '/home', 'SysRole', '角色管理', 'fa fa-user-circle-o', 0, '', '2021-5-18 22:14:50', '2021-5-18 22:14:53', 0);
INSERT INTO sys_menu VALUES ('3', '/sys/menu/list', '/home', 'SysMenu', '权限管理', 'fa fa-user-circle-o', 0, '', '2021-5-18 22:15:45', '2021-5-18 22:15:48', 0);
INSERT INTO sys_menu VALUES ('4', '/sys/user/query', '', '', '查询用户', '', 1, '1', '2021-5-18 22:25:24', '2021-5-18 22:25:27', 0);
INSERT INTO sys_menu VALUES ('5', '/sys/user/edit/{id}', '', '', '编辑用户', '', 1, '1', '2021-5-18 22:29:12', '2021-5-18 22:29:14', 0);
INSERT INTO sys_menu VALUES ('6', '/sys/user/delete/{id}', '', '', '删除用户', '', 1, '1', '2021-5-18 22:29:40', '2021-5-18 22:29:44', 0);
INSERT INTO sys_menu VALUES ('7', 'sys/user/add', '', '', '新增用户', '', 1, '1', '2021-5-18 22:31:54', '2021-5-18 22:31:57', 0);
INSERT INTO sys_menu VALUES ('8', '/sys/role/query', '', '', '查询角色', '', 1, '2', '2021-5-18 22:32:18', '2021-5-18 22:32:21', 0);
INSERT INTO sys_menu VALUES ('9', '/sys/role/edit/{id}', '', '', '编辑角色', '', 1, '2', '2021-5-18 22:32:34', '2021-5-18 22:32:36', 0);
```

创建角色权限表

```java
DROP TABLE IF EXISTS sys_role_menu;
CREATE TABLE sys_role_menu (
  id char(19) COLLATE utf8mb4_general_ci NOT NULL COMMENT '主键',
  role_id char(19) COLLATE utf8mb4_general_ci NOT NULL COMMENT '角色ID',
  menu_id char(19) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '权限ID',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='角色权限';
```

导入测试数据

```java
INSERT INTO sys_role_menu VALUES ('1', '1', '1');
INSERT INTO sys_role_menu VALUES ('10', '2', '1');
INSERT INTO sys_role_menu VALUES ('11', '2', '2');
INSERT INTO sys_role_menu VALUES ('12', '2', '3');
INSERT INTO sys_role_menu VALUES ('2', '1', '2');
INSERT INTO sys_role_menu VALUES ('3', '1', '3');
INSERT INTO sys_role_menu VALUES ('4', '1', '4');
INSERT INTO sys_role_menu VALUES ('5', '1', '5');
INSERT INTO sys_role_menu VALUES ('6', '1', '6');
INSERT INTO sys_role_menu VALUES ('7', '1', '7');
INSERT INTO sys_role_menu VALUES ('8', '1', '8');
INSERT INTO sys_role_menu VALUES ('9', '1', '9');
```

> 两个角色，admin角色拥有所有权限，user角色拥有查看权限
>
> 两个用户，admin用户拥有admin权限，user用户拥有user权限
