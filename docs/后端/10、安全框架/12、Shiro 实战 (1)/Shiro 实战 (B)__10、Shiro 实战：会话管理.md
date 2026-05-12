# 10、Shiro 实战：会话管理
- 来源：https://ddkk.com/zhuanlan/security/shiro/7/25.html
- 分类：安全框架
- 分组：Shiro 实战 (B)
## 一、简介：

Shiro 提供了完整的企业级会话管理功能，不依赖于底层容 器（如web容器tomcat），不管 JavaSE 还是 JavaEE 环境都可以使用，提供了会话管理、会话事件监听、会话存储和持久化、容器无关的集群、失效和过期支持、对Web 的透明支持、SSO 单点登录的支持等特性。

## 二、会话的API

api
作用

Subject.getSession()
即可获取会话；其等价于 Subject.getSession(true)，即如果当前没有创建 Session 对象会创建 一个；Subject.getSession(false)，如果当前没有创建 Session 则返回 null

session.getId()
获取当前会话的唯一标识

session.getHost()
获取当前Subject的主机地址

session.getTimeout()
获取当 前Session的过期时间

session.setTimeout(毫秒)
设置当 前Session的过期时间

session.getStartTimestamp()
获取会话的启动时间

session.getLastAccessTime()
获取会话的最后访问时间。如果是 JavaSE 应用需要自己定期调用

session.touch()
更新会话最后访问时间；如果是 Web 应用，每次进入 ShiroFilter 都会自动调用

session.stop()
销毁会话。当Subject.logout()时会自动调用 stop 方法来销毁会话。如果在web中，调用 HttpSession. invalidate() 也会自动调用Shiro Session.stop 方法进行销毁Shiro 的会话

session.setAttribute(key, val)
设置会话属性；在整个会话范围内都可以对这些属性进行操作

session.getAttribute(key)
获取会话属性

session.removeAttribute(key)
删除会话属性

## 三、会话监听器

会话监听器用于监听会话创建、过期及停止事件。

```java
public class MySessionListener1 implements SessionListener {  
    @Override  
    public void onStart(Session session) { // 会话创建时触发  
        System.out.println("会话创建：" + session.getId());  
    }  
    @Override  
    public void onExpiration(Session session) { // 会话过期时触发  
        System.out.println("会话过期：" + session.getId());  
    }  
    @Override  
    public void onStop(Session session) { // 退出或会话过期时触发  
        System.out.println("会话停止：" + session.getId());  
    }    
} 
```

## 四、会话验证

**1、** Shiro提供了会话验证调度器，用于定期的验证会话是否已过期，如果过期将停止会话出于性能考虑，一般情况下都是获取会话时来验证会话是否过期并停止会话的；但是如在web环境中，如果用户不主动退出是不知道会话是否过期的，因此需要定期的检测会话是否过期，Shiro提供了会话验证调度器SessionValidationScheduler；

**2、** Shiro也提供了使用Quartz会话验证调度器：QuartzSessionValidationScheduler；
