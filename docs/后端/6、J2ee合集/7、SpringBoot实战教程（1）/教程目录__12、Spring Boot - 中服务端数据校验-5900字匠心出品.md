# 12、Spring Boot - 中服务端数据校验-5900字匠心出品
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/4/12.html
- 分类：J2EE框架
- 分组：教程目录
## 1.Spring Boot 对实体对象的校验

### 1.搭建项目环境

#### 1.创建项目

#### 2.创建实体

```java
public class Users {
    private Integer userid;
    private String username;
    private String usersex;
    public Integer getUserid() {
        return userid;
    }
    public void setUserid(Integer userid) {
        this.userid = userid;
    }
    public String getUsername() {
        return username;
    }
    public void setUsername(String username) {
        this.username = username;
    }
    public String getUsersex() {
        return usersex;
    }
    public void setUsersex(String usersex) {
        this.usersex = usersex;
    }
    @Override
    public String toString() {
        return "Users{" +
                "userid=" + userid +
                ", username='" + username + '\'' +
                ", usersex='" + usersex + '\'' +
                '}';
    }
}
```

#### 3.创建 Controller

```java
@Controller 
@RequestMapping("/user") 
public class UsersController {
//添加用户 
@RequestMapping("/addUser") 
	public String addUser(Users users){
		System.out.println(users); 
		return "ok"; 
	} 
}
```

#### 4.创建页面

```xml
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"
        "http://www.w3.org/TR/html4/loose.dtd">
<html xmlns:th="http://www.thymeleaf.org">
<link rel="shortcut icon" href="../resources/favicon.ico" th:href="@{/static/favicon.ico}"/>
<head>
    <title>地球村公民首页</title>
</head>
<body>
<form th:action="@{/user/addUser}" method="post">
    <input type="text" name="username"><br/>
    <input type="text" name="usersex"><br/>
    <input type="submit" value="OK"/>
</form>
</body>
</html>
```

### 2.对实体对象做数据校验

#### 1.Spring Boot 数据校验的技术特点

- Spring Boot 中使用了 Hibernate-validator 校验框架

#### 2.对实体对象数据校验步骤

##### 1.修改实体类添加校验规则

```java
/**
 * @NotNull: 对基本数据类型的对象类型做非空校验
 * @NotBlank：对字符串类型做非空校验
 * @NotEmpty：对集合类型做非空校验
 */
public class Users {
    @NotNull
    private Integer userid;
    @NotBlank
    private String username;
    @NotBlank
    private String usersex;
    public Integer getUserid() {
        return userid;
    }
    public void setUserid(Integer userid) {
        this.userid = userid;
    }
    public String getUsername() {
        return username;
    }
    public void setUsername(String username) {
        this.username = username;
    }
    public String getUsersex() {
        return usersex;
    }
    public void setUsersex(String usersex) {
        this.usersex = usersex;
    }
    @Override
    public String toString() {
        return "Users{" +
                "userid=" + userid +
                ", username='" + username + '\'' +
                ", usersex='" + usersex + '\'' +
                '}';
    }
}
```

##### 2.在 Controller 中开启校验

```java
@RequestMapping("/addUser")
    public String addUser(@Validated Users users,BindingResult result){
        if(result.hasErrors()){
            return "addUser";
        }
        System.out.println(users);
        return "ok";
    }
```

##### 3.在页面中获取提示信息

```xml
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"
        "http://www.w3.org/TR/html4/loose.dtd">
<html xmlns:th="http://www.thymeleaf.org">
<link rel="shortcut icon" href="../resources/favicon.ico" th:href="@{/static/favicon.ico}"/>
<head>
    <title>地球村公民首页</title>
</head>
<body>
<form th:action="@{/user/addUser}" method="post">
    <input type="text" name="username"><font color="red"><span th:errors="${users.username}"/></font><br/>
    <input type="text" name="usersex"><font color="red"><span th:errors="${users.usersex}"/></font><br/>
    <input type="submit" value="OK"/>
</form>
</body>
</html>
```

#### 3.自定义错误提示信息

##### 1.在注解中定义提示信息

```java
@NotNull(message = "用户 ID 不能为空") 
private Integer userid; 
@NotBlank(message = "用户姓名不能为空") 
private String username; 
@NotBlank(message = "用户性别不能为空") 
private String usersex;
```

##### 2.在配置文件中定义提示信息

- 配置文件名必须是 ValidationMessages.properties

```java
userid.notnull=\u7528\u6237Id\u4e0d\u80fd\u4e3a\u7a7a-pro 
username.notnull=\u7528\u6237\u59d3\u540d\u4e0d\u80fd\u4e3a\u7a7a-pro
usersex.notnull=\u7528\u6237\u6027\u522b\u4e0d\u80fd\u4e3a\u7a7a-pro
```

#### 4.解决页面跳转异常

- 在跳转页面的方法中注入一个对象，要求参数对象的变量名必须是对象类型名称首字母小写格式。

```java
@Controller
public class PageController {
    /**
     * 跳转页面方法
     * 解决异常的方式：可以在跳转页面的方法中注入一个Users对象
     * 由于SprignMVC会将该对象放入到Model中传递，key的名称会使用该对象
     * 的驼峰命名规则来作为key
     */
    @RequestMapping("/{page}")
    public String showPage(@PathVariable String page, Users users){
        return page;
    }
}
```

#### 5.修改参数 key 的名称

```java
@Controller
public class PageController {
    /**
     * 跳转页面方法
     * 解决异常的方式：可以在跳转页面的方法中注入一个Users对象
     * 由于SprignMVC会将该对象放入到Model中传递，key的名称会使用该对象
     * 的驼峰命名规则来作为key
     */
    @RequestMapping("/{page}")
    public String showPage(@PathVariable String page, @ModelAttribute("aa") Users suibian) {
        return page;
    }
}
```

```java
    /**
     * 添加用户
     */
    @RequestMapping("/addUser")
    public String addUser(@ModelAttribute("aa") @Validated Users users, BindingResult result) {
        if (result.hasErrors()) {
            List<ObjectError> list = result.getAllErrors();
            for (ObjectError err : list) {
                FieldError fieldError = (FieldError) err;
                String fieldName = fieldError.getField();
                String msg = fieldError.getDefaultMessage();
                System.out.println(fieldName + "\t" + msg);
            }
            return "addUser";
        }
        System.out.println(users);
        return "ok";
    }
```

```xml
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"
        "http://www.w3.org/TR/html4/loose.dtd">
<html xmlns:th="http://www.thymeleaf.org">
<link rel="shortcut icon" href="../resources/favicon.ico" th:href="@{/static/favicon.ico}"/>
<head>
    <title>地球村公民首页</title>
</head>
<body>
<form th:action="@{/user/addUser}" method="post">
    <input type="text" name="username"><font color="red"><span th:errors="${aa.username}"/></font><br/>
    <input type="text" name="usersex"><font color="red"><span th:errors="${aa.usersex}"/></font><br/>
    <input type="submit" value="OK"/>
</form>
</body>
</html>
```

#### 6.其他校验规则

- @NotNull: 判断基本数据类型的对象类型是否为 null
- @NotBlank: 判断字符串是否为 null 或者是空串(去掉首尾空格)。
- @NotEmpty: 判断集合是否为空。
- @Length: 判断字符的长度(最大或者最小)
- @Min: 判断数值最小值
- @Max: 判断数值最大值
- @Email: 判断邮箱是否合法

## 2.Spring Boot 对 Controller 中其他参数的校验

### 1.对参数指定校验规则

```java
@PostMapping("/findUser") 
public String findUser(@NotBlank(message = "用户名不能为空") String username){
	System.out.println(username); 
	return "ok"; 
}
```

### 2.在 Controller 中开启校验

```java
@Controller 
@RequestMapping("/user") 
@Validated 
public class UsersController {
```

### 3.通过全局异常处理来跳转页面

```java
@Configuration
public class GlobalException implements HandlerExceptionResolver {
    @Override
    public ModelAndView resolveException(HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse, Object handler, Exception e) {
        ModelAndView mv = new ModelAndView();
        //判断不同异常类型，做不同视图的跳转
        if (e instanceof NullPointerException) {
            mv.setViewName("error5");
        }
        if (e instanceof ArithmeticException) {
            mv.setViewName("error6");
        }
        if (e instanceof ConstraintViolationException) {
            mv.setViewName("findUser");
        }
        mv.addObject("error", e.getMessage().split(":")[1]);
        return mv;
    }
}
```
