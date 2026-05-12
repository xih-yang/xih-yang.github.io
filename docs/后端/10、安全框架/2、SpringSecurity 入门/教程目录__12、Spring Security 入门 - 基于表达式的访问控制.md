# 12、Spring Security 入门 - 基于表达式的访问控制
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/5/12.html
- 分类：安全框架
- 分组：教程目录
### 1.access()方法使用

之前的登录用户权限判断实际上底层实现都是调用 access(表达式)

可以通过 access()实现和之前学习的权限控制完成相同的功能

#### 1.1 以 hasRole 和 permitAll 举例

下面代码和直接使用 permitAll()和 hasRole()是等效的。

### 2.使用自定义方法

虽然这里面已经包含了很多的表达式(方法)但是在实际项目中很有可能出现需要自己自定义逻辑的情况。

判断登录用户是否具有访问当前 URL 权限。

#### 2.1 新建接口及实现类

新建接口 com.dqcgm.service.MyService 后新建实现类

```java
public interface MyService {
	boolean hasPermission(HttpServletRequest request, Authentication authentication);
}
```

```java
@Component
public class MyServiceImpl implements MyService {
	@Override
	public boolean hasPermission(HttpServletRequest request, Authentication authentication) {
		Object obj = authentication.getPrincipal();
		if(obj instanceof UserDetails){
			UserDetails user = (UserDetails) obj;
			Collection<? extends GrantedAuthority> authorities = user.getAuthorities();
			return authorities.contains(new SimpleGrantedAuthority(request.getRequestURI()));
		}
		return false;
	}
}
```

#### 2.2 修改配置类

在 access 中通过@bean 的 id 名.方法(参数)的形式进行调用

配置类中修改如下：

```java
// url 拦截 (授权)
http.authorizeRequests()
	.antMatchers("/login.html").access("permitAll")
	.antMatchers("/fail.html").permitAll()
	.anyRequest().access("@myServiceImpl.hasPermission(request,authentication)");
```
