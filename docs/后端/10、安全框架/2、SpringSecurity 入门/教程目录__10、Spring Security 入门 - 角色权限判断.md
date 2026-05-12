# 10、Spring Security 入门 - 角色权限判断
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/5/10.html
- 分类：安全框架
- 分组：教程目录
除了之前讲解的内置权限控制。Spring Security 中还支持很多其他权限控制。这些方法一般都用于用户已经被认证后，判断用户是否具有特定的要求

### 1.hasAuthority(String)

判断用户是否具有特定的权限，用户的权限是在自定义登录逻辑中创建 User 对象时指定的。

下图中 admin 就是用户的权限。admin 严格区分大小写。

在配置类中通过 hasAuthority(“admin”)设置具有 admin 权限时才能访问

```java
.antMatchers("/main1.html").hasAuthority("admin")
```

### 2.hasAnyAuthority(String …)

如果用户具备给定权限中某一个，就允许访问

下面代码中由于大小写和用户的权限不相同，所以用户无权访问 /main1.html

```java
.antMatchers("/main1.html").hasAnyAuthority("adMin","admiN")
```

### 3.hasRole(String)

如果用户具备给定角色就允许访问。否则出现 403。

参数取值来源于自定义登录逻辑 UserDetailsService 实现类中创建 User 对象时给 User 赋予的授权

在给用户赋予角色时角色需要以：ROLE_ 开头，后面添加角色名称。例如：ROLE_abc 其中 abc 是角色名，ROLE_是固定的字符开头。使用 hasRole()时参数也只写 abc 即可。否则启动报错。

给用户赋予角色：

在配置类中直接写 abc 即可

### 4.hasAnyRole(String …)

如果用户具备给定角色的任意一个，就允许被访问

### 5.hasIpAddress(String)

如果请求是指定的 IP 就运行访问。

可以通过 request.getRemoteAddr()获取 ip 地址

需要注意的是在本机进行测试时 localhost 和 127.0.0.1 输出的 ip 地址是不一样的。

当浏览器中通过 localhost 进行访问时控制台打印的内容：

当浏览器中通过 127.0.0.1 访问时控制台打印的内容：

当浏览器中通过具体 ip 进行访问时控制台打印内容：
