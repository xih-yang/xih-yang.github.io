# 04、SpringSecurity 基础 - 自定义登录流程
- 来源：https://ddkk.com/zhuanlan/security/oauth2/2/4.html
- 分类：安全框架
- 分组：教程目录
## 自定义登录

在SpringSecurity的整个认证流程中，除了UserDetailsService需要我们自己定义外，其他的的组件都可以使用默认的，因为UserDetailsService是SpringSecurity获取数据库中的认证信息的媒介，而如何才能从数据库中获取认证信息只有我们才知道。在入门案例中我们使用的是InMemoryUserDetailsManager 基于内存的UserDetailsService方案，接下来我们需要把基于内存的方案修改为基于数据库的方案。

### 1.定义密码编码器

在我们的案例中，密码一值是明文的,我们指定的密码编码器是 NoOpPasswordEncoder ，这个是不加密的，但是在生产环境中我们数据库中的密码肯定是密文，所以我们需要指定密码的编码器，那么SpringSecurity在认证时会调用我们指定的密码编码器进行认证

**BCryptPasswordEncoder**

BCryptPasswordEncoder是SpringSecurity内部提供的编码器，他的好处在于多次对相 同的明文加密出来的密文是不一致的，但是多次加密出来的不同密文确有能检查通过， 这种方式增加了密码的安全性，测试代码如下：

```java
public class PasswordTest {
    @Test
    public void testPassword(){
        BCryptPasswordEncoder bCryptPasswordEncoder = new BCryptPasswordEncoder();
        String enPass = bCryptPasswordEncoder.encode("123");
        System.out.println(enPass);
        System.out.println(bCryptPasswordEncoder.matches("123", enPass));
    }
}
```

**在配置类中定义编码器如下：**

```java
@Bean
public PasswordEncoder passwordEncoder(){
    //return NoOpPasswordEncoder.getInstance();
    return new BCryptPasswordEncoder();
}
```

### 2.MyBatis集成

#### 1.导入依赖#

```xml
<dependency>
    <groupId>com.alibaba</groupId>
    <artifactId>druid</artifactId>
    <version>1.1.20</version>
</dependency>
<!-- mysql 数据库驱动. -->
<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
</dependency>
<dependency>
    <groupId>org.mybatis.spring.boot</groupId>
    <artifactId>mybatis-spring-boot-starter</artifactId>
    <version>1.1.1</version>
</dependency>
```

#### 2.配置MyBatis#

```java
spring:
  datasource:
    url: jdbc:mysql:///auth-rbac
    username: root
    password: admin
    driver-class-name: com.mysql.jdbc.Driver
    type: com.alibaba.druid.pool.DruidDataSource
mybatis:
  mapper-locations: classpath:cn/itsource/rbac/mapper/*Mapper.xml
```

#### 3.主启动类#

```java
@SpringBootApplication
@MapperScan("mapper接口包")
public class ApplicationConfig {
    public static void main(String[] args) {
        SpringApplication.run(ApplicationConfig.class);
    }
}
```

#### 4.编写Login和LoginMapper.xml#

Login.java 登录对象

```java
public class Login {
    private Long id;
    private String username;
    private String password;
```

Permission.java 权限表

```java
public class Permission {
    private Long id;
    private String name;
    private String sn;
    private String resource;
```

LoginMapper.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="cn.itsource.security.mapper.LoginMapper">
    <!-- 通用查询映射结果 -->
    <resultMap id="BaseResultMap" type="cn.itsource.security.domain.Login">
        <id column="id" property="id" />
        <result column="username" property="username" />
        <result column="password" property="password" />
    </resultMap>
    <!--根据用户名查询用户-->
    <select id="selectByUsername" resultType="cn.itsource.security.domain.Login">
        select id,username,password
        from t_login where username ={username}
    </select>
</mapper>
```

PermissionMapper.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="cn.itsource.security.mapper.PermissionMapper">
    <!-- 通用查询映射结果 -->
    <resultMap id="BaseResultMap" type="cn.itsource.security.domain.Permission">
        <id column="id" property="id" />
        <result column="name" property="name" />
        <result column="resource" property="resource" />
        <result column="expression" property="expression" />
    </resultMap>
    <select id="selectPermissionsByUserId" resultMap="BaseResultMap">
        select p.id,p.name,p.resource,p.expression
        from t_user_role ur join t_role_permission rp on ur.role_id = rp.role_id
        join t_permission p on p.id = rp.permission_id
        where ur.user_id ={
     userId}
    </select>
    <select id="selectAll" resultMap="BaseResultMap">
        select  p.id,p.name,p.resource,p.expression
        from t_permission p
    </select>
</mapper>
```

#### 5.编写Mapper映射器接口#

LoginMapper.java

```java
package cn.itsource.security.mapper;
import cn.itsource.security.domain.Login;
import cn.itsource.security.domain.Permission;
import java.util.List;
public interface LoginMapper {
    Login selectByUsername(String username);
}
```

PermissionMapper.java

```java
package cn.itsource.security.mapper;
import cn.itsource.security.domain.Permission;
import java.util.List;
public interface PermissionMapper {
    List<Permission> selectPermissionsByUserId(Long userId);
    List<Permission> selectAll();
}
```

#### 6.创建数据库auth-rbac#

相关表不用多说，需要注意的是：t_login密码使用BCryptPasswordEncoder加密

```java
SET FOREIGN_KEY_CHECKS=0;
-- ----------------------------
-- Table structure for t_permission 权限
-- ----------------------------
DROP TABLE IF EXISTS t_permission;
CREATE TABLE t_permission (
  id bigint(20) NOT NULL AUTO_INCREMENT,
  name varchar(255) DEFAULT NULL,
  resource varchar(255) NOT NULL,
  state int(11) DEFAULT NULL,
  menu_id bigint(20) DEFAULT NULL,
  expression varchar(255) NOT NULL,
  PRIMARY KEY (id),
  KEY menu_id (menu_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
-- ----------------------------
-- Records of t_permission
-- ----------------------------
-- ----------------------------
-- Table structure for t_role 角色
-- ----------------------------
DROP TABLE IF EXISTS t_role;
CREATE TABLE t_role (
  id bigint(20) NOT NULL AUTO_INCREMENT,
  name varchar(255) DEFAULT NULL,
  sn varchar(255) DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
-- ----------------------------
-- Records of t_role
-- ----------------------------
-- ----------------------------
-- Table structure for t_role_permission 角色和权限关系
-- ----------------------------
DROP TABLE IF EXISTS t_role_permission;
CREATE TABLE t_role_permission (
  role_id bigint(20) NOT NULL,
  permission_id bigint(20) NOT NULL,
  PRIMARY KEY (role_id,permission_id),
  KEY permission_id (permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
-- ----------------------------
-- Records of t_role_permission
-- ----------------------------
-- ----------------------------
-- Table structure for t_login 用户登录表
-- ----------------------------
DROP TABLE IF EXISTS t_login;
CREATE TABLE t_login (
  id bigint(20) NOT NULL AUTO_INCREMENT,
  username varchar(255) DEFAULT NULL COMMENT '员工用户名',
  password varchar(255) DEFAULT NULL COMMENT '密码',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
-- ----------------------------
-- Records of t_login
-- ----------------------------
-- ----------------------------
-- Table structure for t_login_role 用户角色关系表
-- ----------------------------
DROP TABLE IF EXISTS t_login_role;
CREATE TABLE t_login_role (
  login_id bigint(20) NOT NULL,
  role_id bigint(20) NOT NULL,
  PRIMARY KEY (login_id,role_id),
  KEY role_id (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
-- ----------------------------
-- Records of t_login_role
-- ----------------------------
```

### 3.定义UserDetailsService

**相关概念**

- UserDetailsService

是SpringSecurity提供用来获取认证用户信息(用户名，密码，用户的权限列表)的 接 口,我们可以实现该接口，复写loadUserByUsername(username) 方法加载我们数 据 库中的用户信息
- UserDetails

UserDetails是SpringSecurity用来封装用户认证信息，权限信息的对象，我们使用它 的实现类User封装用户信息 并返回，我们这里从数据库查询用户名

**基于入门案例进行修改**

- 准备好认证表t_login(id,username,password密码密文),创建相关代码 ,集成MyBatis等，做好准备工作
- 创建类UserDetailServiceImpl实现UserDetailsService接口

```java
/**
 * 用来提供给security的用户信息的service，
 * 我们需要复写 loadUserByUsername 方法返回数据库中的用户信息
 */
@Service
public class UserDetailServiceImpl implements UserDetailsService {
	@Autoware
	private LoginMapper loginMapper;
    /**
     * 加载数据库中的认证的用户的信息：用户名，密码，用户的权限列表
     * @param username: 该方法把username传入进来，我们通过username查询用户的信息
     (密码，权限列表等)然后封装成 UserDetails进行返回 ，交给security 。
     */
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
		Login userFromMysql = loginMapper.selectByUsername(username);
		if(loginFromMysql == null){
              throw new UsernameNotFoundException("无效的用户名");
		}
		//暂时没加载权限
		List<GrantedAuthority> permissions = new ArrayList<>();
		//密码是基于BCryptPasswordEncoder加密的密文
		//User是security内部的对象，UserDetails的实现类 ，
        //用来封装用户的基本信息（用户名，密码，权限列表）
        //四个true分别是账户启用，账户过期，密码过期，账户锁定
		return new User(username,loginFromMysql.getPassword(),true,true,true,true,permissions);
    }
}
```

Provider会调用UserDetailsService 获取认证信息，这里自定义的UserDetailsService实现类，复写了loadUserByUsername方法，根据用户名查询数据库中的认证信息和当前用户的权限信息，封装成User返回。

`注意：这里定义了UserDetailSerice后，WebSecurityConfig中不在需要定义UserDetailService的Bean需要移除`

### 4.自定义登录页面

#### 1.准备登录页面static/login.html#

```xml
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>登陆</title>
</head>
<body>
<h1>登陆</h1>
<form method="post" action="/login">
    <div>
        用户名：<input type="text" name="username">
    </div>
    <div>
        密码：<input type="password" name="password">
    </div>
    <div>
        <button type="submit">立即登陆</button>
    </div>
</form>
</body>
</html>
```

#### 2.配置登录页面#

在WebSecurityConfig配置类中配置登陆页面和登陆请求地址

```java
protected void configure(HttpSecurity http) throws Exception {
        http.csrf().disable()
                .authorizeRequests()
                .antMatchers("/login").permitAll()  //登录路径放行
                .antMatchers("/login.html").permitAll() //对登录页面跳转路径放行
                .anyRequest().authenticated() //其他路径都要拦截
                .and().formLogin()  //允许表单登录， 设置登陆页
                .successForwardUrl("/loginSuccess") // 设置登陆成功页
                .loginPage("/login.html")   //登录页面跳转地址
                .loginProcessingUrl("/login")   //登录处理地址(必须)
                .and().logout().permitAll();    //登出
    }
```

- http.csrf().disable() ：屏蔽跨域伪造检查
- antMatchers("/login.html").permitAll() ： 对登录页面跳转路径放行
- loginPage("/login.html") ：登录页面跳转地址(必须)
- loginProcessingUrl("/login") ：登录处理地址(必须)

## 2.自定义登出

### 1.指定登出路径

SpringSecurity提供了默认的退出处理，可以在Security配置类中通过.and().logout().permitAll(); 放行默认的退出路径“/logout” ,如果我们需要自定义退出路径，可以通过如下方式指定：

```java
.and().logout().logoutUrl("/mylogout").permitAll()    //制定义登出路径
.invalidateHttpSession(true); //登出后session无效
```

### 2.登出处理器

当然我们也可以在登出的时候做一些自己的事情，通过定义LogoutHandler 处理器实现，如：定义登出处理器

```java
public class MyLogoutHandler implements LogoutHandler {
    @Override
    public void logout(HttpServletRequest request, HttpServletResponse response, Authentication authentication) {
        try {
            //登出成功，响应结果给客户端，通常是一个JSON数据
            response.getWriter().println("logout success");
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

配置处理器

```java
.and().logout().logoutUrl("/mylogout").permitAll()    //制定义登出路径
.logoutSuccessHandler(new MyLogoutHandler())  //登出后处理器-可以做一些额外的事情
.invalidateHttpSession(true); //登出后session无效
```

到这里配置就结束了，您可以重启测试一下
