# 03、Shiro 速成：SpringBoot+Shiro 第一个项目，实现认证和判断权限；加密及凭证匹配器
- 来源：https://ddkk.com/zhuanlan/security/shiro/5/12.html
- 分类：安全框架
- 分组：SpringBoot + Shiro 速成 (B)
Shiro是不依赖于容器的，所以建立一个普通的Maven项目就可以。

## 搭建maven项目框架

以上是刚创建的maven项目架构

以下导入shiro依赖

```xml
<dependencies>
    <dependency>
        <groupId>org.apache.shiro</groupId>
        <artifactId>shiro-core</artifactId>
        <version>1.4.2</version>
    </dependency>
    <dependency>
        <groupId>commons-logging</groupId>
        <artifactId>commons-logging</artifactId>
        <version>1.2</version>
    </dependency>
</dependencies>
```

导入依赖之后，我们要创建ini配置文件，以后就在这个配置文件里面写固定的数据，让shiro框架读取这个配置文件实现认证和授权。

**这个配置文件就相当于数据库**

以上写一个ini的配置文件，里面存储键值对，也就是用户名和密码，相当于数据库

## 第一个项目演示

现在开始写代码，实现将前段传过来的用户名和密码，和这个配置文件里面的用户名和密码进行对比，看是不是一样

```java
public class ShiroRun {
    public static void main(String[] args) {
   //1.获取SecurityManager的工厂对象
        IniSecurityManagerFactory factory = new IniSecurityManagerFactory("classpath:shiro.ini");
        //2.生产SecurityManager对象
        SecurityManager securityManager = factory.getInstance();
        //3.将生产的SecurityManager存储到SecurityUtils中，保证SecurityManager在
        // 一次请内的任意位置获取的是同一个SecurityManager对象，不同的请求获取的是不同的。
        SecurityUtils.setSecurityManager(securityManager);
        //4.获取subject对象完成认证
        Subject subject = SecurityUtils.getSubject();
        //5.创建认证信息对象，存储认证数据
        也就是前段传过来的用户名和密码保存在这个里面
//web项目时，用户名和密码是客户端表单传递过来的用户名和密码。
        AuthenticationToken token = new UsernamePasswordToken("zhangsan", "zs");
        try {
            //login()方法没有返回值，只能通过是否有异常判断是否登录成功。
login（） 这个方法自动会将token里面的用户名和密码和 
 ini配置文件里面的数据进行对比，看有没有前段传过来的数据
            subject.login(token);
            如果有，就执行下一句，没有就执行catch里面的数据
            System.out.println("登录成功");
        } catch (UnknownAccountException e) {
            System.out.println("账号不存在");
        } catch (IncorrectCredentialsException e) {
            System.out.println("密码错误");
        } catch (AuthenticationException e) {
            e.printStackTrace();
        }
    }
}
```

```java
public class ShiroRun {
    public static void main(String[] args) {
        //1.获取SecurityManager的工厂对象
        IniSecurityManagerFactory factory = new IniSecurityManagerFactory("classpath:shiro.ini");
        //2.生产SecurityManager对象
        SecurityManager securityManager = factory.getInstance();
        //3.将生产的SecurityManager存储到SecurityUtils中，保证SecurityManager在
        // 一次请内的任意位置获取的是同一个SecurityManager对象，不同的请求获取的是不同的。
        SecurityUtils.setSecurityManager(securityManager);
        //4.获取subject对象完成认证
        Subject subject = SecurityUtils.getSubject();
        //5.创建认证信息对象，存储认证数据
        AuthenticationToken token = new UsernamePasswordToken("zhangsan", "zs");
        //6.完成认证操作
        try{
//       subject这个对象里面就有ini   配置文件里面的所有的东西
            subject.login(token);
            System.out.println("登录成功");
            //7.角色的验证
                //单个角色验证
                boolean role1 = subject.hasRole("role1");//判断当前人认证的账户手否具备某个角色
                 //多个角色验证
                    //创建List集合存储要验证的角色名
                    ArrayList<String> list=new ArrayList();
                    list.add("role1");
                    list.add("role2");
                    //验证
                     boolean[] booleans = subject.hasRoles(list);
                    System.out.println(booleans[0]+""+booleans[1]);
            //8.权限的验证，如果不具备该权限则报错
                    subject.checkPermission("user:insert");//单个权限验证
                    boolean permitted = subject.isPermitted("user:insert");//返回true|false
            System.out.println(permitted);
        }catch (UnknownAccountException u){
            System.out.println("账户不正确");
        }catch (IncorrectCredentialsException i){
            System.out.println("凭证错误");
        }
        catch (Exception e){
            e.printStackTrace();
        }
    }
}
```

以上代码解释：

subject这个对象里面就有ini 配置文件里面的所有的东西，以后我们把想要认证的东西，作为参数传到这个subject对象里面的某些方法就可以实现功能。那么这个subject对象里面有什么方法呢？

### subject 对象

#### login（）方法

subject对象里面有一个login方法，这个login方法的参数是一个接口

这个接口的实现类是有一个

我们现在要实现登录，前段传过来用户名和密码，我们要把用户名和密码放到

UsernamePasswordToken这个实现类里面，然后将这个实现类作为参数传到login（）方法里面就可以实现认证登录

前段传过来的用户名和密码放到UsernamePasswordToken对象里面

```java
//5.创建认证信息对象，存储认证数据
AuthenticationToken token = new 
UsernamePasswordToken("zhangsan", "zs");
```

```java
//实现认证登录
subject.login(token);
```

#### hasRole（）方法

这个方法是判断 当前用户是否有一定的角色，参数是角色的名字，string类型的。

```java
//单个角色验证   //判断当前人认证的账户手否具备某个角色
boolean role1 = subject.hasRole("role1");
```

```java
//多个角色验证
//创建List集合存储要验证的角色名
ArrayList<String> list=new ArrayList();
list.add("role1");
list.add("role2");
//验证
boolean[] booleans = subject.hasRoles(list);
System.out.println(booleans[0]+""+booleans[1]);
```

#### checkPermission（）方法

通过是否出现AuthenticationException异常控制是否有指定权限。

```java
//权限的验证，如果不具备该权限则报错
subject.checkPermission("user:insert");//单个权限验证
```

#### isPermitted（）方法

```java
boolean permitted = subject.isPermitted("user:insert");
//返回true|false
```

## 加密及凭证匹配器

```java
在实际开发中数据库中一些敏感信息经常会被加密存储。如：用户密码等。
Shiro框架内嵌了很多加密算法。如MD5等。使用Shiro框架时可以
很方便的实现加密功能。
```

使用Shiro框架对前段传过来的密码进行加密，然后和数据库中的加密的密码进行比较。

```java
public class MD5Test {
    public static void main(String[] args) {
        String password = "jing";
//md5加密
        Md5Hash md5Hash = new Md5Hash(password);
        System.out.println(md5Hash);
//带盐的MD5加密。盐就是在原有字符串后面拼接盐形成新的字符串，然后加密。
        Md5Hash md5Hash2 = new Md5Hash(password, "010305");
        System.out.println(md5Hash2);
//无论是否加盐都可以很容易的被破解，可以多次迭代加密保证数据安全性。
//第三个参数表示迭代加密次数
        Md5Hash md5Hash3 = new Md5Hash(password, "010305", 2);
        System.out.println(md5Hash3);
//使用Md5的父类也也实现
        SimpleHash simpleHash = new SimpleHash("md5",password,"010305",2);
        System.out.println(simpleHash);
    }
}
```
