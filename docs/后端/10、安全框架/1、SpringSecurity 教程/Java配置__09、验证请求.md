# 09、验证请求
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/1/9.html
- 分类：安全框架
- 分组：Java配置
我们的例子中要求用户进行身份验证并且在我们应用程序的每个URL这样做。我们可以通过给`http.authorizeRequests()`添加多个子节点来指定多个定制需求到我们的URL。例如：

```java
protected void configure(HttpSecurity http) throws Exception { 
    http 
        .authorizeRequests()  //1 
            .antMatchers("/resources/**", "/signup", "/about").permitAll() //2 
            .antMatchers("/admin/**").hasRole("ADMIN") //3 
            .antMatchers("/db/**").access("hasRole('ADMIN') and hasRole('DBA')")            4 
            .anyRequest().authenticated()  //5 
            .and() 
        // ... 
        .formLogin(); 
} 
```

**1、**`http.authorizeRequests()`方法有多个子节点，每个macher按照他们的声明顺序执行；

**2、** 我们指定任何用户都可以访问的多个URL模式任何用户都可以访问URL以“/resources/“,开头的URL,以及”/signup”,“/about”.；

**3、** 以”/admin/“开头的URL只能由拥有“ROLE*ADMIN”角色的用户访问.请注意我们使用HasRole方法，没有使用ROLE*前缀；

**4、** 任何以/db/开头的URL需要用户同时具有”ROLE*ADMIN”和“ROLE_DBA”.和上面一样我们的hasRole方法也没有使用ROLE*前缀；

**5、** 尚未匹配的任何URL要求用户进行身份验证；
