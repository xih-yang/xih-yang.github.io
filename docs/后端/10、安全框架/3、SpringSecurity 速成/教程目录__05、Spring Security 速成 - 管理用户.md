# 05、Spring Security 速成 - 管理用户
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/6/5.html
- 分类：安全框架
- 分组：教程目录
## 一、前言

本章将带你详细理解我们之前处理的首个示例中所遇到的一个基本角色–UserDetailsService，除了UserDetailsService，我们还将讨论

- **UserDetails,它会描述Spring Security的用户**
- **GrantedAuthority,它允许我们定义用户可以执行的操作**。
- **如何通过MybatisPlus结合UserDetailsService进行用户认证**

在之前的学习中，我们已经对UserDetails和PasswordEncoder在身份验证过程中的角色有大致的了解。但是其中仅讨论了如何插入所定义的实例，而不是使用SpringBoot配置的默认实例。另外还有更多细节要讨论：

- Spring Security提供了哪些实现以及如何使用它们
- 如何为契约定义一个自定义实现以及何时需要这样做
- 真实应用程序中使用的实现接口的方式
- 使用这些接口的最佳实践

## 二、在Spring Security中实现身份验证

上面的架构想必大家已经非常熟悉了，这个阴影框就是我们这次首先要处理的组件：UserDetailsService和PasswordEncoder。这两个组件主要关注流程的部分，通常将其称为“用户管理部分”。在本章中，UserDetailsService和PasswordEncoder是直接处理用户详细信息及其凭据的组件。目前这一章我们主要详细讨论UserDetailsService.

作为用户管理的一部分，我们使用了UserDetailsService和UserDetailsManager(UserDetailsService的扩展）接口。UserDetailsService只负责按用户名检索用户

```java
public interface UserDetailsService {
	UserDetails loadUserByUsername(String username) throws UsernameNotFoundException;
}
```

此操作是框架完成身份验证所需的唯一操作。**UserDetailsManager则在其基础上添加了对用户添加、修改、删除的行**为，这是大多数应用程序中必需的功能，虽然**我们完全也可以自己定义**，UserDetailsManager接口扩展UserDetailsService接口是体现接口分离原则的一个很好的例子，分离接口可以提供更好的灵活性，因为框架不会强迫我们在应用程序不需要的时候实现行为，如果应用程序只需要验证用户，那么实现UserDetailsService契约就足以覆盖所需功能。而如果需要真正管理用户，我们就可以在其基础上自己扩展管理用户的功能亦或者直接实现UserDetailsManager的接口。

但是如果要管理用户，首先我们需要用户这样一个去描述它的接口（契约），Spring Security给我们提供了UserDetails,我们必须实现它以便使用框架理解的方式（UserDetailsService只识别它）去描述用户。而用户又拥有一组权限，Spring Security使用GrantedAuthority表示用户所具有的权限，下图就是用户管理部分组件之间的关系：

理解Spring Security架构中这些对象之间的联系以及实现它们的方法，可以为我们处理应用程序时提供广泛的选项以供选择。

那么下面我们就从如何描述用户开始讲解

### 2.1、描述用户

#### 2.1.1、UserDetails接口

要与用户打交道，首先需要了解如何在应用程序中定义**用户的原型**,对于Spring Security,用户定义应该遵循UserDetails契约。UserDetails契约代表着Spring Security所理解的用户。描述用户的类必须实现该接口。

如下是UserDetails接口:

```java
public interface UserDetails extends Serializable {
	/**
	 * 将应用程序用户的权限返回成一个GrantedAuthority实例集合
	 */
	Collection<? extends GrantedAuthority> getAuthorities();
	/**
	 * 下面2个方法会返回用户凭据
	 */
	String getPassword();
	String getUsername();
	/**
	 * 出于不同的原因，这4个方法会启用或禁用账户
	 */
	boolean isAccountNonExpired();
	boolean isAccountNonLocked();
	boolean isCredentialsNonExpired();
	boolean isEnabled();
}
```

总结一下，getUsername()和getPassword()方法会返回用户名和密码。应用程序在身体验证过程中将使用这些值，并且这些值是与本契约中身份验证相关的唯一详情。其他的5个方法都与授权用户访问应用程序资源有关。例如getAuthorities()返回授予用户的权限组。

此外，正如UserDetails所示，用户可以

- 使账户过期
- 锁定账户
- 使凭据过期
- 禁用账户

如果选择在应用程序的逻辑中实现这些对用户的约束限制，则需要重写以下方法：isAccountNonExpired()，isAccountNonLocked()，isCredentialsNonExpired()，isEnabled()，这样那些需要被启用的就会返回true.有些人可能会觉得这些方法的取名从编码的干净性和可维护性角度看并不明智，例如，isAccountNonExpired()看起来想一个双重否定，乍一看可能会造成混淆，但是注意仔细从结果的角度去分析这四个方法，**它们的命名使它们在授权应该失败的情况下都返回false,否则返回true.这是正确的做法**，因为人脑更倾向于把false和负面联系在一起。另外，如果不需要在应用程序中实现这些功能，那么只需要让这4个方法返回true即可。

#### 2.1.2、GrantedAuthority

正如前一小节说的，授予用户的操作被称为权限。要描述Spring Security的权限，可以使用GrantedAuthority接口，它表示授予用户的权限。用户可以没有任何权限，也可以拥有任意数量的权限，通常他们至少有一个权限。下面是GrantedAuthority定义的实现：

```java
public interface GrantedAuthority extends Serializable {
	String getAuthority();
}
```

要创建一个权限，只需要为该权限找到一个名称即可，我们后面会实现getAuthority()方法，以便以String形式返回权限名，GrantedAuthority接口只有一个抽象方法，我们后面将会通过lambada表达式的例子实现它亦或者通过它的实现类SimpleGrantedAuthority创建权限实例：

SimpleGrantedAuthority类提供了一种创建GrantedAuthority类型的不可变实例的方法，在构建实例时需要提供权限名称。下面的代码包含了实现GrantedAuthority的两个示例：

```java
   GrantedAuthority g1 = ()->"READ";
   GrantedAuthority g2 =new SimpleGrantedAuthority("READ");
```

#### 2.1.3、UserDetails的最小化实现

本节将编写UserDetails的最小化实现。我们从一个基本实现开始，其中每个方法都返回一个静态值。我们后面会将其改为实际场景中更容易使用的版本，并且允许使用多个不同的用户实例。既然我们之前已经了解了UserDetails和GrantedAuthority接口，就可以为应用程序编写最简单的用户定义。

我们使用一个名为DummyUser的类实现一个用户的最小描述，这里主要就是为了展示如何实现UserDetails接口的方法：

```java
package com.mbw.pojo;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import java.util.ArrayList;
import java.util.Collection;
public class DummyUser implements UserDetails {
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        ArrayList<GrantedAuthority> grantedAuthorities = new ArrayList<>();
        grantedAuthorities.add(()->"READ");
        return grantedAuthorities;
    }
    @Override
    public String getPassword() {
        return "12345";
    }
    @Override
    public String getUsername() {
        return "mbw";
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
        return true;
    }
}
```

如上面代码。我实现了UserDetails接口，并且需要实现它的所有方法。这里是getUsername()和getPassword()的实现。在本示例中，这些方法仅为每个属性返回一个固定值。

接着我们实现了getAuthorities方法，返回了一个只有一个权限的集合。

最后，必须为UserDeatils接口的最后4个方法添加一个实现。对于DummyUser类，它们总是返回true，这意味着用户总是永远可以活动和可用的。

当然，这种最小化实现的所有实例永远都在只代表着同一个用户–mbw。只是理解UserDetails的良好开端，但在实际应用程序中并不会这样做。对于一个真实的应用程序而言，我们应该创建一个类，用于生成可以代表不同用户的实例。那么后面我们就将结合mybatisplus去构建一个可以持久化用户的实例，在学习如何使用UserDetailsService管理用户之前，我们先将User和Authority类结合Mybatisplus建好。

#### 2.1.4、结合Mybatisplus实现UserDetails和GrantedAuthority

首先我们建造spring_security数据库，然后在里面建造三张表：user用户表,authority权限表,user_authority用户-权限中间关系表，建表语句如下：

```sql
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
-- 
--------
-- Table structure for authorities
-- 
--------
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
-- 
--------
-- Table structure for user_authority
-- 
--------
DROP TABLE IF EXISTS user_authority;
CREATE TABLE user_authority  (
  id bigint(20) NOT NULL,
  userId bigint(20) NOT NULL COMMENT '用户Id',
  authorityId bigint(20) NOT NULL COMMENT '权限Id',
  PRIMARY KEY (id) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;
-- 
--------
-- Records of user_authority
-- 
--------
INSERT INTO user_authority VALUES (2971669583307083780, 2999623538338967560, 2970710450550485029);
INSERT INTO user_authority VALUES (2972001087342129510, 2999623538338967560, 2971247443118264330);
-- 
--------
-- Table structure for users
-- 
--------
DROP TABLE IF EXISTS users;
CREATE TABLE users  (
  id bigint(20) NOT NULL,
  username varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  password varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
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
INSERT INTO users VALUES (2999623538338967560, 'mbw', '123456', '18170075966', '1443792751@qq.com', 1);
SET FOREIGN_KEY_CHECKS = 1;
```

然后我们在pom和yaml中加入相关依赖和配置：

**父项目pom：**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.mbw</groupId>
    <artifactId>spring_security_parent</artifactId>
    <version>1.0-SNAPSHOT</version>
    <modules>
        <module>spring_security_simple_web01</module>
    </modules>
    <packaging>pom</packaging>
    <properties>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <maven.compiler.source>1.8</maven.compiler.source>
        <maven.compiler.target>1.8</maven.compiler.target>
        <lombok.version>1.18.20</lombok.version>
        <hutool.version>5.5.8</hutool.version>
        <mybatis-plus.version>3.4.2</mybatis-plus.version>
        <mysql.version>5.1.47</mysql.version>
    </properties>
    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>com.baomidou</groupId>
                <artifactId>mybatis-plus-boot-starter</artifactId>
                <version>${mybatis-plus.version}</version>
            </dependency>
            <dependency>
                <groupId>mysql</groupId>
                <artifactId>mysql-connector-java</artifactId>
                <version>${mysql.version}</version>
            </dependency>
            <dependency>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-dependencies</artifactId>
                <version>2.3.0.RELEASE</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <version>${lombok.version}</version>
        </dependency>
        <dependency>
            <groupId>cn.hutool</groupId>
            <artifactId>hutool-all</artifactId>
            <version>${hutool.version}</version>
        </dependency>
    </dependencies>
</project>
```

该项目依赖如下：

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
    <artifactId>spring_security_simple_web01</artifactId>
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
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
        </dependency>
    </dependencies>
</project>
```

yaml配置如下：

```java
server:
  port: 9090
spring:
  datasource:
    driver-class-name: com.mysql.jdbc.Driver
    username: your username
    password: your password
    url: jdbc:mysql://127.0.0.1:3306/spring_security?useUnicode=true&characterEncoding=UTF-8&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Shanghai&nullCatalogMeansCurrent=true
mybatis-plus:
  mapper-locations: classpath*:/mapper/**/*.xml,classpath:/META-INF/modeler-mybatis-mappings/*.xml
  typeAliasesPackage: com.mbw.pojo
  global-config:
    banner: false
  configuration:
    map-underscore-to-camel-case: true
    cache-enabled: false
    call-setters-on-nulls: true
    jdbc-type-for-null: 'null'
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl
```

然后就是重头戏，也是我们这个阶段的最后一件事，建立实体类r:

首先在pojo中建立User类，使之实现UserDetails接口：

```java
package com.mbw.pojo;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import java.io.Serializable;
import java.util.Set;
@TableName("users")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class User implements Serializable, UserDetails {
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
    private Set<Authority> authorities;
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
        return this.enabled;
    }
}
```

在这个类中我们除了几个和凭据相关的属性，还有一个set封装的权限集合属性表示用户拥有的所有权限，但要注意这里需要使用@TableField标注它是表中不存在的字段。然后实现UserDetails的相关方法即可。

然后就是Authority类，我们要让它实现GrantedAuthority接口，这样才能让前面的User类语法通过，因为UserDetails的getAuthorities需要返回泛型是GrantedAuthority的实现类才行，属性只需id和authorityName即可，然后是是西安getAuthority()只需返回authorityName即可，代码如下：

```java
package com.mbw.pojo;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
@TableName("authorities")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Authority implements GrantedAuthority {
    @TableId(type = IdType.ASSIGN_ID)
    private Long id;
    private String authorityName;
    @Override
    public String getAuthority() {
        return authorityName;
    }
}
```

然后就是中间表，这个没什么好说的，主要是到时候UserDetailsService需要通过它去连接User和Authority,代码如下：

```java
package com.mbw.pojo;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
@TableName("user_authority")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserAuthority {
    @TableId(type = IdType.ASSIGN_ID)
    private Long id;
    private Long userId;
    private Long authorityId;
}
```

建造好了后，我们就可以继续后面的学习了

## 三、通过Spring Security管理用户

### 3.1、UserDetailsService

在之前的学习中，我们曾经通过框架图了解了身份验证过程委托用户管理的特定组件：UserDetailsService实例，我们甚至定义了一个UserDetailsService用来重写Spring Boot提供的默认实现。

那么这节我们将尝试实现UserDetailsService类的各种方法，但是此处我们遍不再使用UserDetailsManager接口去添加更多行为，而是直接借助Mybatisplus结合UserDetailsService去管理用户。

首先在理解如何以及为何执行它之前，必须先理解其契约。现在详细介绍UserDetailsService以及如何使用该组件的实现。UserDetailsService接口只包含一个方法，如下所示：

```java
package org.springframework.security.core.userdetails;
public interface UserDetailsService {
	UserDetails loadUserByUsername(String username) throws UsernameNotFoundException;
}
```

身份验证实现调用loadUserByUsername(String username)方法通过**指定的用户名获取用户的详细信息。用户名当然会被视作唯一的**。**此方法返回的用户是UserDetails契约的实现**。如果用户名不存在，则该方法将抛出一个UsernameNotFoundException异常。该异常是一个RuntimeException，UsernameNotFoundException异常直接继承AuthenticationException类型，它是与身份验证过程相关的所有异常的父类。Authentication进一步继承了RuntimeException类。

如上图，AuthenticationProvider是实现身份验证逻辑并使用UserDetailsService加载关于用户的详细信息的组件。**为了按照用户名查找用户，它会调用loadUserByUsername(String username)方法**。

那么我们下面理解了UserDetailsService是根据用户名查找UserDetails的实现的，那么我们就按照该方法去实现UserDetailsService重写该方法查找我们的User:

首先我们需要写一个Mapper然后写一个三表联查语句通过我们的username查询我们的user及user相关的authority:

**UserMapper.class**

```java
package com.mbw.mapper;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.mbw.pojo.User;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;
@Mapper
public interface UserMapper extends BaseMapper<User> {
    List<User> queryUserByUsername(String username);
}
```

在resource下建立Mapper/UserMapper.xml

**UserMapper.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.mbw.mapper.UserMapper">
    <resultMap id="queryUserMap" type="com.mbw.pojo.User" autoMapping="true">
        <id column="id" property="id"/>
        <collection property="authorities" ofType="com.mbw.pojo.Authority" autoMapping="true" columnPrefix="a_">
            <id column="id" property="id"/>
            <result column="authorityName" property="authorityName"/>
        </collection>
    </resultMap>
    <select id="queryUserByUsername" resultMap="queryUserMap">
        SELECT u.*,
               a.id AS a_id,
               a.authorityName AS a_authorityName
               from users u
        LEFT JOIN user_authority ua
        ON u.id = ua.userId
        LEFT JOIN authorities a
        ON a.id = ua.authorityId
        WHERE u.username ={username}
        AND u.enabled != 0
    </select>
</mapper>
```

这样我们就写好了根据用户名查询user及对应权限的sql，这样我们就可以重写我们的loadUserByUsername(String username)方法了。我们建立service包然后建立MybatisUserDetailsService并让它实现UserDetailsService，重写我们的loadUserByUsername(String username)方法，记住需要在该类上面标注@Service注解让其交给Spring管理

```java
package com.mbw.service;
import com.mbw.mapper.UserMapper;
import com.mbw.pojo.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import java.util.List;
@Service
public class MybatisUserDetailsService implements UserDetailsService {
    @Autowired
    private UserMapper userMapper;
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        List<User> users = userMapper.queryUserByUsername(username);
        return users.stream().findFirst().orElseThrow(()->new UsernameNotFoundException("User Not Found"));
    }
}
```

我们在方法内部调用userMapper中我们刚刚写的queryUserByUsername(String username)方法，由于我们这儿并没有对username进行唯一校验，所以有可能查询出多个用户，所以我们这边通过stream流返回查找到的第一个user,如果没找到，则抛出异常。

然后在我们的配置类配置我们的UserDetailsService

**ProjectConfig.class**

```java
package com.mbw.config;
import com.mbw.service.MybatisUserDetailsService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.crypto.password.NoOpPasswordEncoder;
@Configuration
@RequiredArgsConstructor
public class ProjectConfig extends WebSecurityConfigurerAdapter {
    @Autowired
    private MybatisUserDetailsService userDetailsService;
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.httpBasic();
        http.authorizeRequests()
                .anyRequest().authenticated(); //所有请求都需要身份验证
    }
    @Override
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {
        auth.userDetailsService(userDetailsService)
                .passwordEncoder(NoOpPasswordEncoder.getInstance());
    }
}
```

然后测试我们的/hello接口

我们使用数据库中的mbw和密码123456进行basic auth认证请求接口：

得到200Ok的返回结果，回到控制台查看日志，可以看到user被成功查询出：

我们可以自己将查询出的用户信息打印出来：

```java
User(id=2999623538338967560, username=mbw, mobile=18170075966, password=123456, email=1443792751@qq.com, enabled=true, authorities=[Authority(id=2971247443118264330, authorityName=write), Authority(id=2970710450550485029, authorityName=read)])
```

然后我们可以再数据库手动再增加一个别的用户，看是否同样也能登陆成功，发现同样也可以登陆成功，这样我们就成功掌握如何通过userDetailsService管理用户。

最后，我提一嘴UserDetailsManager

其实此接口并没有什么，我们刚刚写的MybatisUserDetailsService同样也可以做到，那么它到底做了什么呢，其实它继承了UserDetailsService,在其基础上添加了更多方法：

```java
package org.springframework.security.provisioning;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
public interface UserDetailsManager extends UserDetailsService {
void createUser(UserDetails user);
void updateUser(UserDetails user);
void deleteUser(String username);
hangePassword(String oldPassword, String newPassword);
userExists(String username);
}
```

即在其基础上能够添加新用户或删除现有用户，但是我们的MYbatisPlus同样也可以做到这些功能，可以直接调用，所以这里我们就不对其过多讲解，其中UserDetailsManager最著名的实现当然就是JdbcUserDetailsManager,通过JDBC直接连接到数据库，并且也天生给我们提供了很多sql直接实现刚才的那些对用户进行管理的方法。但是我自认为没有mybatisplus好用。所以也不进行过多讲解。
