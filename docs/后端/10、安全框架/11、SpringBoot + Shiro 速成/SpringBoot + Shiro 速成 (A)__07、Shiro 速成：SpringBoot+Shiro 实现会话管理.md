# 07、Shiro 速成：SpringBoot+Shiro 实现会话管理
- 来源：https://ddkk.com/zhuanlan/security/shiro/5/7.html
- 分类：安全框架
- 分组：SpringBoot + Shiro 速成 (A)
## 一、概述

Shiro 提供了完整的企业级会话管理功能，不依赖于底层容器（如 web 容器 tomcat），不管 JavaSE 还是 JavaEE 环境都可以使用，提供了会话管理、会话事件监听、会话存储 / 持久化、容器无关的集群、失效 / 过期支持、对 Web 的透明支持、SSO 单点登录的支持等特性，即直接使用 Shiro 的会话管理可以直接替换如 Web 容器的会话管理。

## 二、重要概念

**会话**

所谓会话，即用户访问应用时保持的连接关系，在多次交互中应用能够识别出当前访问的用户是谁，且可以在多次交互中保存一些数据。如访问一些网站时登录成功后，网站可以记住用户，且在退出之前都可以识别当前用户是谁。

```java
subject.getSession(); 获取Session对象
session.getId(); 获取当前会话的唯一标识。
session.getHost(); 获取当前 Subject 的主机地址
session.getTimeout(); / session.setTimeout(毫秒); 获取 / 设置当前 Session 的过期时间；如果不设置默认是会话管理器的全局过期时间。
session.getStartTimestamp(); / session.getLastAccessTime(); 获取会话的启动时间及最后访问时间；
session.setAttribute("key", "123"); / session.removeAttribute("key"); 设置 / 获取 / 删除会话属性
session.touch(); / session.stop(); 更新会话最后访问时间及销毁会话
```

**会话管理器**

会话管理器管理着应用中所有 Subject 的会话的创建、维护、删除、失效、验证等工作，是 Shiro 的核心组件。Shiro 提供了三个默认实现：

```java
DefaultSessionManager：DefaultSecurityManager 使用的默认实现，用于 JavaSE 环境；
ServletContainerSessionManager：DefaultWebSecurityManager 使用的默认实现，用于 Web 环境，其直接使用 Servlet 容器的会话；
DefaultWebSessionManager：用于 Web 环境的实现，可以替代 ServletContainerSessionManager，自己维护着会话，直接废弃了 Servlet 容器的会话管理。
```

**会话监听器**

会话监听器用于监听会话创建、过期及停止事件。

```java
onStart: 会话创建时触发
onExpiration: 会话过期时触发
onStop: 退出/会话过期时触发
```

**会话存储 / 持久化**

Shiro 提供 SessionDAO 用于会话的 CRUD，即 DAO（Data Access Object）模式实现：

```java
//如DefaultSessionManager在创建完session后会调用该方法；如保存到关系数据库/文件系统/NoSQL数据库；即可以实现会话的持久化；返回会话ID；主要此处返回的ID.equals(session.getId())；
Serializable create(Session session);
//根据会话ID获取会话
Session readSession(Serializable sessionId) throws UnknownSessionException;
//更新会话；如更新会话最后访问时间/停止会话/设置超时时间/设置移除属性等会调用
void update(Session session) throws UnknownSessionException;
//删除会话；当会话过期/会话停止（如用户退出时）会调用
void delete(Session session);
//获取当前所有活跃用户，如果用户量多此方法影响性能
Collection<Session> getActiveSessions();
```

- 会话验证

Shiro 提供了会话验证调度器，用于定期的验证会话是否已过期，如果过期将停止会话；出于性能考虑，一般情况下都是获取会话时来验证会话是否过期并停止会话的；但是如在 web 环境中，如果用户不主动退出是不知道会话是否过期的，因此需要定期的检测会话是否过期，Shiro 提供了会话验证调度器 SessionValidationScheduler 来做这件事情。

- 在线会话管理

有时候需要显示当前在线人数、当前在线用户，有时候可能需要强制某个用户下线等，此时就需要获取相应的在线用户并进行一些操作。

下面通过一个Shiro在线会话管理统计当前系统在线人数，查询在线用户信息、强制让某个用户下线等等。

## 三、Shiro在线会话管理

此案例使用RedisSessionDAO结合Redis缓存实现Shiro在线会话管理。

【a】Shiro全局配置类注入RedisSessionDAO

```java
/**
 * 配置redis管理器
 */
@Bean
public RedisManager redisManager() {
    RedisManager redisManager = new RedisManager();
    //设置一小时超时，单位是秒
    redisManager.setExpire(3600);
    return redisManager;
}
/**
 * 注册RedisSessionDAO
 */
@Bean
public SessionDAO sessionDAO() {
    RedisSessionDAO redisSessionDAO = new RedisSessionDAO();
    redisSessionDAO.setRedisManager(redisManager());
    return redisSessionDAO;
}
```

【b】注册SessionManager会话管理器

```java
/**
 * 注册SessionManager会话管理器
 */
@Bean
public SessionManager sessionManager() {
    DefaultWebSessionManager sessionManager = new DefaultWebSessionManager();
    List<SessionListener> listeners = new ArrayList<>();
    //需要添加自己实现的会话监听器
    listeners.add(new CustomShiroSessionListener());
    //添加会话监听器给sessionManager管理
    sessionManager.setSessionListeners(listeners);
    //添加SessionDAO给sessionManager管理
    sessionManager.setSessionDAO(sessionDAO());
    //设置全局(项目)session超时单位 毫秒   -1为永不超时
    sessionManager.setGlobalSessionTimeout(360000);
    return sessionManager;
}
```

因为SessionManager会话管理器需要添加个会话监听，所以我们还得自定义一个会话监听器，通过实现SessionListener接口实现。

```java
import org.apache.shiro.session.Session;
import org.apache.shiro.session.SessionListener;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.concurrent.atomic.AtomicInteger;
/**
 * @version V1.0
 * @ClassName: com.wsh.springboot.springbootshiro.listener.CustomShiroSessionListener.java
 * @Description: 自定义会话监听器
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date: 2022/11/7 15:03
 */
public class CustomShiroSessionListener implements SessionListener {
    private static final Logger logger = LoggerFactory.getLogger(CustomShiroSessionListener.class);
    /**
     * 维护着个原子类型的Integer对象，用于统计在线Session的数量
     */
    private final AtomicInteger sessionCount = new AtomicInteger(0);
    @Override
    public void onStart(Session session) {
        sessionCount.getAndIncrement();
        logger.info("用户登录人数增加一人" + sessionCount.get());
    }
    @Override
    public void onStop(Session session) {
        sessionCount.decrementAndGet();
        logger.info("用户登录人数减少一人" + sessionCount.get());
    }
    @Override
    public void onExpiration(Session session) {
        sessionCount.decrementAndGet();
        logger.info("用户登录过期一人" + sessionCount.get());
    }
}
```

【c】将会话管理器交给SecurityManager进行管理

```java
//设置会话管理器
defaultWebSecurityManager.setSessionManager(sessionManager());
```

【d】创建一个实体类用于保存用户在线信息

```java
public class OnlineUser {
    // session id
    private String sessionId;
    // 用户id
    private String userId;
    // 用户名称
    private String username;
    // 用户主机地址
    private String host;
    // 用户登录时系统IP
    private String systemHost;
    // 状态
    private String status;
    // session创建时间
    private Date startTimestamp;
    // session最后访问时间
    private Date lastAccessTime;
    // 超时时间
    private Long timeout;
    public String getSessionId() {
        return sessionId;
    }
    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }
    public String getUserId() {
        return userId;
    }
    public void setUserId(String userId) {
        this.userId = userId;
    }
    public String getUsername() {
        return username;
    }
    public void setUsername(String username) {
        this.username = username;
    }
    public String getHost() {
        return host;
    }
    public void setHost(String host) {
        this.host = host;
    }
    public String getSystemHost() {
        return systemHost;
    }
    public void setSystemHost(String systemHost) {
        this.systemHost = systemHost;
    }
    public String getStatus() {
        return status;
    }
    public void setStatus(String status) {
        this.status = status;
    }
    public Date getStartTimestamp() {
        return startTimestamp;
    }
    public void setStartTimestamp(Date startTimestamp) {
        this.startTimestamp = startTimestamp;
    }
    public Date getLastAccessTime() {
        return lastAccessTime;
    }
    public void setLastAccessTime(Date lastAccessTime) {
        this.lastAccessTime = lastAccessTime;
    }
    public Long getTimeout() {
        return timeout;
    }
    public void setTimeout(Long timeout) {
        this.timeout = timeout;
    }
}
```

【e】创建OnlineUserService

```java
public interface OnlineUserService {
    /**
     * 获取所有在线用户信息
     */
    List<OnlineUser> getAllOnlineUserList();
    /**
     * 根据sessionId强制登出
     *
     * @param sessionId 会话ID
     * @return
     */
    boolean forceLogout(String sessionId);
}
```

【f】创建OnlineUserService的实现类创建OnlineUserServiceImpl

```java
@Service
public class OnlineUserServiceImpl implements OnlineUserService {
    /**
     * 注入会话dao
     */
    @Autowired
    private SessionDAO sessionDAO;
    @Autowired
    private UserMapper userMapper;
    @Override
    public List<OnlineUser> getAllOnlineUserList() {
        List<OnlineUser> onlineUserList = new ArrayList<>();
        //获取到当前所有有效的Session对象
        Collection<Session> activeSessions = sessionDAO.getActiveSessions();
        OnlineUser userOnline;
        //循环遍历所有有效的Session
        for (Session session : activeSessions) {
            userOnline = new OnlineUser();
            User user;
            SimplePrincipalCollection principalCollection;
            if (session.getAttribute(DefaultSubjectContext.PRINCIPALS_SESSION_KEY) == null) {
                continue;
            } else {
                principalCollection = (SimplePrincipalCollection) session.getAttribute(DefaultSubjectContext.PRINCIPALS_SESSION_KEY);
                String username = (String) principalCollection.getPrimaryPrincipal();
                user = userMapper.findUserByName(username);
                userOnline.setUsername(user.getUsername());
                userOnline.setUserId(user.getId());
            }
            userOnline.setSessionId((String) session.getId());
            userOnline.setHost(session.getHost());
            userOnline.setStartTimestamp(session.getStartTimestamp());
            userOnline.setLastAccessTime(session.getLastAccessTime());
            Long timeout = session.getTimeout();
            userOnline.setStatus(timeout.equals(0L) ? "离线" : "在线");
            userOnline.setTimeout(timeout);
            onlineUserList.add(userOnline);
        }
        return onlineUserList;
    }
    @Override
    public boolean forceLogout(String sessionId) {
        Session session = sessionDAO.readSession(sessionId);
        //强制注销
        sessionDAO.delete(session);
        return true;
    }
}
```

【g】创建OnlineUserController对外暴露操作接口

```java
@Controller
public class OnlineUserController {
    @Autowired
    private OnlineUserService onlineUserService;
    @RequestMapping("/onlineUserList")
    public ModelAndView list() {
        List<OnlineUser> onlineUserList = onlineUserService.getAllOnlineUserList();
        ModelAndView modelAndView = new ModelAndView();
        modelAndView.setViewName("onlineUserList");
        modelAndView.addObject("onlineUserList", onlineUserList);
        return modelAndView;
    }
    @RequestMapping("/forceLogout")
    @ResponseBody
    public Map<String, String> forceLogout(@RequestParam("sessionId") String sessionId) {
        Map<String, String> resultMap = new HashMap<>(16);
        try {
            boolean forceLogout = onlineUserService.forceLogout(sessionId);
            if (forceLogout) {
                resultMap.put("code", "1");
                resultMap.put("msg", "强制踢人成功！");
            }
        } catch (Exception e) {
            resultMap.put("code", "0");
            resultMap.put("msg", "强制踢人失败！");
            e.printStackTrace();
        }
        return resultMap;
    }
}
```

【h】新建onlineUserList.html,用于展示所有在线用户

```xml
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <title>在线用户管理</title>
</head>
<body>
<h3>在线用户数: <span th:text="${onlineUserList.size()}"></span></h3>
<table border="1px">
    <tr>
        <th>用户id</th>
        <th>用户名称</th>
        <th>登录时间</th>
        <th>最后访问时间</th>
        <th>主机</th>
        <th>状态</th>
        <th>会话ID</th>
    </tr>
    <tr th:each="user : ${onlineUserList}">
        <th th:text="${user.userId}"></th>
        <th th:text="${user.username}"></th>
        <th th:text="${#dates.format(user.startTimestamp, 'yyyy-MM-dd HH:mm:ss')}"></th>
        <th th:text="${#dates.format(user.lastAccessTime, 'yyyy-MM-dd HH:mm:ss')}"></th>
        <th th:text="${user.host}"></th>
        <th th:text="${user.status}"></th>
        <th th:text="${user.sessionId}"></th>
    </tr>
</table>
</body>
</html>
```

【i】success.html加入如下超链接，用于跳转查看所有在线用户列表

```xml
<div>跳转到onlineUserList.html: <a href="/onlineUserList">查看用户在线管理列表</a><br></div>
```

【j】测试

启动项目，分别使用两个浏览器，一个浏览器用admin/123456登录，一个浏览器使用user/123456进行登录。

然后点击查看在线用户列表：

可以看到，当前在线用户是两个，这就完成了在线用户管理功能。

接下来我们测试一下强制踢出某个用户，使用会话ID进行踢出，这里为了方便，使用postman方式，传入会话ID，去删除会话信息：

然后再次查看当前用户列表：

可以看到，admin用户已经被踢出了。

> 注意：由于使用外部直接调用接口的方式去踢出，所以在Shiro配置类中需要放行/forceLogout接口。

```java
filterChainDefinitionMap.put("/forceLogout", "anon");
```

## 四、总结

本篇文章主要总结了Shiro结合Redis实现在线会话管理功能，并通过一个统计当前在线用户总人数、强制踢出用户的小案例，说明了相关API的使用方法，本文采用的是RedisSessionDAO，即用的redis缓存。

Shiro也支持使用Ehcache缓存实现，那么在Shiro配置类中就需要注入MemorySessionDAO对象，而不是RedisSessionDAO。

```java
@Bean
public SessionDAO sessionDAO() {
    MemorySessionDAO sessionDAO = new MemorySessionDAO();
    return sessionDAO;
}
```

> 说明：当某个用户被踢出后（Session Time置为0），该Session并不会立刻从ActiveSessions中剔除，所以我们可以通过其timeout信息来判断该用户在线与否。
