# 15、Spring Security 实战 - 添加验证码
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/9/15.html
- 分类：安全框架
- 分组：教程目录
## 前言

为什么需要添加验证码呢，如果没有验证码，不是也可以登录吗？验证码的主要作用是为了区分是人操作还是机器操作，防止机器自动注册和登录；如果没有验证码环节，机器可以无限制的注册用户，压垮数据库，当然登录也是一样，可以通过机器登录，然后肆无忌惮地朝网络上倾倒大量的、无意义的僵尸信息，垃圾邮件、垃圾广告、垃圾评论。

## 实现

添加依赖

```xml
<dependency>
	<groupId>com.github.penggle</groupId>
	<artifactId>kaptcha</artifactId>
	<version>2.3.2</version>
</dependency>
```

设置验证码属性

```java
@Configuration
public class ImageCodeProperties {
    @Bean
    public DefaultKaptcha getImageCode() {
        DefaultKaptcha defaultKaptcha = new DefaultKaptcha();
        Properties properties = new Properties();
        properties.setProperty(Constants.KAPTCHA_BORDER, "yes");
        properties.setProperty(Constants.KAPTCHA_BORDER_COLOR, "192,192,192");
        properties.setProperty(Constants.KAPTCHA_IMAGE_WIDTH, "110");
        properties.setProperty(Constants.KAPTCHA_IMAGE_HEIGHT, "40");
        properties.setProperty(Constants.KAPTCHA_TEXTPRODUCER_FONT_COLOR, "blue");
        properties.setProperty(Constants.KAPTCHA_TEXTPRODUCER_FONT_SIZE, "28");
        properties.setProperty(Constants.KAPTCHA_TEXTPRODUCER_FONT_NAMES, "宋体");
        properties.setProperty(Constants.KAPTCHA_TEXTPRODUCER_CHAR_LENGTH, "4");
        properties.setProperty(Constants.KAPTCHA_OBSCURIFICATOR_IMPL, "com.google.code.kaptcha.impl.ShadowGimpy");
        Config config = new Config(properties);
        defaultKaptcha.setConfig(config);
        return defaultKaptcha;
    }
}
```

添加图形验证码过滤器

```java
@Component
public class ImageCodeFilter extends OncePerRequestFilter {
    @Autowired
    private SignInFailureHandler signInFailureHandler;
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain
            filterChain) throws IOException, ServletException {
        if (StringUtils.equals(request.getRequestURI(), "/login") &&
                StringUtils.equalsIgnoreCase(request.getMethod(), "POST")) {
            try {
                validateCode(request);
            } catch (AuthenticationException exception) {
                signInFailureHandler.onAuthenticationFailure(request, response, exception);
                return;
            }
        }
        filterChain.doFilter(request, response);
    }
    private void validateCode(HttpServletRequest request) {
        String sessionCode = (String) request.getSession().getAttribute(Constant.IMAGE_CODE);
        String inputCode = request.getParameter("code");
        if (StringUtils.isBlank(inputCode)) {
            throw new ValidateCodeException(ResultCode.CODE_NOT_NULL.getMessage());
        }
        if (!StringUtils.equalsIgnoreCase(sessionCode, inputCode)) {
            throw new ValidateCodeException(ResultCode.CODE_ERROR.getMessage());
        }
    }
}
```

创建常量类

```java
public interface Constant {
    /**
     * 图片验证码
     */
    String IMAGE_CODE = "IMAGE_CODE";
}
```

创建异常类

```java
public class ValidateCodeException extends AuthenticationException {
    public ValidateCodeException(String msg, Throwable cause) {
        super(msg, cause);
    }
    public ValidateCodeException(String msg) {
        super(msg);
    }
}
```

将图形验证码过滤器添加到**SpringSecurityConfig**中，放在**UsernamePasswordAuthenticationFilter**前面

```java
http.addFilterBefore(imageCodeFilter, UsernamePasswordAuthenticationFilter.class);
```

添加请求验证码的接口

```java
@Autowired
private DefaultKaptcha defaultKaptcha;
```

```java
/**
 * 生成图片验证码
 *
 * @param request  request
 * @param response response
 * @throws IOException IOException
 */
@GetMapping("code/image")
public void imageCode(HttpServletRequest request, HttpServletResponse response) throws IOException {
    String code = defaultKaptcha.createText();
    request.getSession().setAttribute(Constant.IMAGE_CODE, code);
    BufferedImage image = defaultKaptcha.createImage(code);
    ServletOutputStream outputStream = response.getOutputStream();
    ImageIO.write(image, "jpg", outputStream);
}
```

## 验证

不带验证登录，提示**验证码不能为空**

接下来获取验证

带验证登录，先输入**错误的验证码**

输入**正确的验证码**

**登录成功**
