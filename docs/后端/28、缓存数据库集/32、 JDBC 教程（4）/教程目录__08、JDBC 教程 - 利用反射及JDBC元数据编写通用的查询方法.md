# 08、JDBC 教程 - 利用反射及JDBC元数据编写通用的查询方法
- 来源：https://ddkk.com/zhuanlan/db/jdbc/4/8.html
- 分类：缓存数据库
- 分组：教程目录
## JDBC基础

### 利用反射及JDBC元数据编写通用的查询方法

#### 为什么要用反射？

上一章，我们使用PreparedStatement执行查询数据库操作，但是却存在缺陷，我们这一期就解决这些问题

那么有哪些问题呢？

**1、** JDBCUtils的select()方法缺乏普适性，不再是通用的查询方法；

**2、** 如果将结果集ResultSet的放到调用层解析那么就存在耦合的现象，我们需要解耦；

**3、** 如果不解析，那么我们可能无法得到对象，而是一个结果集，我们需要面向对象；

结合上面的问题，提炼需要完成的任务要素：

**1、** 解耦合；

**2、** 通用的查询方法；

**3、** 面向对象；

**4、** 调用层无需过多解析；

那么我们开始吧~

### 一、数据库的准备

执行以下SQL，生成数据库和数据表并注入数据

```java
/*MySQL - 5.6.12 : Database - test*/
/*创建test数据库*/
CREATE DATABASE test;
/*使用test数据库*/
USE test;
/*创建student表*/
CREATE TABLE student (
  id int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  student_name varchar(10) COLLATE utf8_bin DEFAULT NULL COMMENT '学生姓名',
  student_sex varchar(10) COLLATE utf8_bin DEFAULT NULL COMMENT '学生性别',
  student_number int(11) DEFAULT NULL COMMENT '学生学号',
  school varchar(30) COLLATE utf8_bin DEFAULT NULL COMMENT '所属学校',
  PRIMARY KEY (id)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*向student表添加数据*/
insert  into student(id,student_name,student_sex,student_number,school) values (1,'浅夏','女',2147483647,'南方大学'),(2,'樟道','男',2147483647,'北方大学'),(3,'苏熙','女',2147483647,'东方大学');
/*创建user表*/
CREATE TABLE user (
  id int(11) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  name varchar(10) COLLATE utf8_bin NOT NULL COMMENT '姓名',
  password varchar(150) COLLATE utf8_bin DEFAULT NULL COMMENT '密码',
  age int(10) NOT NULL COMMENT '年龄',
  remark varchar(50) COLLATE utf8_bin DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (id)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*向user表添加数据*/
insert  into user(id,name,password,age,remark) values (1,'樟道','admin',21,'这是一个活泼的男孩'),(2,'浅夏','admin',19,'这是一个乐观的女孩'),(3,'苏熙','admin123',19,'这是一个可爱的美少女'),(4,'江芯','admin123',23,'这是一个丽江的姑娘');
```

student数据表的结构如下：

student数据表的内容如下：

user数据表的结构如下：

user数据表的内容如下：

### 二、Java项目

#### 实现步骤

**1、** 在编写SQL时，如果返回的数据表字段名和对象属性名不一致，采取字段名后加别名(属性名)的形式编写SQL，例如：`SELECTstudent_namestudentName,schoolFROM...`；

**2、** 先利用SQL进行查询，得到结果集(之前的查询部分还是没有问题的，只是对ResultSet结果集解析上的问题)；

**3、** 利用反射创建目标实体类的对象(过程中要保证通用代码中不能出现目标对象的实例代码)；

**4、** 获取结果集的列的别名：如SQL语句返回的字段名或别名(这里获取的优先别名)；

**5、** 再获取结果集的每一列的值，结合第4步得到一个Map，键：列的别名，值：列的值；例如：`studentName:浅夏`；

**6、** 再利用反射为第3步中目标对象对应的属性赋值，属性即为Map的键，值即为Map的值；

#### 项目结构

- pom.xml：本项目采用maven管理依赖
- database.properties：存放数据库连接信息
- PropertiesUtils：读取properties文件的工具类
- ReflectionUtils：反射类工具类(核心工具类)(已被替代)
- User：用户实体类
- Student：学生实体类
- JDBCUtils：JDBC的工具类(核心类)
- JdbcObjectService：业务层接口
- JdbcObjectServiceImpl：业务层接口实现类
- TestJdbc：测试类，测试工具类的功能效果

#### 1. pom.xml

```java
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.tqazy</groupId>
    <artifactId>T-jdbc-demo</artifactId>
    <version>1.0-SNAPSHOT</version>
    <properties>
        <java.version>1.8</java.version>
        <build.sourceEncoding>UTF-8</build.sourceEncoding>
        <mysql.version>5.1.26</mysql.version>
        <spring.version>5.2.0.RELEASE</spring.version>
    </properties>
    <dependencies>
        <!-- Spring start -->
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-core</artifactId>
            <version>${spring.version}</version>
        </dependency>
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-beans</artifactId>
            <version>${spring.version}</version>
        </dependency>
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-context</artifactId>
            <version>${spring.version}</version>
        </dependency>
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-jdbc</artifactId>
            <version>${spring.version}</version>
        </dependency>
        <!-- Spring end -->
        <!-- database start -->
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <version>${mysql.version}</version>
        </dependency>
        <!-- database end -->
        <!-- 测试 start -->
        <dependency>
            <groupId>junit</groupId>
            <artifactId>junit</artifactId>
            <version>4.12</version>
            <scope>test</scope>
        </dependency>
        <!-- 测试 end -->
        <dependency>
            <groupId>commons-beanutils</groupId>
            <artifactId>commons-beanutils</artifactId>
            <version>1.9.3</version>
        </dependency>
    </dependencies>
</project>
```

#### 2. database.properties数据库连接信息文件

```java
driver=com.mysql.jdbc.Driver
url=jdbc:mysql://localhost:3306/test?useUnicode=true&characterEncoding=UTF-8
username=root
password=admin123
```

#### 3. PropertiesUtils

前面几章多次讲解，这里就不赘述了

```java
package com.tqazy.utils;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;
/**
 * @author 散场前的温柔
 */
public class PropertiesUtils {
    /**
     * 传入properties文件地址和要读取的key值list集合，返回由key值和读取数据组成的map集合
     *
     * @param path
     * @param list
     * @return Map<key, value>
     */
    public static Map<String, String> readProperties(String path, List<String> list) {
        if (list == null || list.isEmpty() || path == null || path.isEmpty()) {
            return new HashMap<String, String>(0);
        }
        Map<String, String> map = new HashMap<String, String>(10);
        PropertiesUtils propertiesUtils = new PropertiesUtils();
        Properties properties = propertiesUtils.readProperties(path);
        if (properties == null) {
            return new HashMap<String, String>(0);
        }
        for (String str : list) {
            map.put(str, properties.getProperty(str));
        }
        return map;
    }
    /**
     * 根据地址读取Properties文件并生成实例
     *
     * @param path 文件地址
     * @return Properties
     * @throws IOException
     */
    private Properties readProperties(String path) {
        Properties properties = null;
        try {
            InputStream inputStream = getClass().getClassLoader().getResourceAsStream(path);
            InputStreamReader reader = new InputStreamReader(inputStream);
            // 此处需要使用JDK1.6以上的版本
            properties = new Properties();
            properties.load(reader);
        } catch (NullPointerException e) {
            // 读取文件异常
            e.printStackTrace();
            System.err.println("读取Properties文件异常，请检查文件路径和文件名:" + path);
        } catch (IOException e) {
            // 字符流写入异常
            e.printStackTrace();
            System.err.println("字符流写入Properties实例异常");
        }
        return properties;
    }
}
```

#### 4. ReflectionUtils

**在开始分析之前，声明此类的方法已经找到了其他替代法，即使用apache组织提供的commons-beanutils的jar包里的BeanUtils.setProperty()方法，效果和用法和本类的方法效果一致，本类作为研究继续保留于此**

这个比较难懂，这里我们先分析一下setFieldValueByParem()方法的参数：

**1、** 参数1：Objectobject这是被目标类反射的Object实例，例如：`Objectobject=User.class.newInstance();`我们将要用object来代替目标类，实现属性值被赋值的操作；

**2、** 参数2：需要被赋值的对象属性名；

**3、** 参数3：需要赋值给目标对象属性名的属性值；

这个类的主要作用就是调用setFieldValueByParem()将属性值赋值到object中的属性名对应的属性上，这时的object其实就是目标类的反射(你可以理解为套着Object外皮的目标类)。到时我们再将object强制转化回目标类就可以了

至于具体的功能实现，代码里的注释足够详细，想要看懂，需要了解Object类、Class类的方法，建议查询JavaEE的API规范。

```java
package com.tqazy.utils;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
/**
 * @author 散场前的温柔
 */
public abstract class ReflectionUtils {
    private final static String SET = "set";
    private final static String IS = "is";
    /**
     * 把属性和属性值赋值到反射后的Object中
     *
     * @param object    反射后的Object
     * @param columnLable   属性名
     * @param columnValue   属性值
     */
    public static void setFieldValueByParem(Object object, String columnLable, Object columnValue) throws Exception{
        // 将反射后的object取它的运行时类(即目标类)clazz
        Class clazz = object.getClass();
        // 把目标类的所有方法名取出形成数组methods
        Method[] methods = clazz.getDeclaredMethods();
        // 把目标类的所有属性名去除形成数组fields
        Field[] fields = clazz.getDeclaredFields();
        // 循环属性数组
        for (Field field : fields) {
            // 执行Field的getName()方法，取出属性名
            String fieldName = field.getName();
            // 指定Field的getType()方法，去取出类型的底层类简称
            String fieldType = field.getType().getSimpleName();
            // 如果类型是(boolean或Boolean)并且属性名以is开头的，属性名截去前两位。
            if (("boolean".equals(fieldType) || "Boolean".equals(fieldType)) && IS.equals(fieldName.substring(0, 2))) {
                fieldName = fieldName.substring(2);
            }
            // 如果解析出来的属性名和传入的属性名一直
            if (fieldName.equals(columnLable)) {
                // 生成属性名的set方法名
                String fieldSetName = parGetOrSetName(fieldName, SET);
                // 从目标类中获取需要的那个set方法
                Method fieldSetMet = clazz.getMethod(fieldSetName, field.getType());
                // 如果从方法名数组中找不到这个方法，那么就跳过
                if (!checkMethod(methods, fieldSetMet)) {
                    continue;
                }
                // 如果传入的属性值不为空
                if (columnValue != null) {
                    //通过找到的属性对应的set方法，把属性值赋值给object对象中，此时便完成了将属性值赋值给到反射后的object中
                    fieldSetMet.invoke(object, columnValue);
                }
            }
        }
    }
    /**
     * 生成属性名的set或get方法名
     *
     * @param fieldName 属性名
     * @param met "set" or "get"
     * @return
     */
    private static String parGetOrSetName(String fieldName, String met) {
        // 如果属性名为null或为空字符串，那么返回null
        if (null == fieldName || "".equals(fieldName)) {
            return null;
        }
        // 返回 方法名 = "set" + 属性名首字母大写 + 属性名除字母外的其他部分
        return met + fieldName.substring(0, 1).toUpperCase()
                + fieldName.substring(1);
    }
    /**
     * 判断类是否存在该方法
     *
     * @param methods
     * @param met
     * @return
     */
    private static boolean checkMethod(Method[] methods, Method met) {
        // 如果传入的方法为空，那么返回false
        if (met == null) {
            return false;
        }
        // 如果传入的方法再方法数组中找到，那么返回true
        for (Method method : methods) {
            if (met.equals(method)) {
                return true;
            }
        }
        return false;
    }
}
```

#### 5. User实体类

```java
package com.tqazy.entity;
/**
 * @author 散场前的温柔
 */
public class User {
    private Integer id;
    private String name;
    private String password;
    private Integer age;
    private String remark;
    public User() {}
    public User(String name, String password, Integer age, String remark) {
        this.name = name;
        this.password = password;
        this.age = age;
        this.remark = remark;
    }
    public Integer getId() {
        return id;
    }
    public void setId(Integer id) {
        this.id = id;
    }
    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }
    public String getPassword() {
        return password;
    }
    public void setPassword(String password) {
        this.password = password;
    }
    public Integer getAge() {
        return age;
    }
    public void setAge(Integer age) {
        this.age = age;
    }
    public String getRemark() {
        return remark;
    }
    public void setRemark(String remark) {
        this.remark = remark;
    }
    @Override
    public String toString() {
        return "User{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", password='" + password + '\'' +
                ", age=" + age +
                ", remark='" + remark + '\'' +
                '}';
    }
}
```

#### 6. Student实体类

```java
package com.tqazy.entity;
/**
 * @author 散场前的温柔
 */
public class Student {
    private Integer id;
    private String studentName;
    private String studentSex;
    private Integer studentNumber;
    private String school;
    public Student() {}
    public Student(String studentName, String studentSex, Integer studentNumber, String school) {
        this.studentName = studentName;
        this.studentSex = studentSex;
        this.studentNumber = studentNumber;
        this.school = school;
    }
    public Integer getId() {
        return id;
    }
    public void setId(Integer id) {
        this.id = id;
    }
    public String getStudentName() {
        return studentName;
    }
    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }
    public String getStudentSex() {
        return studentSex;
    }
    public void setStudentSex(String studentSex) {
        this.studentSex = studentSex;
    }
    public Integer getStudentNumber() {
        return studentNumber;
    }
    public void setStudentNumber(Integer studentNumber) {
        this.studentNumber = studentNumber;
    }
    public String getSchool() {
        return school;
    }
    public void setSchool(String school) {
        this.school = school;
    }
    @Override
    public String toString() {
        return "Student{" +
                "id=" + id +
                ", studentName='" + studentName + '\'' +
                ", studentSex='" + studentSex + '\'' +
                ", studentNumber=" + studentNumber +
                ", school='" + school + '\'' +
                '}';
    }
}
```

#### 7. JDBCUtils工具类

```java
package com.tqazy.jdbc;
import com.tqazy.utils.PropertiesUtils;
import com.tqazy.utils.ReflectionUtils;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
/**
 * @author 散场前的温柔
 */
public class JDBCUtils {
    private static Connection con;
    private static PreparedStatement ps;
    private static ResultSet rs;
    private static Map<String, String> map;
    /**
     * 获取数据库连接信息
     */
    private static void getProperties(String path) {
        List<String> list = new ArrayList<String>();
        list.add("driver");
        list.add("url");
        list.add("username");
        list.add("password");
        map = PropertiesUtils.readProperties(path, list);
    }
    /**
     * 获取数据库连接
     */
    public static void getConnection(String path) {
        try {
            if (map == null) {
                getProperties(path);
            }
            Class.forName(map.get("driver"));
            con = DriverManager.getConnection(map.get("url"), map.get("username"), map.get("password"));
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
    public static List<Object> select(String path, String sql, Class clazz, Object ... args){
        getConnection(path);
        // 如果创建连接失败，返回null
        if(con == null){
            System.out.println("创建数据库连接失败");
            return null;
        }
        List<Object> list = new ArrayList<Object>();
        try{
            ps = con.prepareStatement(sql);
            for(int i=0;i<args.length;i++){
                ps.setObject(i+1, args[i]);
            }
            rs = ps.executeQuery();
            // 本章内容这里开始
            while(rs.next()){
                // 1. 利用反射创建对象
                Object obj = clazz.newInstance();
                // 2. 通过解析SQL语句来判断到底选择了哪些列，以及需要为obj对象的哪些属性赋值
                /** 2.1. 通过先获取ResultSet结果集的元数据对象ResultSetMetaData。
                (关于ResultSetMetaData类在第10章《JDBC元数据》有讲解)
                    ResultSetMetaData可以获取结果集里的各种元素，比如：
                      getColumnLabel()方法可以获取指定列的别名；
                      getColumnCount()方法可以获取ResultSet对象中的列数 */
                ResultSetMetaData rsmd = rs.getMetaData();
                // 2.2 获取结果集的总数量并循环
                for(int i=0;i<rsmd.getColumnCount();i++) {
                    // 获取指定列的结果的别名
                    String columnLabel = rsmd.getColumnLabel(i+1);
                    // 通过指定列的别名从结果集里获取结果值
                    Object columnValue = rs.getObject(columnLabel);
                    // 将列名和结果值赋值到object对象里
                    // 这里注释掉的是调用ReflectionUtils工具类的方法，因为这个方法的作用和Beanutils.setProperty()方法的用法和效果相同。
                    // 所以此处使用BeanUtils.setProperty()之后，第4个文件ReflectionUtils类就可以不用写了
                    // ReflectionUtils.setFieldValueByParem(obj, columnLabel, columnValue);
                    BeanUtils.setProperty(obj, columnLabel, columnValue);
                }
                // 将object放入集合里
                list.add(obj);
            }
        } catch (Exception e){
            e.printStackTrace();
        } finally {
            // 关闭数据库连接
            close();
        }
        return list;
    }
    /**
     * 关闭数据库相关连接，释放数据库资源
     */
    public static void close() {
        if (rs != null) {
            try {
                rs.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
        if (ps != null) {
            try {
                ps.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
        if (con != null) {
            try {
                con.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
    }
}
```

#### 8. JdbcObjectService接口

```java
package com.tqazy.service;
import com.tqazy.entity.Student;
import com.tqazy.entity.User;
import java.util.List;
/**
 * @author 散场前的温柔
 */
public interface TJdbcDemoService {
    /**
     * 查询用户列表
     * @param name
     * @return
     */
    List<User> selectUserList(String name);
    /**
     * 查询学生列表
     * @param name
     * @return
     */
    List<Student> selectStudentList(String name);
}
```

#### 9. TJdbcDemoServiceImpl

```java
package com.tqazy.service.impl;
import com.tqazy.entity.Student;
import com.tqazy.entity.User;
import com.tqazy.jdbc.JDBCUtils;
import com.tqazy.service.TJdbcDemoService;
import java.util.List;
/**
 * @author 散场前的温柔
 */
public class TJdbcDemoServiceImpl implements TJdbcDemoService {
    public List<User> selectUserList(String name) {
        // 写SQL语句时，如果数据库字段名和对象属性名一致，则直接使用即可
        String sql = "SELECT name, password, age, remark FROM user WHERE name = ?";
        List<Object> list = JDBCUtils.select("database.properties", sql, User.class, name);
        // 将返回的集合中的Object强转为目标类
        List<User> userList = (List<User>)(List)list;
        return userList;
    }
    public List<Student> selectStudentList(String name) {
        // 写SQL语句时，如果数据库字段名和对象属性名不一致，那么需要在查询出的不一致的字段后面写上别名(此处别名就是对象属性名)，例如： student_name studentName
        String sql = "SELECT student_name studentName, student_sex studentSex, student_number studentNumber, school FROM student WHERE student_name = ?";
        List<Object> list = JDBCUtils.select("database.properties", sql, Student.class, name);
        List<Student> studentList = (List<Student>)(List)list;
        return studentList;
    }
}
```

#### 10. TestJdbc测试类

我们这里调用两个表对应两个对象，使用同一个JDBCUtils工具类里select()方法，为了验证通用性

```java
package com.tqazy.test;
import com.tqazy.entity.Student;
import com.tqazy.entity.User;
import com.tqazy.service.TJdbcDemoService;
import com.tqazy.service.impl.TJdbcDemoServiceImpl;
import org.junit.Test;
import java.util.List;
/**
 * @author 散场前的温柔
 */
public class TestJdbc {
    @Test
    public void testJdbc(){
        TJdbcDemoService service = new TJdbcDemoServiceImpl();
        List<User> list = service.selectUserList("苏熙");
        if (list == null) {
            System.out.println("用户不存在");
        } else {
            for (User user : list) {
                System.out.println(user.toString());
            }
        }
        List<Student> list2 = service.selectStudentList("苏熙");
        if (list2 == null) {
            System.out.println("学生不存在");
        } else {
            for (Student student : list2) {
                System.out.println(student.toString());
            }
        }
    }
}
```

#### 运行结果

#### 分析

我们可以看到结果就是完成了我们预期的需求，其中解耦合，ServiceImpl调用JDBCUtils方法时，JDBCUtils类里没有其他的类的代码，且调用层无需解析JDBCUtils的代码，只需要强转一下即可，也完成了调用层无需过多解析的需求。

我们在代码里查询了两个表的数据，使用的时同一个select()的方法，所以此方法具备通用性；且返回的不在是原来的ResultSet结果集，而是返回的Object对象，又满足了面向对象的需求。

所以我们使用映射完成了通用的查询方法
