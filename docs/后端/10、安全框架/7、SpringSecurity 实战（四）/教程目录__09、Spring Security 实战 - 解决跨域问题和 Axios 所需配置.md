# 09、Spring Security 实战 - 解决跨域问题和 Axios 所需配置
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/11/9.html
- 分类：安全框架
- 分组：教程目录
啥是跨域？

在小编的这篇博客中阐述了——[【AJAX】AJAX的跨域问题](https://blog.csdn.net/qq_63691275/article/details/128435374?ops_request_misc=&request_id=af5b6dd20d8c4ed88aa1a0e9013a9f4c&biz_id=&utm_medium=distribute.pc_search_result.none-task-blog-2~blog~koosearch~default-1-128435374-null-null.268%5Ev1%5Econtrol&utm_term=%E8%B7%A8%E5%9F%9F&spm=1018.2226.3001.4450)，这编只说跨域的方案。

这里说明一下下面SpringMVC 跨域方案测试案例中前端的核心代码如下，就一个 Ajax 请求，然后将内容渲染出来：

首先是对 `axios` 的一些初始化：

然后向后端发送Ajax请求，将响应数据渲染，代码如下：

```java
<script setup>
import {
       ref } from 'vue'
import axios from '../utils/index.js'
const content = ref('')
axios.get(/test).then(res=>`{
    content.value = res
}).catch(err=>{
    console.log(err)
})
</script>
<template>
    <div>{
    {content}}</div>
</template>
```

如果没有跨域成功会有如下错误：

## 一、SpringMVC 跨域的解决方案

### @CrossOrigin（注解的方式解决）

SpringMVC 中第一种处理跨域的方式是通过 @CrossOrigin 注解来标记支持跨域，该注解可以添加在方法上，也可以添加在类上——根据如下框住的元注解可知：

具体案例配置如下：

```java
@RestController
public class TestController {
    @CrossOrigin("http://localhost:5173")
    @GetMapping("/test")
    public String test(){
        return "test";
    }
}
```

@CrossOrigin 注解各属性含义如下：

- maxAge：预检请求的有效期，有效期内不必再次发送预检请求，默认是 -1.
- methods：允许的请求方法，*表示允许所有方法（请求方式）.
- origins：允许的域，* 表示允许所有域，和 value 属性是一样的。

案例测试结果如下

### addCorsMappings（实现WebMvcConfigurer接口，重写方法）

@CrossOrigin 注解需要添加在不同的 Controller 上。所以还有一种全局的配置方法，就是通过重写 WebMvcConfigurer#addCorsMappings 方法来实现，具体配置如下：

```java
@Configuration
public class WebMvcOriginConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")// 对所有请求进行跨域
                .allowedOriginPatterns("http://localhost:5173")
                .maxAge(-1)
                .allowedMethods("*");
    }
}
```

TestController

```java
@RestController
public class TestController {
    // @CrossOrigin("http://localhost:5173")
    @GetMapping("/test")
    public String test(){
        return "test";
    }
}
```

测试结果

## 二、Spring Security 跨域的解决方案

当我们为项目添加了 Spring Security 依赖之后，上面俩种跨域方式会失效。 所以咱得会 Spring Security 为我们提供的跨域方案。

```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    return http.authorizeRequests()
            .anyRequest()
            .authenticated()
            .and()
            .addFilterAfter(loginFilter(http),LogoutFilter.class)
            .cors()
            .configurationSource(this.corsConfigurationSource())
            .and()
            .csrf()
            .disable()
            .build();
}
private CorsConfigurationSource corsConfigurationSource(){
    CorsConfiguration corsConfiguration = new CorsConfiguration();
    corsConfiguration.setAllowCredentials(true);
    corsConfiguration.addAllowedHeader("*"); // 这个得加上，一些复杂的请求方式会带有header，不加上跨域会失效。
    corsConfiguration.addAllowedMethod("*");
    corsConfiguration.addExposedHeader("*");
    corsConfiguration.addAllowedOriginPattern("http://localhost:5173");
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**",corsConfiguration);
    return source;
}
```

注1：corsConfiguration.setAllowCredentials(true);

corsConfiguration.addAllowedHeader(" * “);

corsConfiguration.addExposedHeader(” * "); 这三都应该加上，原因1：一些请求方式发送的请求会带有请求头，不允许的话会被 `CorsFilter` 过滤器给过滤掉，即跨域失败；原因2：凭证信息不包含的话那认证过滤的时候会失败，从而导致请求失败。

注2：那配置的安全过滤器链的方法里，有配置自定义的 LoginFilter，那是用于处理 JSON 格式的登录认证，在小编Spring Security 实战 专栏中有专门的博客说明，这里不具体解释了。

### 前后端跨域测试（前端相关配置）

由于集成了 Spring Security，登录后需要进行认证，认证完请求服务器端要认证的资源需要携带其认证的Cookie（也就是那个SessionID，表明已经认证了）。那么在前端使用 Axios 发送跨域请求的时候，就需要配置 `axios.defaults.withCredentials = true` 。**这是用于控制在发送跨域请求时是否携带身份凭证的（例如 Cookie、Http认证等）** ，当然后端也需要配置。（当然不集成 Spring Security的话，是不需要配置这个的，因为什么登录认证是按你自己设定的程序走，不是由 Spring Security 去帮你管理了）

前端代码：

Axios 相关配置

测试代码

```java
<script setup>
import {
       ref } from 'vue'
import axios from '../utils/index.js'
const content = ref('')
const userInfo = {
    "username" : "root",
    "password" : "123"
}
let flag = false
function login() {
    axios.post(/api/auth/login, userInfo).then(res =>` {
        console.log(res)
        content.value = JSON.stringify(res)
        flag = true
    }).catch(err=>{
        console.log(666999)
        console.log(err)
    })
}
function test(){
    axios.get(/test,{
        withCredentials: true,   //设置跨域的时候传递cookie，需要服务端的配合
    }).then(res=>{
        console.log(res)
        content.value = res
    }).catch(err=>{
        console.log(666)
        console.log(err)
    })
}
</script>
<template>
    <div>
        <button @click="login">登录</button><br><br>
        <button @click="test">发送测试请求</button><br><br>
        <div>
            <p>{
    {content}}</p>
        </div>
    </div>
</template>
```

测试结果
