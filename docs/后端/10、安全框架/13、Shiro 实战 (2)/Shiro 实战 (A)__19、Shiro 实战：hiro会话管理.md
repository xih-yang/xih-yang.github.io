# 19、Shiro 实战：hiro会话管理
- 来源：https://ddkk.com/zhuanlan/security/shiro/8/19.html
- 分类：安全框架
- 分组：Shiro 实战 (A)
注：该系列所有测试均在之前创建的Shiro3的Web工程的基础上。下面我们来说一下Shiro里面的会话管理，这个“会话”与JavaWeb里面的HttpSession是一致的，都是表示客户端与服务器的一次会话。

Shiro会话的特点：

Shiro提供了完整的企业级会话管理功能，不依赖于底层容器（比如Web容器tomcat），不管JavaSE还是JavaEE环境都可以使用。

Shiro提供了会话管理，会话事件监听、会话存储/持久化、容器无关的集群、失效/过期支持、对Web的透明支持、SSO单点登录的支持等特性。

会话相关的API:

**1、****Subject.getSession()**：即可获取会话，其等价于Subject.getSession(true)，即如果当前没有创建Session对象会创建一个；Subject.getSession(false)，如果当前没有创建Session则返回null。

**2、****session.getId()**：获取当前会话的唯一标识。

**3、****session.getHost()**：获取当前Subject的主机地址。

**4、****session.getTimeout()&session.setTimeout(毫秒)**：获取/设置当前Session的过期时间。

**5、****session.getStartTimestamp()&session.getLastAccessTime()**:

获取会话的启动时间和最后访问时间，如果是JavaSE应用需要自己定期调用session.touch()去更新最后访问时间；如果是Web应用，每次进入ShiroFilter都会自动调用session.touch()来更新最后访问时间。

(6)**session.touch()&session.stop()**：更新会话最后访问时间以及销毁会话；当Subject.logout()时会自动调用stop方法来销毁会话。如果在Web中，调用HttpSession.invalidate()也会自动调用Shiro的session.stop()方法进行销毁Shiro的会话。

(7)**session.setAttribute(key,val)&session.getAttribute(key)&session.removeAttribute(key)**:设置/获取/删除会话属性；在整个火花范围内都可以对这些属性进行操作。

(8)**SessionListener**会话监听器用于监听会话创建、过期以及停止事件：

onStart(Session)、onStop(Session)、onExpiration(Session)分别监听了Session启动、销毁以及Session过期的时候。与HttpSessionListener很相似。

在Controller层，我们建议大家使用原生的HttpSession。那么Shiro的Session有什么意义呢？

要知道，我们在传统的Web应用中，是无法在Service层获取Session会话的，也不建议这么做(应用会变成侵入式的)。但是现在有了Shrio的Session后，我们就可以在Service中使用会话。

下面我们测试一下，在之前的测试工程的ShiroLoginController中的为了测试权限注解的testShiroAnnocation方法参数中，添加传统会话HttpSession，并在Session中放置一个参数：

```java
package com.test.shiro.controller;
import javax.servlet.http.HttpSession;
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
    private String testShiroAnnocation(HttpSession session){
	session.setAttribute("test", "Hello1234");
	shiroService.testMethod();
	return "redirect:/list.jsp";
    }
    //下面的其它代码省略
}
```

然后在shiroService的testMethod方法中通过Shiro的Session获取我们在Controller中设置的参数：

```java
package com.test.shiro.services;
import java.text.SimpleDateFormat;
import java.util.Date;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authz.annotation.RequiresRoles;
import org.apache.shiro.session.Session;
public class ShiroService {
    @RequiresRoles({"admin"})
    public void testMethod(){
    	System.out.println("testMethod，time:"
    			+new SimpleDateFormat("yyy-MM-dd HH:mm:ss").format(new  Date()));
    	Session session = SecurityUtils.getSubject().getSession();
    	Object val = session.getAttribute("test");
    	System.out.println("Service SessionVal: "+val);
    }
}
```

然后我们重启Web测试项目，使用admin登录后，在主页访问“/testShiroAnnocation”服务：

我们可以发现MyEclipse的控制台打印出了Session中的信息：

总结：

在Controller层我们使用的是HttpSession，而在Service层我们使用的是Shiro的Session，这样的话提供了一个好处，就是即便是在Service层，我们也可以访问到Session的数据。在开发中这个特性是

很方便的，这也是Shiro的Session会话在开发中的一个重要作用。
