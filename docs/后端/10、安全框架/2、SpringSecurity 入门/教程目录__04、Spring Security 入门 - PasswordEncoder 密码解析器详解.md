# 04、Spring Security 入门 - PasswordEncoder 密码解析器详解
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/5/4.html
- 分类：安全框架
- 分组：教程目录
Spring Security 要求容器中必须有 PasswordEncoder 实例。所以当自定义登录逻辑时要求必须给容器注入 PaswordEncoder 的 bean 对象

### 1.接口介绍

encode():把参数按照特定的解析规则进行解析

matches()验证从存储中获取的编码密码与编码后提交的原始密码是否匹配。如果密码匹配，则返回 true；如果不匹配，则返回 false。第一个参数表示需要被解析的密码。第二个参数表示存储的密码。

upgradeEncoding()：如果解析的密码能够再次进行解析且达到更安全的结果则返回 true，否则返回 false。默认返回 false。

### 2.内置解析器介绍

在 Spring Security 中内置了很多解析器。

### 3.BCryptPasswordEncoder 简介

BCryptPasswordEncoder 是 Spring Security 官方推荐的密码解析器，平时多使用这个解析器

BCryptPasswordEncoder 是对 bcrypt 强散列方法的具体实现。是基于 Hash 算法实现的单向加密。可以通过 strength 控制加密强度，默认 10.

### 4.代码演示

在项目 src/test/java 下新建 com.dqcgm.MyTest 测试BCryptPasswordEncoder 用法。

```java
@SpringBootTest
@RunWith(SpringRunner.class)
public class MyTest {
	@Test
	public void test(){
		//创建解析器
		PasswordEncoder encoder = new BCryptPasswordEncoder();
		//对密码进行加密
		String password = encoder.encode("123");
		System.out.println("------------"+password);
		//判断原字符加密后和内容是否匹配
		boolean result = encoder.matches("123",password);
		System.out.println("============="+result);
	}
}
```
