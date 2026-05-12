# 16、Spring Security 实战 - 使用JSON登录
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/9/16.html
- 分类：安全框架
- 分组：教程目录
## 前言

**SpringSecurity**默认使用表单登录，不支持Json方式登录，接下来设置既可以支持表单登录，也可以支持Json方式登录。

## 实现

```java
public class SignInFilter extends UsernamePasswordAuthenticationFilter {
    @Override
    public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response) throws
            AuthenticationException {
        if (MediaType.APPLICATION_JSON_VALUE.equals(request.getContentType()) && request.getMethod().equals("POST")) {
            Map<String, String> requestBody = null;
            try {
                requestBody = new ObjectMapper().readValue(request.getInputStream(), Map.class);
            } catch (IOException e) {
                throw new ValidateCodeException(ResultCode.CODE_ERROR.getMessage());
            }
            String sessionCode = (String) request.getSession().getAttribute(Constant.IMAGE_CODE);
            String inputCode = requestBody.get("code");
            validateCode(sessionCode, inputCode);
            String username = requestBody.get(getUsernameParameter());
            String password = requestBody.get(getPasswordParameter());
            if (username == null) {
                username = "";
            }
            if (password == null) {
                password = "";
            }
            username = username.trim();
            UsernamePasswordAuthenticationToken authRequest = new UsernamePasswordAuthenticationToken(
                    username, password);
            setDetails(request, authRequest);
            return this.getAuthenticationManager().authenticate(authRequest);
        } else {
            validateCodeForm(request);
            return super.attemptAuthentication(request, response);
        }
    }
    private void validateCodeForm(HttpServletRequest request) {
        String sessionCode = (String) request.getSession().getAttribute(Constant.IMAGE_CODE);
        String inputCode = request.getParameter("code");
        validateCode(sessionCode, inputCode);
    }
    private void validateCode(String sessionCode, String inputCode) {
        if (StringUtils.isBlank(inputCode)) {
            throw new ValidateCodeException(ResultCode.CODE_NOT_NULL.getMessage());
        }
        if (!StringUtils.equalsIgnoreCase(sessionCode, inputCode)) {
            throw new ValidateCodeException(ResultCode.CODE_ERROR.getMessage());
        }
    }
}
```

```java
@Bean
SignInFilter signInFilter() throws Exception {
    SignInFilter signInFilter = new SignInFilter();
    signInFilter.setAuthenticationManager(authenticationManagerBean());
    signInFilter.setAuthenticationSuccessHandler(signInSuccessHandler);
    signInFilter.setAuthenticationFailureHandler(signInFailureHandler);
    return signInFilter;
}
```

```java
http.addFilterAt(signInFilter(), UsernamePasswordAuthenticationFilter.class);
```

在**SignInFilter **中已经加了验证码验证，所以将之前的验证注释掉

```java
//        http.addFilterBefore(imageCodeFilter, UsernamePasswordAuthenticationFilter.class);
```
