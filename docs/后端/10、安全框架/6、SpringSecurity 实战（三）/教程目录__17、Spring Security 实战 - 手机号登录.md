# 17、Spring Security 实战 - 手机号登录
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/9/17.html
- 分类：安全框架
- 分组：教程目录
## 前言

**SpringSecurity**默认不支持短信验证码登录，而现在手机验证码登录随处可见，下面对**SpringSecurity**进行集成手机短信登录。

## 实现

```java
public class MobileAuthenticationToken extends AbstractAuthenticationToken {
    private static final long serialVersionUID = 540L;
    private final Object principal; // 认证前是手机号，最终保存用户信息
    public MobileAuthenticationToken(Object principal) {
        super(null);
        this.principal = principal;
        this.setAuthenticated(false);
    }
    public MobileAuthenticationToken(Object principal, Collection<? extends GrantedAuthority> authorities) {
        super(authorities);
        this.principal = principal;
        super.setAuthenticated(true);
    }
    public Object getCredentials() {
        return null;
    }
    public Object getPrincipal() {
        return this.principal;
    }
    public void setAuthenticated(boolean isAuthenticated) throws IllegalArgumentException {
        Assert.isTrue(!isAuthenticated, "Cannot set this token to trusted - use constructor which takes a " +
                "GrantedAuthority list instead");
        super.setAuthenticated(false);
    }
    public void eraseCredentials() {
        super.eraseCredentials();
    }
}
```

```java
public class MobileAuthenticationFilter extends AbstractAuthenticationProcessingFilter {
    private String mobileParameter = "mobile";
    private boolean postOnly = true;
    public MobileAuthenticationFilter() {
        super(new AntPathRequestMatcher("/login/mobile", "POST"));
    }
    public MobileAuthenticationFilter(AuthenticationManager authenticationManager) {
        super(new AntPathRequestMatcher("/login/mobile", "POST"), authenticationManager);
    }
    public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response) throws
            AuthenticationException {
        if (this.postOnly && !request.getMethod().equals("POST")) {
            throw new AuthenticationServiceException("Authentication method not supported: " + request.getMethod());
        } else {
            String mobile = this.obtainMobile(request);
            mobile = mobile != null ? mobile : "";
            mobile = mobile.trim();
            MobileAuthenticationToken authRequest = new MobileAuthenticationToken(mobile);
            this.setDetails(request, authRequest);
            return this.getAuthenticationManager().authenticate(authRequest);
        }
    }
    private String obtainMobile(HttpServletRequest request) {
        return request.getParameter(this.mobileParameter);
    }
    /**
     * 将sessionId和hostname添加到MobileAuthenticationToken
     *
     * @param request     request
     * @param authRequest authRequest
     */
    private void setDetails(HttpServletRequest request, MobileAuthenticationToken authRequest) {
        authRequest.setDetails(this.authenticationDetailsSource.buildDetails(request));
    }
    public void setPostOnly(boolean postOnly) {
        this.postOnly = postOnly;
    }
    public String getMobileParameter() {
        return mobileParameter;
    }
    public void setMobileParameter(String mobileParameter) {
        this.mobileParameter = mobileParameter;
    }
}
```

```java
public class MobileAuthenticationProvider implements AuthenticationProvider {
    private UserDetailsService userDetailsService;
    public void setUserDetailsService(UserDetailsService userDetailsService) {
        this.userDetailsService = userDetailsService;
    }
    @Override
    public Authentication authenticate(Authentication authentication) throws AuthenticationException {
        MobileAuthenticationToken mobileAuthenticationToken = (MobileAuthenticationToken) authentication;
        String mobile = (String) mobileAuthenticationToken.getPrincipal();
        UserDetails userDetails = userDetailsService.loadUserByUsername(mobile);
        MobileAuthenticationToken authenticationToken = new MobileAuthenticationToken(userDetails, userDetails
                .getAuthorities());
        authenticationToken.setDetails(mobileAuthenticationToken.getDetails());
        return authenticationToken;
    }
    @Override
    public boolean supports(Class<?> aClass) {
        return MobileAuthenticationToken.class.isAssignableFrom(aClass);
    }
}
```

```java
@Service
public class MobileUserDetails implements UserDetailsService {
    @Autowired
    private SysUserService sysUserService;
    @Override
    public UserDetails loadUserByUsername(String mobile) throws UsernameNotFoundException {
        SysUser sysUser = sysUserService.findUserMenuByMobile(mobile);
        if (sysUser == null) {
            throw new UsernameNotFoundException("用户名或密码错误");
        }
        return sysUser;
    }
}
```

```java
@Component
public class MobileConfig extends SecurityConfigurerAdapter<DefaultSecurityFilterChain, HttpSecurity> {
    @Autowired
    LoginSuccessHandler loginSuccessHandler;
    @Autowired
    LoginFailureHandler loginFailureHandler;
    @Autowired
    MobileUserDetails mobileUserDetails ;
    @Override
    public void configure(HttpSecurity http) {
        MobileAuthenticationFilter mobileAuthenticationFilter = new MobileAuthenticationFilter();
        mobileAuthenticationFilter.setAuthenticationManager(http.getSharedObject(AuthenticationManager.class));
        mobileAuthenticationFilter.setAuthenticationSuccessHandler(loginSuccessHandler);
        mobileAuthenticationFilter.setAuthenticationFailureHandler(loginFailureHandler);
        mobileAuthenticationFilter.setRememberMeServices(http.getSharedObject(RememberMeServices.class));
        SessionAuthenticationStrategy sessionStrategy = http.getSharedObject(SessionAuthenticationStrategy.class);
        mobileAuthenticationFilter.setSessionAuthenticationStrategy(sessionStrategy);
        MobileAuthenticationProvider mobileAuthenticationProvider = new MobileAuthenticationProvider();
        mobileAuthenticationProvider.setUserDetailsService(mobileUserDetails);
        http.authenticationProvider(mobileAuthenticationProvider);
        http.addFilterBefore(mobileAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
    }
}
```

```java
@Autowired
private MobileConfig mobileConfig;
```

```java
http.apply(mobileConfig);
```

```java
public interface SmsService {
    /**
     * 发送短信验证码
     *
     * @param mobile 手机号
     * @param content 发送内容
     * @return 成功/失败
     */
    boolean sendSms(String mobile, String content);
}
```

```java
@Service
public class Sms implements SmsService {
    @Override
    public boolean sendSms(String mobile, String content) {
        String pattern = String.format("IT独狼，验证码为%s，请妥善保管，不要泄露！", content);
        log.info("向手机号为：{}，成功发送了一条验证码：{}", mobile, content);
        return true;
    }
}
```

```java
/**
 * 生成手机验证码
 *
 * @param request request
 */
@GetMapping("code/sms")
public Result smsCode(HttpServletRequest request, @RequestParam String mobile) {
    String code = RandomStringUtils.randomNumeric(4);
    request.getSession().setAttribute(Constant.SMS_CODE, code);
    smsService.sendSms(mobile, code);
    return Result.ok().message("短信发送成功");
}
```
