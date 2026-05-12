# 10、Spring Boot - 中整合 MyBatis- 9300字匠心出品
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/4/10.html
- 分类：J2EE框架
- 分组：教程目录
## 1.搭建项目环境

### 1.创建项目

详细创建步骤可以参考博文：[传送门！！！](/zhuanlan/j2ee/springboot/4/2.html)

### 2.修改 POM 文件，添加相关依赖

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.2.0.RELEASE</version>
        <relativePath/> <!-- lookup parent from repository -->
    </parent>
    <groupId>com.bjsxt</groupId>
    <artifactId>springbootmybatis</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>springbootmybatis</name>
    <description>Demo project for Spring Boot</description>
    <properties>
        <java.version>1.8</java.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-thymeleaf</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <!--Mybatis启动器-->
        <dependency>
            <groupId>org.mybatis.spring.boot</groupId>
            <artifactId>mybatis-spring-boot-starter</artifactId>
            <version>2.1.1</version>
        </dependency>
        <!--数据库驱动坐标-->
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <version>5.1.38</version>
        </dependency>
        <!--Druid数据源依赖-->
        <dependency>
            <groupId>com.alibaba</groupId>
            <artifactId>druid</artifactId>
            <version>1.1.12</version>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
            <exclusions>
                <exclusion>
                    <groupId>org.junit.vintage</groupId>
                    <artifactId>junit-vintage-engine</artifactId>
                </exclusion>
            </exclusions>
        </dependency>
        <dependency>
            <groupId>com.bjsxt</groupId>
            <artifactId>springbootjdbc</artifactId>
            <version>0.0.1-SNAPSHOT</version>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
            <!--配置Generator插件-->
            <plugin>
                <groupId>org.mybatis.generator</groupId>
                <artifactId>mybatis-generator-maven-plugin</artifactId>
                <version>1.3.5</version>
                <dependencies>
                    <dependency>
                        <groupId>mysql</groupId>
                        <artifactId>mysql-connector-java</artifactId>
                        <version>5.1.38</version>
                    </dependency>
                </dependencies>
                <!--指定配置文件的路径-->
                <configuration>
                    <configurationFile>${project.basedir}/src/main/resources/generatorConfig.xml</configurationFile>
                    <verbose>true</verbose>
                    <overwrite>true</overwrite>
                </configuration>
            </plugin>
        </plugins>
        <!--配置资源拷贝插件-->
        <resources>
            <resource>
                <directory>src/main/java</directory>
                <includes>
                    <include>**/*.xml</include>
                </includes>
            </resource>
            <resource>
                <directory>src/main/resources</directory>
                <includes>
                    <include>**/*.yml</include>
                    <include>**/*.properties</include>
                </includes>
            </resource>
        </resources>
    </build>
</project>
```

### 3.配置数据源

```java
spring:
  datasource:
    driver-class-name: com.mysql.jdbc.Driver
    url: jdbc:mysql://localhost:3306/test?useUnicode=true&characterEncoding=utf-8&useSSL=false
    username: root
    password: root
    type: com.alibaba.druid.pool.DruidDataSource
```

## 2.配置 Maven 的 generator 插件

### 1.添加 generator 配置文件

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE generatorConfiguration
        PUBLIC "-//mybatis.org//DTD MyBatis Generator Configuration 1.0//EN"
        "http://mybatis.org/dtd/mybatis-generator-config_1_0.dtd">
<generatorConfiguration>
    <context id="testTables" targetRuntime="MyBatis3">
        <commentGenerator>
            <!-- 是否去除自动生成的注释 true：是 ： false:否 -->
            <property name="suppressAllComments" value="true"/>
        </commentGenerator>
        <!--数据库连接的信息：驱动类、连接地址、用户名、密码 -->
        <jdbcConnection driverClass="com.mysql.jdbc.Driver"
                        connectionURL="jdbc:mysql://localhost:3306/test" userId="root"
                        password="root">
        </jdbcConnection>
        <!-- 默认false，把JDBC DECIMAL 和 NUMERIC 类型解析为 Integer，为 true时把JDBC DECIMAL 和
            NUMERIC 类型解析为java.math.BigDecimal -->
        <javaTypeResolver>
            <property name="forceBigDecimals" value="false"/>
        </javaTypeResolver>
        <!-- targetProject:生成PO类的位置 -->
        <javaModelGenerator targetPackage="com.dqcgm.springbootmybatis.pojo"
                            targetProject=".\src\main\java">
            <!-- enableSubPackages:是否让schema作为包的后缀 -->
            <property name="enableSubPackages" value="false"/>
            <!-- 从数据库返回的值被清理前后的空格 -->
            <property name="trimStrings" value="true"/>
        </javaModelGenerator>
        <!-- targetProject:mapper映射文件生成的位置 -->
        <sqlMapGenerator targetPackage="com.dqcgm.springbootmybatis.mapper"
                         targetProject=".\src\main\java">
            <!-- enableSubPackages:是否让schema作为包的后缀 -->
            <property name="enableSubPackages" value="false"/>
        </sqlMapGenerator>
        <!-- targetPackage：mapper接口生成的位置 -->
        <javaClientGenerator type="XMLMAPPER"
                             targetPackage="com.dqcgm.springbootmybatis.mapper"
                             targetProject=".\src\main\java">
            <!-- enableSubPackages:是否让schema作为包的后缀 -->
            <property name="enableSubPackages" value="false"/>
        </javaClientGenerator>
        <!-- 指定数据库表 -->
        <table schema="" tableName="users"></table>
    </context>
</generatorConfiguration>
```

### 2.添加 generator 配置文件的 DTD 文件

### 3.运行 generator 插件生成代码

## 3.配置资源拷贝插件

### 1.修改启动类添加@MapperScan 注解

```java
@SpringBootApplication
@MapperScan("com.dqcgm.springbootmybatis.mapper")//指定扫描接口与映射配置文件的包名
public class SpringbootmybatisApplication {
    public static void main(String[] args) {
        SpringApplication.run(SpringbootmybatisApplication.class, args);
    }
}
```

## 4.MyBatis 的其他配置项

```java
mybatis: 
#扫描 classpath 中 mapper 目录下的映射配置文件，针对于映射配置文件放 到了 resources 目录下 
mapper-locations: classpath:/mapper/*.xml 
#定义包别名，使用 pojo 时可以直接使用 pojo 的类型名称不用加包名 
type-aliases-package: com.dqcgm.springbootmybatis.pojo
```

## 5.添加用户功能

### 1.创建页面

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

### 2.创建 Controller

#### 1.PageController

```java
@Controller
public class PageController {
    /**
     * 页面跳转方法
     */
    @RequestMapping("/{page}")
    public String showPage(@PathVariable String page) {
        return page;
    }
}
```

#### 2.UsersController

```java
@Controller
@RequestMapping("/user")
public class UsersController {
    @Autowired
    private UsersService usersService;
    /**
     * 添加用户
     */
    @PostMapping("/addUser")
    public String addUsers(Users users) {
        try {
            this.usersService.addUsers(users);
        } catch (Exception e) {
            e.printStackTrace();
            return "error";
        }
        return "redirect:/ok";
    }
}
```

### 3.创建 Service

```java
@Service
public class UsersServiceImpl implements UsersService {
    @Autowired
    private UsersMapper usersMapper;
    /**
     * 添加用户
     *
     * @param users
     */
    @Override
    @Transactional
    public void addUsers(Users users) {
        this.usersMapper.insert(users);
    }
}
```

## 6.查询用户功能

### 1.修改 UsersController

```java
@GetMapping("/findUserAll")
    public String findUserAll(Model model) {
        try {
            List<Users> list = this.usersService.findUserAll();
            model.addAttribute("list", list);
        } catch (Exception e) {
            e.printStackTrace();
            return "error";
        }
        return "showUsers";
    }
```

### 2.修改业务层

```java
 @Override
    public List<Users> findUserAll() {
        UsersExample example = new UsersExample();
        return this.usersMapper.selectByExample(example);
    }
```

### 3.创建页面显示查询结果

```xml
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"
        "http://www.w3.org/TR/html4/loose.dtd">
<html xmlns:th="http://www.thymeleaf.org">
<link rel="shortcut icon" href="../resources/favicon.ico" th:href="@{/static/favicon.ico}"/>
<head>
    <title>地球村公民首页</title>
</head>
<body>
<table border="1" align="center">
    <tr>
        <th>用户ID</th>
        <th>用户姓名</th>
        <th>用户性别</th>
        <th>操作</th>
    </tr>
    <tr th:each="u : ${list}">
        <td th:text="${u.userid}"></td>
        <td th:text="${u.username}"></td>
        <td th:text="${u.usersex}"></td>
        <td>
            <a th:href="@{/user/preUpdateUser(id=${u.userid})}">修改</a>
            <a th:href="@{/user/deleteUser(id=${u.userid})}">删除</a>
        </td>
    </tr>
</table>
</body>
</html>
```

## 7.更新用户功能

### 1.预更新用户查询

#### 1.修改 UsersController

```java
@GetMapping("/preUpdateUser")
    public String preUpdateUser(Integer id, Model model) {
        try {
            Users user = this.usersService.preUpdateUsers(id);
            model.addAttribute("user", user);
        } catch (Exception e) {
            e.printStackTrace();
            return "error";
        }
        return "updateUser";
    }
```

#### 2.修改业务层

```java
 @Override
    public Users preUpdateUsers(Integer id) {
        return this.usersMapper.selectByPrimaryKey(id);
    }
```

#### 3.创建更新用户页面

```xml
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"
        "http://www.w3.org/TR/html4/loose.dtd">
<html xmlns:th="http://www.thymeleaf.org">
<link rel="shortcut icon" href="../resources/favicon.ico" th:href="@{/static/favicon.ico}"/>
<head>
    <title>地球村公民</title>
</head>
<body>
<form th:action="@{/user/updateUser}" method="post">
    <input type="hidden" name="userid" th:value="${user.userid}"/>
    <input type="text" name="username" th:value="${user.username}"><br/>
    <input type="text" name="usersex" th:value="${user.usersex}"><br/>
    <input type="submit" value="OK"/>
</form>
</body>
</html>
```

### 2.更新用户操作

#### 1.修改 UsersController

```java
@PostMapping("/updateUser")
    public String updateUser(Users users) {
        try {
            this.usersService.modifyUsers(users);
        } catch (Exception e) {
            e.printStackTrace();
            return "error";
        }
        return "redirect:/ok";
    }
```

#### 2.修改业务层

```java
 @Override
    @Transactional
    public void modifyUsers(Users users) {
        this.usersMapper.updateByPrimaryKey(users);
    }
```

## 8.删除用户功能

### 1.修改 UsersController

```java
@GetMapping("/deleteUser")
    public String deleteUser(Integer id) {
        try {
            this.usersService.dropUsersById(id);
        } catch (Exception e) {
            e.printStackTrace();
            return "error";
        }
        return "redirect:/ok";
    }
```

### 2.修改业务层

```java
@Override
    @Transactional
    public void dropUsersById(Integer id) {
        this.usersMapper.deleteByPrimaryKey(id);
    }
```
