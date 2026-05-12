# 17、Shiro 实战：Shiro权限注解
- 来源：https://ddkk.com/zhuanlan/security/shiro/8/17.html
- 分类：安全框架
- 分组：Shiro 实战 (A)
注：该系列所有测试均在之前创建的Shiro3的Web工程的基础上。前面我们讲解了Shiro的标签属性，下面我们来讲解Shiro的有关权限的注解属性。

Shiro的注解是使用在相应的Java类的方法上，当用户不满足注解的要求时，是无法执行方法内部逻辑的。这相当于在代码层做了权限校验。

Shiro的注解可以放置在Controller层对应的方法上，也可以放置在Service层对应的方法上。

Shiro的注解类型大致如下：

(1)**@RequiresAuthentication**
表示当前Subject已经通过login进行了身份验证；即Subject.isAuthenticated()返回true。

(2)**@RequiresUser**

表示当前Subject已经进行身份验证或者通过“记住我”登录。

(3)**@RequiresGuest**

表示当前Subject没有身份验证或者通过“记住我”登录过，即是 游客身份。

(4)**@RequiresRoles(value={"admin","user"},logical=Logical.OR)**

表示当前Subject需要角色admin和user。

(5)**@RequiresPermissions(value={"user:a","user:b"},logical=Logical.OR)**

表示当前Subject需要权限user:a或user:b。

下面我们在原来Shiro3工程的基础上测试几个注解。

首先在工程中创建一个Service:

```java
package com.test.shiro.services;
import java.text.SimpleDateFormat;
import java.util.Date;
public class ShiroService {
    public void testMethod(){
    	System.out.println("testMethod，time:"
    			+new SimpleDateFormat("yyy-MM-dd HH:mm:ss").format(new  Date()));
    }
}
```

在其中编写了名为“testMethod”的方法，在其中打印调用方法的当前时间。然后将这个Service注入Spring的IOC容器，即在applicationContext.xml中添加该Service对应的bean：

```xml
<bean id="shiroService" class="com.test.shiro.services.ShiroService">
</bean>
```

然后在原来的登录Controller中注入该Service，并创建一个testShiroAnnocation服务：

```java
package com.test.shiro.controller;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authc.AuthenticationException;
import org.apache.shiro.authc.UsernamePasswordToken;
import org.apache.shiro.subject.Subject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import com.test.shiro.services.ShiroService;
@Controller
@RequestMapping("userAuth")
public class ShiroLoginController {
	@Autowired
	private ShiroService shiroService;
	@RequestMapping("/testShiroAnnocation")
	private String testShiroAnnocation(){
		shiroService.testMethod();
		return "redirect:/list.jsp";
	}
	@RequestMapping("login")
	public String login(String username,String password){
		//获取当前的Subject
        	Subject currentUser = SecurityUtils.getSubject();
        	//测试当前用户是否已经被认证(即是否已经登录)
        	if (!currentUser.isAuthenticated()) {
        		//将用户名与密码封装为UsernamePasswordToken对象
            		UsernamePasswordToken token = 
				new UsernamePasswordToken(username, password);
            		token.setRememberMe(true);//记录用户
            		try {
                		currentUser.login(token);//调用Subject的login方法执行登录
            		} catch (AuthenticationException e) {//所有认证时异常的父类
                		System.out.println("登录失败："+e.getMessage());
            		} 
        	}
		return "redirect:/list.jsp";
	}
}
```

在list.jsp界面添加一个触发“testShiroAnnocation”服务的超链接：

```xml
<%@ page language="java" import="java.util.*" pageEncoding="UTF-8"%>
<%@ taglib prefix="shiro" uri="http://shiro.apache.org/tags" %>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
  <head>
    <title>首页</title>
  </head>
  <body>
     登录成功！欢迎<shiro:principal/>访问首页O(∩_∩)O
   <a href="userAuth/logout">登出</a>
   <br/><br/>
   <!-- “testShiroAnnocation”服务的超链接 -->
   <a href="userAuth/testShiroAnnocation">Test ShiroAnnocation</a>
   <shiro:hasRole name="admin">
   <br/><br/>
   <a href="admin.jsp">Admin Page</a>
   </shiro:hasRole>
   <shiro:hasRole name="user">
   <br/><br/>
   <a href="User.jsp">User Page</a>
   </shiro:hasRole>
  </body>
</html>
```

此时我们没有给testShiroAnnocation服务加任何权限注解，所以是可以自由访问的：

点击超链接之后，MyEclipse的控制台显示了执行方法的时间：

下面我们对Service的testMethod方法添加一个控制权限的注解“@RequiresRoles”：

```java
package com.test.shiro.services;
import java.text.SimpleDateFormat;
import java.util.Date;
import org.apache.shiro.authz.annotation.RequiresRoles;
public class ShiroService {
    @RequiresRoles({"admin"})
    public void testMethod(){
    	System.out.println("testMethod，time:"
    			+new SimpleDateFormat("yyy-MM-dd HH:mm:ss").format(new  Date()));
    }
}
```

上面的注解控制只有当用户角色包含“admin”时，才会执行testMethod方法。

下面我们使用没有admin角色的jack用户登录：

然后点击“Test ShiroAnnocation”超链接时，没有显示执行方法时间，而是抛出了异常：

改异常表明了用户没有“admin”的角色信息。

上面的异常可以使用Spring的“声明式异常”来跳转至友好提示页面，这里就不进行处理了。

最后需要注意的是：

在日常开发时，往往会在Service层添加“@Transactional”注解，为的是当Service发送数据库异常时，所有数据库操作可以回滚。当在Service层添加“@Transactional”注解后，执行Service方法前，会开启事务。此时的Service已经是一个代理对象了，此时如果我们将Shiro的权限注解加载Service层是不合适的，此时需要加到Controller层。这是因为不能让Service是“代理的代理”，如果强行注入，会发生类型转换异常。

以上就是关于Shiro权限注解的讲解。
