# 01、Spring Security 实战 - Spring Security的整体架构
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/11/1.html
- 分类：安全框架
- 分组：教程目录
这篇博客所述主要是在读《**Spring Security 实战**》途中所做的笔记（之前有学Spring Security，但了解的比较浅，所以想着看这本书深入一点点，这都是因为上次一个bug调了我几天）

## 一、整体架构

在SpringSecurity 的架构设计中，认证（Authentication）和授权（Authorization）是分开的，无论使用什么样的认证方式，都不会影响授权，这是两个独立的存在，这种独立带来的好处之一，就是可以非常方便地整合一些外部的解决方案。下图是认证和授权所用到的核心接口（下面会分别进行解释）：

### 认证（Authentication）

通俗地说，认证就是身份认证（你是谁？）

#### AuthenticationManager

在SpringSecurity中认证是由 `AuthenticationManager` 接口来负责的，接口定义为：

```java
public interface AuthenticationManager {
    Authentication authenticate(Authentication authentication) throws AuthenticationException;
}
```

- 返回 Authentication 表示认证成功；
- 返回 AuthenticationException 异常，表示认证失败。

AuthenticationManager 主要实现类为 ProviderManager，在 ProviderManager 中管理了众多AuthenticationProvider 实例。在一次完整的认证流程中，SpringSecurity 允许存在多个AuthenticationProvider，用来实现多种认证方式，这些 AuthenticationProvider 都是由 `ProviderManager` 进行统一管理的。

#### Authentication

认证以及认证成功的信息主要是由 Authentication 的实现类进行保存的，Authentication 接口的结构如下：

- getAuthorities：获取用户权限信息；
- getCredentials：获取用户凭证信息，一般指密码；
- getDetails：获取用户详细信息；
- getPrincipal：获取用户身份信息，用户名、用户对象等；
- isAuthentiacted：用户是否认证成功

#### 登录后的数据保存（SecurityContextHolder）

SecurityContextHolder 用来获取登录之后的用户信息。SpringSecurity 会将登录用户数据保存在 Session 中。但是，为了使用方便，SpringSecurity 在此基础上做了一些改进，其中最主要的一个变化就是线性绑定。当用户登录成功后，SpringSecurity 会将登录成功的用户信息保存到 SecurityContextHolder 中。SecurityContextHolder 中的数据保存默认是通过 ThreadLocal 来实现的，使用 ThreadLocal 创建的变量只能被当前线程访问，不能被其他线程访问和修改，也就是用户数据和请求线程绑定在一起。

当登录请求处理完毕后，SpringSecurity 会将SecurityContextHolder 中的数据拿出来保存到session中，同时将 SecurityContextHolder 中的数据清空。以后每当有请求到来时，SpringSecurity 就会先从 Session 中取出用户登录数据，保存到 SecurityContextHolder 中，方便在该请求的后续处理过程中使用，同时在请求结束时将 SecurityContextHolder 中的数据拿出来保存到 Session 中，然后将Security 的 SecurityContextHolder 中的数据清空。这一策略非常方便用户在 Controller、Service 层以及任何代码中获取当前登录用户数据。

其实它就是为了方便我们拿用户信息数据，免得每次都得从 Session 会话中拿，从Session会话中拿，不好的地方就是要进行 SessionID 的判断，封装到SecurityContextHolder中就减少了判断这一步，直接获取即可。

### 授权（Authorization）

通俗点说，授权就是访问控制（你可以做什么？）

当完成认证后，接下来就是授权了。在SpringSecurity 的授权体系中，有两个关键的接口：

- AccessDecisionManager：访问决策管理器，用来决定此次访问是否被允许。

```java
public interface AccessDecisionManager {
   void decide(Authentication authentication, Object object, Collection<ConfigAttribute> configAttributes)
           throws AccessDeniedException, InsufficientAuthenticationException;
   boolean supports(ConfigAttribute attribute);
   boolean supports(Class<?> clazz);
}
```

- AccessDecisionVoter：访问决定投票器，投票器会检查用户是否具备应有的角色，进而投出赞成、反对或者弃权票。voter（选举人）

```java
public interface AccessDecisionVoter<S> {
   int ACCESS_GRANTED = 1;// granted:赞同
   int ACCESS_ABSTAIN = 0;// abstain:弃权
   int ACCESS_DENIED = -1;// denied:反对，否认
   boolean supports(ConfigAttribute attribute);
   boolean supports(Class<?> clazz);
   int vote(Authentication authentication, S object, Collection<ConfigAttribute> attributes);
}
```

AccessDecisionVoter 和 AccessDecisionManager 都有众多的实现类，在 AccessDecisionManager 中会挨个遍历 AccessDecisionVoter，进而决定是否允许用户访问，因而 AccessDecisionVoter 和 AccessDecisionManager 两者的关系类似于 AuthenticationProvider 和 ProviderManager 之间的关系。

#### ConfigAttribute

在AccessDecisionVoter 接口下的 vote 方法中，第三个参数是一个泛型参为ConfigAttribute 的Collection 集合对象。它你可以理解为是角色全称字符串的集合，内部就一个getAttribute方法。

```java
public interface ConfigAttribute extends Serializable {
	String getAttribute();
}
```

在Spring Security 中，用户请求一个资源（通常是一个网络接口或者一个Java方法）所需要的角色会被封装成一个 ConfigAttribute 对象，在 ConfigAttribute 中只有一个 getAttribute 方法，该方法返回一个 String 字符串，就是角色的名称，角色名称都带有一个 ROLE_ 前缀，投票器 AccessDecisionVoter 所做的事情，其实就是比较用户所具备的角色和请求某个资源所需的 ConfigAttribute 之间的关系。

## 二、总结

了解Spring Security 的整体架构，主要是为了后续了解其内部原理做准备。Spring Security 作为一个安全框架，其主要就是认证和授权两大结构。

认证（Authentication）的用户信息是间接的保存在 `SecurityContextHolder`中，在认证管理（`AuthenticationManager`）中管理着多个认证执行器，由它们进行认证，认证的有关详情被封装在`Authenticatoin`中。

授权（Authorization）中权限名可通过`ConfigAttribute`通过`getAttribute`方法进行获取，通过`AccessDecisionManager`判断访问是否允许，而判断的依据是`AccessDecisionVoter`的投票`vote`方法的结果。
