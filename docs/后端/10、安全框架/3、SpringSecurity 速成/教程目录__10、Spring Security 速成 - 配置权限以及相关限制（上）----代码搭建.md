# 10、Spring Security 速成 - 配置权限以及相关限制（上）----代码搭建
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/6/10.html
- 分类：安全框架
- 分组：教程目录
## 一、前言

市面上很多教程都说Spring Security是一个解决身份验证、授权管理的安全框架，截至目前，我们只讨论了身份验证，正如之前介绍过的，身份验证是应用程序标识资源的调用者的过程。前面的学习中我们并没有实现任何决定是否批准请求的规则。其中仅关注了系统是否知道该用户，即productConfig中的anyRequest,permitAll/authenticated.在大多数应用程序中，并非系统识别出的所有用户都能访问系统中的每个资源，这就牵扯出授权，**授权是系统决定已识别的客户端是否有权限访问所请求得资源得过程**。

在Spring Security中，一旦应用程序结束身份验证流程，**它就会将请求委托给一个授权过滤器。该过滤器会根据所配置的授权规则来允许或拒绝请求**。

这里将按照以下步骤讨论授权得所有必要细节。

- 了解权限是什么，并基于用户的权限对所有端点应用访问规则。
- 了解如何按角色对权限进行分组，以及如何基于用户的角色应用授权规则。

另外的，本节将涉及到有关RBAC的管理以及职责分离，所以我将带着大家重新写一个项目。当然关于RBAC的写法我浏览了很多项目，其实有非常多的写法，只要类似user管理role,role管理权限这样的基本都能算RBAC，但是考虑到SpringSecurity将role和authority归并到一起，只是通过ROLE_去区分角色和权限（这些后面都会再次提及，目前保留一个概念即可），所以我将使用自己理解的一种RBAC的管理去编码，大家也可以去gitee找到适合自己的方法去写，条条大路通罗马。

## 二、基于权限和角色限制访问

### 2.1、基于权限

这里将介绍授权和角色的概念。可以使用它们保护应用程序得所有端点。其中不同的用户具有不同的角色，不同的角色具有不用的权限，但是角色和权限均视为用户所拥有的权利，根据用户拥有的权利，他们只能执行特定的操作。**应用程序会将权利作为权限和角色来提供**。

我们在之前的学习中对于单独的Authority类实现了GrantedAuthority接口，但是并没有详细去使用，只是实现了它的getAuthority()方法，将权限名属性赋予这个get方法。那么从现在我们需要研究它的用途，下图展示了UserDetails契约和GrantedAuthority接口之间的关系。

我们可以从图中了解到权限就是用户可以使用系统资源执行的操作。**一个权限具有一个名称，对象的getAuthority()行为会将该名称作为String返回**。在定义自定义授权规则时，可以使用权限的名称。授权规则通常是“Jane被允许删除(delete)产品记录”或“John被允许读取(read)文档记录”。在这种情况下，**删除和读取就是被授予的权限**。

```java
public interface GrantedAuthority extends Serializable {
	String getAuthority();
}
```

UserDetails是Spring Security中描述用户的接口，它有一个GrantedAuthority实例的集合，如上图所示。可以允许用户拥有一个或多个权限。getAuthorities()方法会返回GrantedAuthority()实例的集合。可以在如下代码中查看这个方法。之所以实现这个方法，是为了让它返回授予用户的所有权限。身份验证结束之后，权限就会已登录用户的详细信息的一部分，应用程序可以使用它授予权限。

```java
public interface UserDetails extends Serializable {
   Collection<? extends GrantedAuthority> getAuthorities();
}
```

那么通常呢，我们将这个权限定义为Authority,这里需要和后面的role区分开，**但是在实际开发中，我们更多的看见的一般是菜单，菜单其实类似于我们的Authority,只是结构变为更加复杂的树形结构，也更便于区分，但是意义和Authority是一样的**。

### 2.2、基于角色

角色是表示用户做什么的另一种方式。**SpringSecurity将权限视为对其应用限制的细粒度权利。角色就像是用户的徽章。它们为用户提供一组操作的权利。有些应用程序总是为特定用户提供相同的权限组**。

为角色提供的名称与为权限提供的名称类似，这取决于我们自己。与权限相比，可以认为角色是细粒度的。**无论如何，在后台，角色都是使用Spring Security中的相同接口表示的，即GrantedAuthority。在定义角色时，其名称应该以ROLE_前缀开头**。在实现层面，**这个前缀表明了角色和权限之间的区别**。

如上图，如果在某个应用程序中，用户要么只有读写权限，要么拥有所有权限（crud)，在这种情况下，我们就可以为其创建两个用户去分别管理它所对应的权限组，而一个用户可以同时拥有一个或多个角色，一个角色也对应一个或多个权限，这种架构我们就称为RBAC管理架构。

那么下面我们就开始进行新项目的编码并且对关于Spring Security中的角色权限的相关接口进行更加细致的学习。

## 三、项目搭建

我们建造一个新的maven项目，maven依赖如下：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <parent>
        <artifactId>spring_security_parent</artifactId>
        <groupId>com.mbw</groupId>
        <version>1.0-SNAPSHOT</version>
    </parent>
    <modelVersion>4.0.0</modelVersion>
    <artifactId>spring_security_simple_web02</artifactId>
    <properties>
        <maven.compiler.source>8</maven.compiler.source>
        <maven.compiler.target>8</maven.compiler.target>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        <dependency>
            <groupId>com.baomidou</groupId>
            <artifactId>mybatis-plus-boot-starter</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-thymeleaf</artifactId>
        </dependency>
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
        </dependency>
        <dependency>
            <groupId>com.alibaba</groupId>
            <artifactId>fastjson</artifactId>
            <version>1.2.56</version>
        </dependency>
        <!--为yml自定义属性自动生成提示-->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-configuration-processor</artifactId>
        </dependency>
    </dependencies>
</project>
```

然后yaml如下：

```java
server:
  port: 9090
spring:
  datasource:
    driver-class-name: com.mysql.jdbc.Driver
    username: root
    password: 123456
    url: jdbc:mysql://127.0.0.1:3306/spring_security?useUnicode=true&characterEncoding=UTF-8&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Shanghai&nullCatalogMeansCurrent=true
mybatis-plus:
  mapper-locations: classpath:/mapper/**/*.xml,classpath:/META-INF/modeler-mybatis-mappings/*.xml
  typeAliasesPackage: com.mbw.pojo
  global-config:
    banner: false
  configuration:
    map-underscore-to-camel-case: false
    cache-enabled: false
    call-setters-on-nulls: true
    jdbc-type-for-null: 'null'
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl
```

接着我们需要创建users,roles,authorities,以及中间表，user_role,role_authority

```sql
-- 
--------
-- Table structure for users
-- 
--------
DROP TABLE IF EXISTS users;
CREATE TABLE users  (
  id bigint(20) NOT NULL,
  username varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  password varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  mobile varchar(11) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  email varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  enabled tinyint(1) NULL DEFAULT NULL,
  PRIMARY KEY (id) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;
-- 
--------
-- Records of users
-- 
--------
INSERT INTO users VALUES (1580099436639481858, '张飞', '{bcrypt}$2a$10$QQ9JPjhBcX1XVwhlAmYy5.57Im4c6tGYZh./cGZwS2LqIFCjv4Qke', '18576345294', '1485924969@qq.com', 1);
INSERT INTO users VALUES (1583381616086003713, '刘备', '{bcrypt}$2a$10$PhvJ9iXj/IQw35mHA.c1TevBXiZ7toWafQfOIGITfv8vM9m75Sbay', '18170075966', '1485924969@qq.com', 1);
-- 
--------
DROP TABLE IF EXISTS roles;
CREATE TABLE roles  (
  id bigint(20) NOT NULL,
  roleName varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (id) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;
-- 
--------
-- Records of roles
-- 
--------
INSERT INTO roles VALUES (1580101763882618881, '管理员');
INSERT INTO roles VALUES (2259225272127586304, 'ADMIN');
INSERT INTO roles VALUES (2299388013789372417, 'USER');
DROP TABLE IF EXISTS authorities;
CREATE TABLE authorities  (
  id bigint(20) NOT NULL,
  authorityName varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (id) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;
-- 
--------
-- Records of authorities
-- 
--------
INSERT INTO authorities VALUES (2970710450550485029, 'read');
INSERT INTO authorities VALUES (2971247443118264330, 'write');
DROP TABLE IF EXISTS user_role;
CREATE TABLE user_role  (
  id bigint(20) NOT NULL,
  roleId bigint(20) NULL DEFAULT NULL,
  userId bigint(20) NULL DEFAULT NULL,
  PRIMARY KEY (id) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;
-- 
--------
-- Records of user_role
-- 
--------
INSERT INTO user_role VALUES (1580099436769505282, 2299388013789372417, 1580099436639481858);
INSERT INTO user_role VALUES (1583381616245387266, 1580101763882618881, 1583381616086003713);
INSERT INTO user_role VALUES (1583381616354439170, 2299388013789372417, 1583381616086003713);
DROP TABLE IF EXISTS role_authority;
CREATE TABLE role_authority  (
  id bigint(20) NOT NULL,
  roleId bigint(20) NOT NULL COMMENT '角色Id',
  authorityId bigint(20) NOT NULL COMMENT '权限Id',
  PRIMARY KEY (id) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;
-- 
--------
-- Records of role_authority
-- 
--------
INSERT INTO role_authority VALUES (1580101764591456258, 1580101763882618881, 2970710450550485029);
INSERT INTO role_authority VALUES (1580101764771811329, 2299388013789372417, 2970710450550485029);
INSERT INTO role_authority VALUES (1580118642791585029, 1580101763882618881, 2971247443118264330);
```

然后创建实体类，这里我打算使用职责分离对我们实际开发中的User和SpringSecurity识别的User即UserDetails进行分离，也就是说我们的UserDetails可以封装我们的User类，但是我们的User和UserDetails实际上是没有关联的，User就是User.那么Role,Authority同理，他们也和GrantedAuthority没有关系，而GrantedAuthority届时会封装Authority类中的authorityName和ROLE_(Role类中的roleName)。

那么这边我们创建分离后的User,Role,Authority以及他们的中间关系实体类：

**User.java**

```java
package com.mbw.pojo;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.*;
import java.io.Serializable;
import java.util.Set;
@TableName("users")
@Data
@AllArgsConstructor
@NoArgsConstructor
@ToString
public class User implements Serializable {
    @TableId(type=IdType.ASSIGN_ID)
    private Long id;
    @TableField("username")
    private String username;
    @TableField("mobile")
    private String mobile;
    @TableField("password")
    private String password;
    @TableField("email")
    private String email;
    @TableField("enabled")
    private Boolean enabled;
    @TableField(exist = false)
    private Set<Role> roles;
    /**
     * 图片验证码
     */
    @TableField(exist = false)
    private String captcha;
    /**
     * uuid
     */
    @TableField(exist = false)
    private String uuid;
}
```

**Role.java**

```java
package com.mbw.pojo;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Set;
@TableName("roles")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Role {
    @TableId(type = IdType.ASSIGN_ID)
    private Long id;
    @TableField("roleName")
    private String roleName;
    @TableField(exist = false)
    private Set<Authority> authorities;
}
```

**Authority.java**

```java
package com.mbw.pojo;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
@TableName("authorities")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Authority {
    @TableId(type = IdType.ASSIGN_ID)
    private Long id;
    @TableField("authorityName")
    private String authorityName;
}
```

**UserRole.java**

```java
package com.mbw.pojo;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
@TableName("user_role")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserRole {
    @TableId(type= IdType.ASSIGN_ID)
    private Long id;
    @TableField("userId")
    private Long userId;
    @TableField("roleId")
    private Long roleId;
}
```

RoleAuthority.java

```java
package com.mbw.pojo;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
@TableName("role_authority")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class RoleAuthority {
    @TableId(type = IdType.ASSIGN_ID)
    private Long id;
    @TableField("roleId")
    private Long roleId;
    @TableField("authorityId")
    private Long authorityId;
}
```

然后是mapper

**UserMapper.java**

主要是检查用户名/手机号是否唯一方法以及通过用户名查询用户方法

```java
package com.mbw.mapper;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.mbw.pojo.User;
import org.apache.ibatis.annotations.Mapper;
@Mapper
public interface UserMapper extends BaseMapper<User> {
   User queryUserByUsername(String username);
   User checkUsernameUnique(String userName);
   User checkPhoneUnique(String phone);
}
```

**UserMapper.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.mbw.mapper.UserMapper">
    <resultMap id="queryUserMap" type="com.mbw.pojo.User" autoMapping="true">
        <id column="id" property="id"/>
        <collection property="roles" ofType="com.mbw.pojo.Role" autoMapping="true" columnPrefix="r_">
            <id column="id" property="id"/>
            <result column="roleName" property="roleName"/>
        </collection>
    </resultMap>
    <select id="queryUserByUsername" resultMap="queryUserMap">
        SELECT u.*,
               r.id AS r_id,
               r.roleName AS r_roleName
        from users u
                 LEFT JOIN user_role ur
                           ON u.id = ur.userId
                 LEFT JOIN roles r
                           ON r.id = ur.roleId
        WHERE u.username ={username}
          AND u.enabled != 0
    </select>
    <select id="checkUsernameUnique" resultType="com.mbw.pojo.User">
        select u.id,u.username from users u where u.username ={username} limit 1
    </select>
    <select id="checkPhoneUnique" resultType="com.mbw.pojo.User">
        select u.id,u.username from users u where u.mobile ={mobile} limit 1
    </select>
</mapper>
```

**RoleMapper.java**

主要有查询全部权限以及根据用户名获取所有权限

```java
package com.mbw.mapper;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.mbw.pojo.Role;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;
@Mapper
public interface RoleMapper extends BaseMapper<Role> {
    List<Role> queryAllRoleByRoleName();
    /**
     * 根据用户名获取角色
     *
     * @param username
     * @return List<SysRole>
     */
    List<Role> loadRolesByUsername(@Param("username") String username);
}
```

RoleMapper.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.mbw.mapper.RoleMapper">
    <resultMap id="queryRoleMap" type="com.mbw.pojo.Role">
        <id property="id" column="id"/>
        <result property="roleName" column="roleName"/>
        <collection property="authorities" ofType="com.mbw.pojo.Authority" autoMapping="true" columnPrefix="a_">
            <id property="id" column="id"/>
            <result property="authorityName" column="authorityName"/>
        </collection>
    </resultMap>
    <select id="queryAllRoleByRoleName" resultType="com.mbw.pojo.Role">
        SELECT r.*,
               a.id AS a_id,
               a.authorityName AS a_authorityName
               FROM roles r
        LEFT JOIN role_authority ra ON r.id = ra.roleId
        LEFT JOIN authority a ON a.id = ra.authorityId
    </select>
    <select id="loadRolesByUsername" resultType="com.mbw.pojo.Role">
        select r.*
        from roles r,
             user_role ur,
             users u where r.id = ur.roleId and u.id = ur.userId
        and u.username ={username}
    </select>
</mapper>
```

AuthorityMapper.java

```java
package com.mbw.mapper;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.mbw.pojo.Authority;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;
import java.util.Set;
@Mapper
public interface AuthorityMapper extends BaseMapper<Authority> {
    /**
     * 通过角色名称list查询菜单权限
     */
    List<Authority> loadPermissionByRoleCode(@Param("roleInfos") Set<String> roleInfos);
}
```

AuthorityMapper.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.mbw.mapper.AuthorityMapper">
    <resultMap type="com.mbw.pojo.Authority" id="SysMenuMap">
        <result property="id" column="id" />
        <result property="authorityName" column="authorityName" />
    </resultMap>
    <select id="loadPermissionByRoleCode" resultMap="SysMenuMap">
        select
        a.id,a.authorityName
        from authorities a
        left join role_authority ra on a.id = ra.authorityId
        left join roles r on r.id = ra.roleId
        where r.roleName in
        <foreach collection="roleInfos" item="roleInfo" open="(" separator="," close=")">
           {roleInfo}
        </foreach>
    </select>
</mapper>
```

中间关系实体类的mapper没有什么方法，大家自己写一下，实现下BaseMapper即可，这里不做过多展示。

然后是Service,这里同样也体现了职责分离，即UserService和UserDetailsService，意义同之前的User和UserDetails

**UserService.java**

```java
package com.mbw.service;
import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.ObjectUtil;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mbw.common.utils.Result;
import com.mbw.common.utils.UserConstants;
import com.mbw.mapper.RoleMapper;
import com.mbw.mapper.UserMapper;
import com.mbw.mapper.UserRoleMapper;
import com.mbw.pojo.Role;
import com.mbw.pojo.User;
import com.mbw.pojo.UserRole;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.Set;
import java.util.stream.Stream;
@Service
public class UserService extends ServiceImpl<UserMapper, User> {
    @Autowired
    private UserMapper userMapper;
    @Autowired
    private RoleMapper roleMapper;
    @Autowired
    private UserRoleMapper userRoleMapper;
    @Autowired
    private PasswordEncoder passwordEncoder;
    public User getUserByName(String userName) {
        return userMapper.queryUserByUsername(userName);
    }
    public String checkPhoneUnique(User user) {
        Long userId = ObjectUtil.isEmpty(user.getId()) ? -1: user.getId();
        User info = userMapper.checkPhoneUnique(user.getMobile());
        if (ObjectUtil.isNotEmpty(info) && !info.getId().equals(userId))
        {
            return UserConstants.USER_PHONE_NOT_UNIQUE;
        }
        return UserConstants.USER_PHONE_UNIQUE;
    }
    public String checkUserNameUnique(User user) {
        Long userId = ObjectUtil.isEmpty(user.getId()) ? -1: user.getId();
        User info = userMapper.checkUsernameUnique(user.getUsername());
        if (ObjectUtil.isNotEmpty(info) && !info.getId().equals(userId))
        {
            return UserConstants.USER_NAME_NOT_UNIQUE;
        }
        return UserConstants.USER_NAME_UNIQUE;
    }
    public Result createUser(User user) {
        Set<Role> roles = user.getRoles();
        if(CollUtil.isNotEmpty(roles)){
            String passwordNotEncode = user.getPassword();
            String passwordEncode = passwordEncoder.encode(passwordNotEncode);
            user.setPassword(passwordEncode);
            userMapper.insert(user);
            Stream<Long> roleIds = roles.stream().map(Role::getId);
            roleIds.forEach(roleId->{
                Role role = roleMapper.selectById(roleId);
                if(role != null){
                    Long userId = user.getId();
                    UserRole userRole = new UserRole();
                    userRole.setUserId(userId);
                    userRole.setRoleId(roleId);
                    userRoleMapper.insert(userRole);
                }
            });
            return Result.ok().message("添加成功");
        }
        return Result.error().message("添加失败");
    }
}
```

**RoleService.java**

```java
package com.mbw.service;
import cn.hutool.core.collection.CollUtil;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mbw.mapper.AuthorityMapper;
import com.mbw.mapper.RoleAuthorityMapper;
import com.mbw.mapper.RoleMapper;
import com.mbw.pojo.Authority;
import com.mbw.pojo.Role;
import com.mbw.pojo.RoleAuthority;
import org.apache.ibatis.annotations.Param;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Set;
import java.util.stream.Stream;
@Service
public class RoleService extends ServiceImpl<RoleMapper, Role> {
    @Autowired
    private RoleMapper roleMapper;
    @Autowired
    private AuthorityMapper authorityMapper;
    @Autowired
    private RoleAuthorityMapper roleAuthorityMapper;
    public List<Role> queryAllRoleByRoleName(){
        return roleMapper.queryAllRoleByRoleName();
    }
    public void saveRole(Role role){
        Set<Authority> authorities = role.getAuthorities();
        if(CollUtil.isNotEmpty(authorities)){
            Stream<Long> authorityIds = authorities.stream().map(Authority::getId);
            roleMapper.insert(role);
            authorityIds.forEach(authorityId->{
                Authority authority = authorityMapper.selectById(authorityId);
                if(authority != null){
                    RoleAuthority roleAuthority = new RoleAuthority();
                    roleAuthority.setRoleId(role.getId());
                    roleAuthority.setAuthorityId(authorityId);
                    roleAuthorityMapper.insert(roleAuthority);
                }
            });
        }
    }
    public List<Role> loadRolesByUsername(String username){
        return roleMapper.loadRolesByUsername(username);
    }
}
```

然后是controller

UserController.java

```java
package com.mbw.controller;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.mbw.common.utils.Result;
import com.mbw.common.utils.UserConstants;
import com.mbw.pojo.User;
import com.mbw.security.utils.SecurityUtil;
import com.mbw.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.concurrent.DelegatingSecurityContextCallable;
import org.springframework.security.concurrent.DelegatingSecurityContextExecutor;
import org.springframework.security.concurrent.DelegatingSecurityContextExecutorService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import javax.annotation.Resource;
import java.util.Objects;
import java.util.concurrent.*;
@RestController
@RequestMapping("/user")
public class UserController {
    @Autowired
    private UserService userService;
    @PostMapping("/create")
    public Result createUser(@RequestBody User user){
        if (UserConstants.USER_PHONE_NOT_UNIQUE.equals(userService.checkPhoneUnique(user))){
            return Result.error().message("手机号已存在");
        }
        if (UserConstants.USER_NAME_NOT_UNIQUE.equals(userService.checkUserNameUnique(user))){
            return Result.error().message("用户名已存在");
        }
        return userService.createUser(user);
    }
    @GetMapping("/hello")
    public String hello(){
        SecurityContext context = SecurityContextHolder.getContext();
        Authentication authentication = context.getAuthentication();
        return "Hello," + authentication.getName() + "!";
    }
    @GetMapping("/error")
    public String error(){
        return "403 error";
    }
}
```

这里需要用到一个UserConstants常量类以及一个结果类Result：

**UserConstants.java**

```java
package com.mbw.common.utils;
/**
 * 用户常量信息
 */
public class UserConstants {
    /**
     * 岗位名称是否唯一的返回结果码
     */
    public final static String JOB_NAME_UNIQUE = "0";
    public final static String JOB_NAME_NOT_UNIQUE = "1";
    /**
     * 用户名名称是否唯一的返回结果码
     */
    public final static String USER_NAME_UNIQUE = "0";
    public final static String USER_NAME_NOT_UNIQUE = "1";
    /**
     * 部门名称是否唯一的返回结果码
     */
    public final static String DEPT_NAME_UNIQUE = "0";
    public final static String DEPT_NAME_NOT_UNIQUE = "1";
    /**
     * 手机号码是否唯一的返回结果
     */
    public final static String USER_PHONE_UNIQUE = "0";
    public final static String USER_PHONE_NOT_UNIQUE = "1";
    /**
     * 是否唯一的返回结果
     */
    public final static String UNIQUE = "0";
    public final static String NOT_UNIQUE = "1";
    /**
     * 部门停用状态
     */
    public static final String DEPT_DISABLE = "0";
    /**
     * 部门正常状态
     */
    public static final String DEPT_NORMAL = "1";
    /**
     * 全部数据权限
     */
    public static final String DATA_SCOPE_ALL = "1";
    /**
     * 自定数据权限
     */
    public static final String DATA_SCOPE_CUSTOM = "2";
    /**
     * 部门数据权限
     */
    public static final String DATA_SCOPE_DEPT = "3";
    /**
     * 部门及以下数据权限
     */
    public static final String DATA_SCOPE_DEPT_AND_CHILD = "4";
    /**
     * 仅本人数据权限
     */
    public static final String DATA_SCOPE_SELF = "5";
    /**
     * 数据权限过滤关键字
     */
    public static final String DATA_SCOPE = "dataScope";
    public static final String LOGIN_TYPE_JSON = "JSON";
    public static final String TOKEN_PREFIX = "Bearer ";
    public static final String TOKEN_REDIS_KEY = "login_token_key:";
    public static final String CAPTCHA_CODE_KEY = "captcha_code_key:";
    public static final String TOKEN_KEY = "token_key";
    public static final String UNKNOWN_IP = "XX XX";
    public static final String APPLICATION_JSON_UTF8_VALUE = "application/json;charset=UTF-8";
}
```

**Result.java**

```java
package com.mbw.common.utils;
import lombok.Data;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
/**
 * 统一返回结果的类
 */
@Data
public class Result<T> implements Serializable {
    private Boolean success;
    private Integer code;
    private String msg;
    private Long count;
    private List<T> data = new ArrayList<T>();
    private String jwt;
    /**
     * 把构造方法私有
     */
    private Result() {
     }
    /**
     * 成功静态方法
     * @return
     */
    public static Result ok() {
        Result r = new Result();
        r.setSuccess(true);
        r.setCode(ResultCode.SUCCESS);
        r.setMsg("成功");
        return r;
    }
    /**
     * 失败静态方法
     * @return
     */
    public static Result error() {
        Result r = new Result();
        r.setSuccess(false);
        r.setCode(ResultCode.ERROR);
        r.setMsg("失败");
        return r;
    }
    public static Result judge(int n,String msg){
        return n > 0 ? ok().message(msg + "成功") : error().message(msg +"失败");
    }
    public Result success(Boolean success){
        this.setSuccess(success);
        return this;
    }
    public Result message(String message){
        this.setMsg(message);
        return this;
    }
    public Result code(Integer code){
        this.setCode(code);
        return this;
    }
    public Result data(List<T> list){
        this.data.addAll(list);
        return this;
    }
    public Result count(Long count){
        this.count = count;
        return this;
    }
    public Result jwt(String jwt){
        this.jwt = jwt;
        return this;
    }
}
```

**RoleController.java**

```java
package com.mbw.controller;
        import com.mbw.pojo.Role;
        import com.mbw.service.RoleService;
        import org.springframework.beans.factory.annotation.Autowired;
        import org.springframework.web.bind.annotation.PostMapping;
        import org.springframework.web.bind.annotation.RequestBody;
        import org.springframework.web.bind.annotation.RequestMapping;
        import org.springframework.web.bind.annotation.RestController;
@RestController
@RequestMapping("/role")
public class RoleController {
    @Autowired
    private RoleService roleService;
    @PostMapping("/create")
    public void createRole(@RequestBody Role role){
        roleService.saveRole(role);
    }
}
```

**HomeController.java**

```java
package com.mbw.controller;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
@Controller
public class HomeController {
	@GetMapping("/home")
	public String home(){
		return "home";
	}
	@GetMapping("/error")
	public String error(){
		return "error";
	}
}
```

上面的准备工作做完后，就可以开始Security层面的编码工作了

首先我们建造Security识别的用户JwtUserDto类，将这个类实现UserDtails接口。

**JwtUserDto.java**

```java
package com.mbw.security.dto;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.mbw.pojo.Role;
import com.mbw.pojo.User;
import lombok.Data;
import lombok.ToString;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Set;
@Data
@ToString
public class JwtUserDto implements UserDetails {
    /**
     * 用户唯一标识
     */
    private String token;
    /**
     * 登陆时间
     */
    private Long loginTime;
    /**
     * 过期时间
     */
    private Long expireTime;
    private User user;
    private Set<Role> roleInfo;
    /**
     * 用户权限的集合
     */
    @JsonIgnore
    private List<String> authorityNames;
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        ArrayList<SimpleGrantedAuthority> authorities = new ArrayList<>();
        authorityNames.forEach(authorityName->authorities.add(new SimpleGrantedAuthority(authorityName)));
        return authorities;
    }
    @Override
    public String getPassword() {
        return user.getPassword();
    }
    @Override
    public String getUsername() {
        return user.getUsername();
    }
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }
    @Override
    public boolean isAccountNonLocked() {
        return true;
    }
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }
    @Override
    public boolean isEnabled() {
        return user.getEnabled();
    }
    public JwtUserDto(User user, Set<Role> roleInfo, List<String> authorityNames) {
        this.user = user;
        this.roleInfo = roleInfo;
        this.authorityNames = authorityNames;
    }
}
```

首先token,loginTime,expireTime可以先不管

我们可以看到我们的User类，然后通过Set封装Role代表用户所拥有的所有角色，List封装了authorityNames代表SpringSecurity识别的所有权限名，所以这里泛型是String,注意这里是SpringSecurity识别的所有权限名，所以既有权限名,也有带着ROLE_前缀的角色名，并且通过一个构造方法通过他们构造出一个UserDetails.

然后就是一定要实现的getAuthorities()，这里我的想法是既然我将authorityNames这个属性代表了所有的角色名和权限名，那么我完全可以通过该属性去实现该方法，通过Stream流的方式将authorityNames的每个权限名封装进new出来的SimpleGrantedAuthority，那我们都知道SimpleGrantedAuthority是Authority的实现类。所以该方法自然能够通过。

那么看到这儿你可能会有疑问，怎么将Authority类的authorityName和Role的roleName联系起来并放进这个AuthorityNames属性呢，这个其实很简单，我们可以通过UserDetailsService搞定它：

**UserDetailsServiceImpl.java**

```java
package com.mbw.security.service;
import cn.hutool.core.util.StrUtil;
import com.mbw.mapper.AuthorityMapper;
import com.mbw.pojo.Authority;
import com.mbw.pojo.Role;
import com.mbw.pojo.User;
import com.mbw.security.dto.JwtUserDto;
import com.mbw.service.RoleService;
import com.mbw.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
@Service
public class UserDetailsServiceImpl implements UserDetailsService {
    @Autowired
    private UserService userService;
    @Autowired
    private RoleService roleService;
    @Autowired
    private AuthorityMapper authorityMapper;
    @Override
    public JwtUserDto loadUserByUsername(String username) throws UsernameNotFoundException {
        // 根据用户名获取用户
        User user = userService.getUserByName(username);
        if (user == null ){
            throw new BadCredentialsException("用户名或密码错误");
        }
        List<Role> roles = roleService.loadRolesByUsername(username);
        Set<String> roleInfos = roles.stream().map(Role::getRoleName).collect(Collectors.toSet());
        List<Authority> authorities = authorityMapper.loadPermissionByRoleCode(roleInfos);
        List<String> authorityNames = authorities.stream().map(Authority::getAuthorityName).filter(StrUtil::isNotEmpty).collect(Collectors.toList());
        authorityNames.addAll(roleInfos.stream().map(roleName->"ROLE_"+roleName).collect(Collectors.toList()));
        return new JwtUserDto(user, new HashSet<>(roles), authorityNames);
    }
}
```

可以看到我们之前Mapper定义的通过用户名，角色名查询角色，权限的接口就有了用处，我们查出了角色名后通过Stream流的方式将roleName加上ROLE_前缀后加入到authorityNames集合中，这样就完成了之前的问题。我们目前只要登陆就可以获取到他的角色名，权限名。

然后我们在写上我们之前学习过的SuccessHandler和FailtureHandler

**CommonLoginSuccessHandler.java**

这里我只打印了一下获取的所有权限名

```java
package com.mbw.handler;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
@Component
@Slf4j
public class CommonLoginSuccessHandler implements AuthenticationSuccessHandler {
	@Override
	public void onAuthenticationSuccess(HttpServletRequest request,
										HttpServletResponse response,
										Authentication authentication) throws IOException, ServletException {
		log.info(authentication.getAuthorities().toString());
	}
}
```

**CommonLoginFailureHandler.java**

CommonLoginFailureHandler逻辑和之前学习的一致

```java
package com.mbw.handler;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.LocalDateTime;
@Component
@Slf4j
public class CommonLoginFailureHandler implements AuthenticationFailureHandler {
	@Override
	public void onAuthenticationFailure(HttpServletRequest request,
										HttpServletResponse response,
										AuthenticationException exception) throws IOException, ServletException {
		log.warn("认证失败");
		response.setHeader("failed", LocalDateTime.now().toString());
	}
}
```

然后写完配置类即可：

SpringSecurityConfig.java

```java
package com.mbw.security.config;
import com.mbw.handler.CommonLoginFailureHandler;
import com.mbw.handler.CommonLoginSuccessHandler;
import com.mbw.security.service.UserDetailsServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.DelegatingPasswordEncoder;
import org.springframework.security.crypto.password.NoOpPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.crypto.scrypt.SCryptPasswordEncoder;
import java.util.HashMap;
@Configuration
@RequiredArgsConstructor
@EnableAsync
public class SpringSecurityConfig extends WebSecurityConfigurerAdapter {
	private final UserDetailsServiceImpl commonUserDetailServiceImpl;
	private final CommonLoginSuccessHandler successHandler;
	private final CommonLoginFailureHandler failureHandler;
	@Override
	protected void configure(HttpSecurity http) throws Exception {
		http.csrf().disable()
                .logout()
                .and()
				.formLogin()
				.successHandler(successHandler)
				.failureHandler(failureHandler)
				.and().httpBasic().and()
				.authorizeRequests()
				.antMatchers("/login","/user/create").permitAll()
				.anyRequest().authenticated();
	}
	@Override
	protected void configure(AuthenticationManagerBuilder auth) throws Exception {
		auth.userDetailsService(commonUserDetailServiceImpl)
				.passwordEncoder(passwordEncoder());
	}
	@Bean
	public PasswordEncoder passwordEncoder() {
		HashMap<String, PasswordEncoder> encoders = new HashMap<>();
		encoders.put("noop", NoOpPasswordEncoder.getInstance());
		encoders.put("bcrypt", new BCryptPasswordEncoder());
		encoders.put("scrypt", new SCryptPasswordEncoder());
		return new DelegatingPasswordEncoder("bcrypt", encoders);
	}
}
```

然后写完启动类测试一下：

```java
package com.mbw;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
@EnableWebSecurity
@SpringBootApplication
public class SecurityApplication {
    public static void main(String[] args) {
        SpringApplication.run(SecurityApplication.class,args);
    }
}
```

打开项目，访问个接口/user/hello,被重定向到登录页面，我们登录张飞这个用户，张飞这个用户的角色是User,只拥有读权限：

登陆后看日志，发现权限确实是这样：

至此我们就完成了项目搭建，并且也完成了RBAC的管理。将User和UserDetails分离开来，并且按照SpringSecurity的规则将role和Authority封装到一起，那么下一节我们在该项目架构上将学习授权的详细内容。记住，这个架构大家可以看作实际开发的超级简化版，该架构在未来还有非常多需要改进的地方，但是希望大家能够吸收该架构的一个基础的意识，当然大家有更好的意见也可以在评论区进行分享。

最后呢，我们对我们的认证成功的类进行下改进

**CommonLoginSuccessHandler.java**

```java
package com.mbw.handler;
import com.mbw.security.dto.JwtUserDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Collection;
import java.util.Optional;
@Component
@Slf4j
public class CommonLoginSuccessHandler implements AuthenticationSuccessHandler {
	@Override
	public void onAuthenticationSuccess(HttpServletRequest request,
										HttpServletResponse response,
										Authentication authentication) throws IOException, ServletException {
		Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
		Optional<String> auth = authorities.stream().map(GrantedAuthority::getAuthority).filter(a -> a.equals("read")).findFirst();
		log.info("auth:{}",authorities);
		if(auth.isPresent()){
			log.info("您有足够的权限访问此资源");
			response.sendRedirect("/user/hello");
		}else {
			log.info("您没有足够的权限访问此资源");
			response.sendRedirect("/user/error");
		}
	}
}
```

关于前端页面，大家随便写写就行，主要将名字定义为home.html和error.html即可，那么这节就先到这里，代码内容比较多，希望大家好好理解
