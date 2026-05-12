# 05、Spring Security 入门 - 自定义登录逻辑
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/5/5.html
- 分类：安全框架
- 分组：教程目录
当 进 行 自 定 义 登 录 逻 辑 时 需 要 用 到 之 前 讲 解 的 UserDetailsService 和 PasswordEncoder。但是 Spring Security 要求：当进行自定义登录逻辑时容器内必须有 PasswordEncoder 实例。所以不能直接 new 对象

### 1.编写配置类

新建类 com.dqcgm.config.SecurityConfig 编写下面内容

```java
@Configuration
public class SecurityConfig {
	@Bean
	public PasswordEncoder getPwdEncoder(){
		return new BCryptPasswordEncoder();
	}
}
```

### 2.自定义逻辑

在 Spring Security 中实现 UserDetailService 就表示为用户详情服务。在这个类中编写用户认证逻辑。

```java
@Service
public class UserDetailsServiceImpl implements UserDetailsService {
	@Autowired
	private PasswordEncoder encoder;
	@Override
	public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
		//1. 查询数据库判断用户名是否存在，如果不存在抛出 UsernameNotFoundException
		if(!username.equals("admin")){
			throw new UsernameNotFoundException("用户名不存在");
		}
		//把查询出来的密码进行解析,或直接把 password 放到构造方法中。
		//理解:password 就是数据库中查询出来的密码，查询出来的内容不是 123
		String password = encoder.encode("123");
		return new User(username,password, AuthorityUtils.commaSeparatedStringToAuthorityList("admin"));
	}
}
```

### 3.查看效果

重启项目后，在浏览器中输入账号：admin，密码：123。后可以正确进入到 login.html 页面。
