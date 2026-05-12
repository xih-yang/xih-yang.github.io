# 20、Shiro 实战：Session持久化(SessionDAO)
- 来源：https://ddkk.com/zhuanlan/security/shiro/8/20.html
- 分类：安全框架
- 分组：Shiro 实战 (A)
注：该系列所有测试均在之前创建的Shiro3的Web工程的基础上。

上一篇说到了Shiro是如何控制Session会话的，而对于分布式系统，一般都牵扯到Session共享问题，而想实现Session共享，就要实现Session的持久化操作，即是将内存中的Session持久化至缓存数据库。本篇就讲解一下使用Shiro实现Session会话的持久化操作，即SessionDAO的相关知识。

SessionDAO是Shiro提供的一个数据交互层的interface接口，其作用是可以将Session写入到数据库中，然后可以对Session进行增删改查操作。

通过下面的UML图来看一下，Shiro为我们操作Session提供了哪些API。

其中SessionDao是最顶级的接口，它有一个简单的实现叫AbstractSessionDAO，而在AbstractSessionDAO下又有两个实现类，分别是CachingSessionDAO和MemorySessionDAO，CachingSessionDAO提供了缓存的操作，而MemorySessionDAO可以让我们在内存中操作Session。

而CachingSessionDAO是一个抽象类，它有一个简单的实现EnterpriseCacheSessionDAO，一般在开发过程中推荐大家直接继承EnterpriseCacheSessionDAO。

总结：

**(1)AbstractSessionDAO**

提供了SessionDAO的基础实现，如生成会话ID等。

**(2)CachingSessionDAO**

提供了对开发者透明的会话缓存的功能，需要设置相应的CacheManager。

**(3)EnterpriseCacheSessionDAO**

提供了缓存功能的会话维护，默认情况下使用MapCache实现，内部使用ConcurrentHashMap保存缓存的会话。

下面我们专门针对EnterpriseCacheSessionDAO进行讲解，打开它的源代码：

可以看到，除了构造方法，它下面一共有四个方法“doCreate”、“doReadSession”、“doUpdate”和“doDelete”。其中只有doCreate是实现的，其它的都是没有实现的方法。

注意上面的doCreate方法，首先是要获取sessionId，而获取SessionId的方法为generateSessionId,而该方法是AbstractSessionDAO提供的：

可以看到获取sessionId需要一个名为“sessionIdGenerator”的属性，所以我们在配置文件中配置EnterpriseCacheSessionDAO的时候需要为其设备“sessionIdGenerator”属性。而sessionIdGenerator有两种实现，分别是JavaUuidSessionIdGenerator和RandomSessionIdGenerator:

了解了上面的知识后，下面为大家展示一个SessionDAO配置的实例：

```xml
<!-- Session ID 生成器 -->
<bean id="sessionIdGenerator" class="org.apache.shiro.session.mgt.eis.JavaUuidSessionIdGenerator">
</bean>
<!-- Session DAO 继承自EnterpriseCacheSessionDAO-->
<bean id="sessionDAO" class="org.apache.shiro.session.mgt.eis.EnterpriseCacheSessionDAO">
    <property name="activeSessionCacheName" value="shiro-activeSessionCache"/>
    <property name="sessionIdGenerator" ref="sessionIdGenerator"/>
</bean>
<!-- 会话管理器 -->
<bean id="sessionManager" class="org.apache.shiro.session.mgt.DefaultSessionManager">
    <property name="globalSessionTimeout" value="1800000"/> <!-- Session失效时长，单位毫秒 -->
    <property name="deleteInvalidsessions" value="true"/>
    <!-- 是否定期检查Session的有效性 -->
    <property name="sessionValidationSchedulerEnabled" value="true"/>
    <property name="sessionDAO" ref="sessionDAO"/>
</bean>
```

其中“shiro-activeSessionCache”在ehcache.xml中配置：

```xml
<cache name="shiro-activeSessionCache"
           eternal="false"
           timeToIdleSeconds="3600"
           timeToLiveSeconds="0"
           overflowToDisk="false"
           statistics="true">
    </cache>
```

那么我们如何来对Session进行增删改查呢？我们要使用“对象输入输出流”来进行读写操作。这些“对象输入输出流”我们要进行包装，即利用字节数组输入输出流来包装。

操作步骤：

**(1)创建存储Session的数据库表**

其中session字段是一个2000长度的长文本字段（即是序列化后的Session）。

**(2)SessionDao的实现**

下面是继承了EnterpriseCacheSessionDAO的sessionDAO的实现类(或再继承sessionDAO的实现类)：

其中使用JDBC来进行数据库的操作（其中JdbcTemplate是JDBC的一个数据库连接实例，在XML配置了连接参数，在这里采用自动注入）。

**(3)序列化和反序列化实现**

这里进行插入和读取的时候，分解使用了SerializableUtils的serialize和deserialize方法，对Session进行序列化和反序列化：

这里序列化就运用了“对象输出流”，包装了“字节组输出流”来为Session进行序列化；而反序列化运用了“对象输入流”，包装了“字节组输入流”，来对Session的序列字符串进行实体类转换。

最后注意一个小东西“会话验证”：

Shiro提供了会话验证调度器，用于定期的验证会话是否已过期，如果过期将停止会话。处于性能考虑，一般情况下都是获取会话时来验证会话是否过期并停止会话的；但是如果在Web环境中，如果用户不主动退出是不知道会话是否过期的，因此需要定期的检测会话是否过期，Shiro提供了会话验证调度器sessionValidationScheduler，同时也提供了使用Quartz会话验证调度器QuartzSessionValidationScheduler。

最后跟大家分析一个使用Shrio+Redis实现Session共享的一个配置：

```xml
<!-- Session Manager -->
<bean id="sessionManager" class="org.apache.shiro.web.session.mgt.DefaultWebSessionManager">
    <!-- 相隔多久检查一次session的有效性   -->
    <property name="sessionValidationInterval" value="1800000"/>  
    <!-- session 有效时间为半小时 （毫秒单位）-->  
    <property name="globalSessionTimeout" value="1800000"/>
    <!-- 是否开启Session失效 检测，默认开启 -->
    <property name="sessionValidationSchedulerEnabled" value="true"/>
    <!-- 是否删除无效的，默认也是开启 -->
    <property name="deleteInvalidSessions" value="true"/>
    <property name="sessionDAO" ref="customShiroSessionDAO"/>
</bean>
<bean id = "customShiroSessionDAO" class="com.test.shiro.cache.customShiroSessionDAO">
    <property name ="shrioSessionRepository" ref = "shrioSessionRepository"/>
</bean>
<bean id = "shrioSessionRepository" class="com.test.shiro.cache.JedisShiroSessionRepository"/>
  <property name = "redisManager" ref = "redisManager"/>
</bean>
```

其中customShiroSessionDAO是自定义类，继承了AbstractSessionDAO父类，而JedisShiroSessionRepository也是自定义类，注入了redisManager(这里redisManager的配置略)。值得一提的是，Shiro自己也有一个缓存管理器：cacheManager，重写它也可以满足缓存共享，这里不再讲解，感兴趣的童鞋可以自己学习一下。
