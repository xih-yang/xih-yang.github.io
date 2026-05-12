# 09、Spring Security 实战 - 设置用户最大登录数
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/9/9.html
- 分类：安全框架
- 分组：教程目录
## 前言

在项目中，可能会有这样的需求，只允许用户同一时间只能在一处登录。

## 实现

设置Session过期策略，创建SessionExpiredStrategy 类

```java
@Component
public class SessionExpiredStrategy implements SessionInformationExpiredStrategy {
    @Autowired
    private SignInFailureHandler signInFailureHandler;
    @Override
    public void onExpiredSessionDetected(SessionInformationExpiredEvent event) throws IOException {
        UserDetails userDetails = (UserDetails) event.getSessionInformation().getPrincipal();
        String format = String.format("尊敬的[%s]，您的账号在其他地方登录，请及时修改密码！", userDetails.getUsername());
        AuthenticationException exception = new AuthenticationServiceException(format);
        signInFailureHandler.onAuthenticationFailure(event.getRequest(), event.getResponse(), exception);
    }
}
```

设置Session失效策略，创建SessionInvalidStrategy类

```java
@Component
public class SessionInvalidStrategy implements InvalidSessionStrategy {
    @Autowired
    private SessionRegistry sessionRegistry;
    @Override
    public void onInvalidSessionDetected(HttpServletRequest request, HttpServletResponse response) throws
            IOException {
        sessionRegistry.removeSessionInformation(request.getRequestedSessionId());
        cancelCookie(request, response);
        Result result = Result.error().message("您当前的会话已超时，请重新登录!");
        response.setContentType(MediaType.APPLICATION_JSON_UTF8_VALUE);
        response.getWriter().write(JsonUtil.toJsonString(result));
    }
    private void cancelCookie(HttpServletRequest request, HttpServletResponse response) {
        Cookie cookie = new Cookie("JSESSIONID", null);
        cookie.setMaxAge(0);
        cookie.setPath(this.getCookiePath(request));
        response.addCookie(cookie);
    }
    private String getCookiePath(HttpServletRequest request) {
        String contextPath = request.getContextPath();
        return contextPath.length() > 0 ? contextPath : "/";
    }
}
```

在退出登录时，删除Session信息，创建SignOutHandler类

```java
@Component
public class SignOutHandler implements LogoutHandler {
    @Autowired
    private SessionRegistry sessionRegistry;
    @Override
    public void logout(HttpServletRequest request, HttpServletResponse response, Authentication authentication) {
        sessionRegistry.removeSessionInformation(request.getSession().getId());
    }
}
```

在**SpringSecurityConfig**中添加以下代码

注入需要的Bean

```java
@Autowired
SignOutHandler signOutHandler;
@Autowired
SessionExpiredStrategy sessionExpiredStrategy;
@Autowired
SessionInvalidStrategy sessionInvalidStrategy;
@Bean
SessionRegistry sessionRegistry() {
    return new SessionRegistryImpl();
}
```

退出时删除Session

```java
	http.logout()
		.addLogoutHandler(signOutHandler)
		.logoutSuccessHandler(signOutSuccessHandler);
```

```java
	http.sessionManagement()
		.invalidSessionStrategy(sessionInvalidStrategy)
		.maximumSessions(1)
		.expiredSessionStrategy(sessionExpiredStrategy)
		.sessionRegistry(sessionRegistry());
```
