# 15、MyBatis速成 - 返回结果封装
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/9/15.html
- 分类：ORM框架
- 分组：教程目录
前面介绍的内容查询结果基本都是返回一个数据，然后将数据对应某一个对象。本篇探索一下多种不同类型的返回结果，mybatis是如何封装的。

## 1.返回list

创建Employee对象

```java
package org.mybatis.returntype;
import org.apache.ibatis.type.Alias;
@Alias("empp")
public class Employee {
    private Integer id;
    private String lastName;
    private String email;
    private String gender;
    public Integer getId() {
        return id;
    }
    public void setId(Integer id) {
        this.id = id;
    }
    public String getLastName() {
        return lastName;
    }
    public void setLastName(String lastName) {
        this.lastName = lastName;
    }
    public String getEmail() {
        return email;
    }
    public void setEmail(String email) {
        this.email = email;
    }
    public String getGender() {
        return gender;
    }
    public void setGender(String gender) {
        this.gender = gender;
    }
    @Override
    public String toString() {
        return "Employee [id=" + id + ", lastName=" + lastName + ", email=" + email
                + ", gender=" + gender + "]";
    }
}
```

创建接口类

```java
package org.mybatis.returntype;
import java.util.List;
public interface EmployeeMapper {
    public List<Employee> getEmpByLastName(String lastName);
}
```

创建映射配置文件，使用like查询返回一个list集合，list集合中存放Employee对象。返回值类型仍然使用对象，而不是list

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
  PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.mybatis.returntype.EmployeeMapper">
    <select id="getEmpByLastName" resultType="empp">
        select id,last_name,email,gender from mybatis_employee where last_name like{lastName}
    </select>
</mapper>
```

创建主配置文件

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE configuration
  PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-config.dtd">
<configuration>
    <properties resource="db.properties"></properties>
    <settings>
        <setting name="mapUnderscoreToCamelCase" value="true"/>
    </settings>
    <typeAliases>
        <!-- 为包下的所有类起别名，默认为类名大小写（不区分大小写） -->
        <package name="org.mybatis.returntype"/>
    </typeAliases>
    <!-- 默认development是开发环境，如果改成test则表示使用测试环境 -->
    <environments default="dev_mysql">
        <environment id="dev_mysql">
            <transactionManager type="JDBC" />
            <dataSource type="POOLED">
                <property name="driver" value="${mysql.driver}" />
                <property name="url" value="${mysql.url}" />
                <property name="username" value="${mysql.username}" />
                <property name="password" value="${mysql.password}" />
            </dataSource>
        </environment>
        <environment id="test_mysql">
            <transactionManager type="JDBC"></transactionManager>
            <dataSource type="POOLED">
                <property name="driver" value="${mysql.drivertest}" />
                <property name="url" value="${mysql.urltest}" />
                <property name="username" value="${mysql.usernametest}" />
                <property name="password" value="${mysql.passwordtest}" />
            </dataSource>
        </environment>
    </environments>
    <mappers>
        <mapper resource="mapper/returntypemapper.xml"/>
    </mappers>
</configuration>
```

创建测试类

```java
package org.mybatis.returntype;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import org.apache.ibatis.io.Resources;
import org.apache.ibatis.session.SqlSession;
import org.apache.ibatis.session.SqlSessionFactory;
import org.apache.ibatis.session.SqlSessionFactoryBuilder;
import org.junit.Test;
/**
 * 使用接口式編程
 */
public class MybatisTest {
    @Test
    public void testMybatis() {
        String resource = "mybatis-config-returntype.xml";//全局配置文件
        InputStream inputStream = null;
        SqlSessionFactory sqlSessionFactory = null;
        SqlSession sqlSession = null;
        try {
            inputStream = Resources.getResourceAsStream(resource);
            sqlSessionFactory = new SqlSessionFactoryBuilder().build(inputStream);
            sqlSession = sqlSessionFactory.openSession();
            EmployeeMapper mapper = sqlSession.getMapper(EmployeeMapper.class);
            List<Employee> emp = mapper.getEmpByLastName("%an%");
            System.out.println(emp);
            sqlSession.close();
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
        }
    }
}
```

返回结果如下：

> DEBUG - ooo Using Connection [com.mysql.jdbc.JDBC4Connection@e320068]
>
> DEBUG - ==> Preparing: select id,last_name,email,gender from mybatis_employee where last_name like ?
>
> DEBUG - ==> Parameters: %an%(String)
>
> [Employee [id=3, lastName=panpan, email=tang_greatman@sohu.com, gender=1], Employee [id=4, lastName=huanhuan, email=tang_greatman@sina.com, gender=2], Employee [id=5, lastName=huanhuan, email=tang_greatman@sina.com, gender=2], Employee [id=6, lastName=huanan, email=tang_man@sina.com, gender=2], Employee [id=7, lastName=hussanan, email=tang_@qq.com, gender=2], Employee [id=8, lastName=hussanan, email=tang_@qq.com, gender=2]]
>
> DEBUG - Resetting autocommit to true on JDBC Connection [com.mysql.jdbc.JDBC4Connection@e320068]
>
> DEBUG - Closing JDBC Connection [com.mysql.jdbc.JDBC4Connection@e320068]
>
> DEBUG - Returned connection 238157928 to pool.

结果返回为一个集合。

## 2.返回map

a）返回一条记录的map

创建接口方法

```java
public Map<String,Object> getEmpById(Integer id);
```

创建sql，这里map类型是一个Map的缩写

```xml
<select id="getEmpById" resultType="map">
        select * from mybatis_employee where id ={id}
    </select>
```

创建测试

```java
package org.mybatis.returntype;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Map;
import org.apache.ibatis.io.Resources;
import org.apache.ibatis.session.SqlSession;
import org.apache.ibatis.session.SqlSessionFactory;
import org.apache.ibatis.session.SqlSessionFactoryBuilder;
import org.junit.Test;
/**
 * 使用接口式編程
 */
public class MybatisTest {
    @Test
    public void testMybatis() {
        String resource = "mybatis-config-returntype.xml";//全局配置文件
        InputStream inputStream = null;
        SqlSessionFactory sqlSessionFactory = null;
        SqlSession sqlSession = null;
        try {
            inputStream = Resources.getResourceAsStream(resource);
            sqlSessionFactory = new SqlSessionFactoryBuilder().build(inputStream);
            sqlSession = sqlSessionFactory.openSession();
            EmployeeMapper mapper = sqlSession.getMapper(EmployeeMapper.class);
//          List<Employee> emp = mapper.getEmpByLastName("%an%");
//          System.out.println(emp);
            Map<String, Object> empmap = mapper.getEmpById(2);
            System.out.println(empmap);
            sqlSession.close();
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
        }
    }
}
```

返回结果：

> DEBUG - ==> Preparing: select * from mybatis_employee where id = ?
>
> DEBUG - ==> Parameters: 2(Integer)
>
> {gender=2, last_name=lisi, id=2, email=tang_greatman@qq.com}
>
> DEBUG - Resetting autocommit to true on JDBC Connection [com.mysql.jdbc.JDBC4Connection@1f57539]
>
> DEBUG - Closing JDBC Connection [com.mysql.jdbc.JDBC4Connection@1f57539]
>
> DEBUG - Returned connection 32863545 to pool.

返回结果已经将对象封装为一个map对象。

b）返回多条记录封装到一个map中

创建接口方法

指定id作为map中的键，javabean作为值

```java
/**
 * @param lastName
 * @return 键是某个属性，值是javabean
 */
@MapKey("id")
public Map<Integer,Employee> getEmpByLastNameLike(String lastName);
```

创建sql语句，指定返回值类型为Employee对象

```xml
<select id="getEmpByLastNameLike" resultType="empp">
    select * from mybatis_employee where last_name like{lastName}
</select>
```

创建测试类

```java
package org.mybatis.returntype;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Map;
import org.apache.ibatis.io.Resources;
import org.apache.ibatis.session.SqlSession;
import org.apache.ibatis.session.SqlSessionFactory;
import org.apache.ibatis.session.SqlSessionFactoryBuilder;
import org.junit.Test;
/**
 * 使用接口式編程
 */
public class MybatisTest {
    @Test
    public void testMybatis() {
        String resource = "mybatis-config-returntype.xml";//全局配置文件
        InputStream inputStream = null;
        SqlSessionFactory sqlSessionFactory = null;
        SqlSession sqlSession = null;
        try {
            inputStream = Resources.getResourceAsStream(resource);
            sqlSessionFactory = new SqlSessionFactoryBuilder().build(inputStream);
            sqlSession = sqlSessionFactory.openSession();
            EmployeeMapper mapper = sqlSession.getMapper(EmployeeMapper.class);
//          List<Employee> emp = mapper.getEmpByLastName("%an%");
//          System.out.println(emp);
//          Map<String, Object> empmap = mapper.getEmpById(2);
//          System.out.println(empmap);
            Map<Integer, Employee> mapbean = mapper.getEmpByLastNameLike("%an%");
            System.out.println(mapbean);
            sqlSession.close();
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
        }
    }
}
```

返回结果：

> DEBUG - ==> Preparing: select * from mybatis_employee where last_name like ?
>
> DEBUG - ==> Parameters: %an%(String)
>
> {3=Employee [id=3, lastName=panpan, email=tang_greatman@sohu.com, gender=1],
>
> 4=Employee [id=4, lastName=huanhuan, email=tang_greatman@sina.com, gender=2],
>
> 5=Employee [id=5, lastName=huanhuan, email=tang_greatman@sina.com, gender=2],
>
> 7=Employee [id=7, lastName=hussanan, email=tang_@qq.com, gender=2], 8=Employee [id=8, lastName=hussanan, email=tang_@qq.com, gender=2]}
>
> DEBUG - Resetting autocommit to true on JDBC Connection [com.mysql.jdbc.JDBC4Connection@4493d195]
>
> DEBUG - Closing JDBC Connection [com.mysql.jdbc.JDBC4Connection@4493d195]
>
> DEBUG - Returned connection 1150538133 to pool.
>
> 返回结果键为数据记录id，值为Employee对象。

## 3.resultmap

上面两种返回，都是使用resulttype对查询的结果进行封装，且封装的都是单个对象。而实际的生产环境中有很多的关联查询，使用resulttype进行封装显然已经不能满足需求。mybatis提供了一种自定义封装方式resulmap，结合示例做一个介绍：

1）一个employee对应一个department

**创建Employee和Department：**

```java
package org.mybatis.resultmap;
/**
 * ALTER TABLE mybatis_employee ADD COLUMN dept_id INT(11) COMMENT '部门id';
 * ALTER TABLE mybatis_employee ADD CONSTRAINT mybatis_dept_emp FOREIGN KEY (dept_id) REFERENCES mybatis_department (id);
 */
public class Employee {
    private Integer id;
    private String lastName;
    private String email;
    private String gender;
    private Department department;
    public Integer getId() {
        return id;
    }
    public void setId(Integer id) {
        this.id = id;
    }
    public String getLastName() {
        return lastName;
    }
    public void setLastName(String lastName) {
        this.lastName = lastName;
    }
    public String getEmail() {
        return email;
    }
    public void setEmail(String email) {
        this.email = email;
    }
    public String getGender() {
        return gender;
    }
    public void setGender(String gender) {
        this.gender = gender;
    }
    public Department getDepartment() {
        return department;
    }
    public void setDepartment(Department department) {
        this.department = department;
    }
    @Override
    public String toString() {
        return "Employee [id=" + id + ", lastName=" + lastName + ", email="
                + email + ", gender=" + gender + ", department=" + department
                + "]";
    }
}
```

```java
package org.mybatis.resultmap;
public class Department {
    private Integer id;
    private String deptName;
    public Integer getId() {
        return id;
    }
    public void setId(Integer id) {
        this.id = id;
    }
    public String getDeptName() {
        return deptName;
    }
    public void setDeptName(String deptName) {
        this.deptName = deptName;
    }
    public String toString() {
        return "Department [id=" + id + ", deptName=" + deptName + "]";
    }
}
```

**创建接口：**

```java
package org.mybatis.resultmap;
public interface EmployeeMapper {
    public Employee getEmpById(Integer id);
}
```

**创建表和外键：**

```java
CREATE TABLE mybatis_employee (
  id int(11) NOT NULL AUTO_INCREMENT,
  last_name varchar(255) DEFAULT NULL,
  email varchar(255) DEFAULT NULL,
  gender varchar(255) DEFAULT NULL,
  dept_id int(11) DEFAULT NULL COMMENT '部门id',
  PRIMARY KEY (id)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8;
CREATE TABLE mybatis_department (
  id int(11) NOT NULL,
  deptName varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
--创建外键关联
ALTER TABLE mybatis_employee ADD CONSTRAINT mybatis_dept_emp FOREIGN KEY (dept_id) REFERENCES mybatis_department (id);
```

**创建映射配置文件：**

创建`` 标签，设置id=memp，返回值类型为Employee对象，将`` 查询结果通过resultMap标签和实际javabean属性一一对应。此时查询结果就会按照resultMap中设置的对应关系将查询结果设置到Employee对象中。有了这种自定义方式，之前的驼峰命名配置就可以去除掉。

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
  PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.mybatis.resultmap.EmployeeMapper">
    <!--这里department是按照属性传递进行书写-->
    <resultMap type="org.mybatis.resultmap.Employee" id="memp">
        <id column="id" property="id"/>
        <result column="last_name" property="lastName"/>
        <result column="email" property="email"/>
        <result column="gender" property="gender"/>
        <result column="did" property="department.id"/>
        <result column="deptName" property="department.deptName"/>
    </resultMap>
    <select id="getEmpById" resultMap="memp">
        select me.id,me.last_name,me.email,me.gender,me.dept_id d_id,md.id did,md.deptName from mybatis_employee me,mybatis_department md where me.dept_id = md.id and me.id ={id}
    </select>
</mapper>
```

也可以将resultMap通过association进行关联，代码如下：

```xml
<resultMap type="org.mybatis.resultmap.Employee" id="memp2">
        <id column="id" property="id"/>
        <result column="last_name" property="lastName"/>
        <result column="email" property="email"/>
        <result column="gender" property="gender"/>
        <association property="department" javaType="org.mybatis.resultmap.Department">
            <id column="did" property="id"/>
            <result column="deptName" property="deptName"/>
        </association>
    </resultMap>
```

**创建主配置文件：**

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE configuration
  PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-config.dtd">
<configuration>
    <properties resource="db.properties"></properties>
    <settings>
        <setting name="mapUnderscoreToCamelCase" value="true"/>
    </settings>
    <typeAliases>
        <!-- 为包下的所有类起别名，默认为类名大小写（不区分大小写） -->
        <package name="org.mybatis.resultmap"/>
    </typeAliases>
    <!-- 默认development是开发环境，如果改成test则表示使用测试环境 -->
    <environments default="dev_mysql">
        <environment id="dev_mysql">
            <transactionManager type="JDBC" />
            <dataSource type="POOLED">
                <property name="driver" value="${mysql.driver}" />
                <property name="url" value="${mysql.url}" />
                <property name="username" value="${mysql.username}" />
                <property name="password" value="${mysql.password}" />
            </dataSource>
        </environment>
        <environment id="test_mysql">
            <transactionManager type="JDBC"></transactionManager>
            <dataSource type="POOLED">
                <property name="driver" value="${mysql.drivertest}" />
                <property name="url" value="${mysql.urltest}" />
                <property name="username" value="${mysql.usernametest}" />
                <property name="password" value="${mysql.passwordtest}" />
            </dataSource>
        </environment>
    </environments> 
    <mappers>
        <mapper resource="mapper/resultmapmapper.xml"/>
    </mappers>
</configuration>
```

**创建测试类：**

```java
package org.mybatis.resultmap;
import java.io.IOException;
import java.io.InputStream;
import org.apache.ibatis.io.Resources;
import org.apache.ibatis.session.SqlSession;
import org.apache.ibatis.session.SqlSessionFactory;
import org.apache.ibatis.session.SqlSessionFactoryBuilder;
import org.junit.Test;
/**
 * 使用接口式編程
 */
public class MybatisTest {
    @Test
    public void testMybatis() {
        String resource = "mybatis-config-resultmap.xml";//全局配置文件
        InputStream inputStream = null;
        SqlSessionFactory sqlSessionFactory = null;
        SqlSession sqlSession = null;
        try {
            inputStream = Resources.getResourceAsStream(resource);
            sqlSessionFactory = new SqlSessionFactoryBuilder().build(inputStream);
            sqlSession = sqlSessionFactory.openSession();
            EmployeeMapper mapper = sqlSession.getMapper(EmployeeMapper.class);
            Employee emp = mapper.getEmpById(2);
            System.out.println(emp);
            sqlSession.close();
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
        }
    }
}
```

**执行结果：**

> DEBUG - ==> Preparing: select me.id,me.last_name,me.email,me.gender,me.dept_id d_id,md.id did,md.deptName from mybatis_employee me,mybatis_department md where me.dept_id = md.id and me.id = ?
>
> DEBUG - ==> Parameters: 2(Integer)
>
> Employee [id=2, lastName=lisi, email=tang_greatman@qq.com, gender=2, department=Department [id=2, deptName=测试部]]
>
> DEBUG - Resetting autocommit to true on JDBC Connection [com.mysql.jdbc.JDBC4Connection@6ee52dcd]
>
> DEBUG - Closing JDBC Connection [com.mysql.jdbc.JDBC4Connection@6ee52dcd]
>
> DEBUG - Returned connection 1860513229 to pool.

联合查询数据已经设置到javabean中。

2）一个department对应多个employee

上面介绍的是在一个employee中对应一个department对象，如果查询某一个id的employee，那么返回的结果是1。如果在department中存在一个employee集合，那么查询某一个id的department，返回的就是一个employee集合，结果又该如何处理呢？

Employee类，接口，配置文件，映射文件保持不变。Department做相关调整

**实体类变更为**

添加Employee集合

```java
package org.mybatis.resultmap;
import java.util.List;
public class Department {
    private Integer id;
    private String deptName;
    /**
     * 添加emp集合
     */
    private List<Employee> emps;
    public Integer getId() {
        return id;
    }
    public void setId(Integer id) {
        this.id = id;
    }
    public String getDeptName() {
        return deptName;
    }
    public void setDeptName(String deptName) {
        this.deptName = deptName;
    }
    public List<Employee> getEmps() {
        return emps;
    }
    public void setEmps(List<Employee> emps) {
        this.emps = emps;
    }
    public String toString() {
        return "Department [id=" + id + ", deptName=" + deptName + "]";
    }
}
```

**接口类变更为**

添加查询方法

```java
public Department getDeptWithEmpById(Integer id);
```

**映射文件变更为**

返回的Employee集合使用`` 标签进行接收，类型使用`ofType=""` 进行配置

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
  PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.mybatis.resultmap.DepartmentMapper">
    <select id="getDeptById" resultType="org.mybatis.resultmap.Department">
        select id,deptName from mybatis_department where id ={id}
    </select>
    <resultMap type="org.mybatis.resultmap.Department" id="mdept1">
        <id column="did" property="id"/>
        <result column="deptName" property="deptName"/>
        <!-- 一个department对应多个employee -->
        <collection property="emps" ofType="org.mybatis.resultmap.Employee">
            <id column="eid" property="id"/>
            <result column="last_name" property="lastName"/>
            <result column="email" property="email"/>
            <result column="gender" property="gender"/>
        </collection>
    </resultMap>
    <select id="getDeptWithEmpById" resultMap="mdept1">
        SELECT
            md.id did,
            md.deptName deptName,
            me.id eid,
            me.last_name last_name,
            me.email email,
            me.gender gender
        FROM
            mybatis_department md
        LEFT JOIN mybatis_employee me ON md.id = me.dept_id
        WHERE
            md.id ={id}
    </select>
</mapper>
```

**测试**

```java
package org.mybatis.resultmap;
import java.io.IOException;
import java.io.InputStream;
import org.apache.ibatis.io.Resources;
import org.apache.ibatis.session.SqlSession;
import org.apache.ibatis.session.SqlSessionFactory;
import org.apache.ibatis.session.SqlSessionFactoryBuilder;
import org.junit.Test;
/**
 * 使用接口式編程
 */
public class MybatisTest {
    @Test
    public void testMybatis() {
        String resource = "mybatis-config-resultmap.xml";//全局配置文件
        InputStream inputStream = null;
        SqlSessionFactory sqlSessionFactory = null;
        SqlSession sqlSession = null;
        try {
            inputStream = Resources.getResourceAsStream(resource);
            sqlSessionFactory = new SqlSessionFactoryBuilder().build(inputStream);
            sqlSession = sqlSessionFactory.openSession();
            DepartmentMapper mapper = sqlSession.getMapper(DepartmentMapper.class);
            Department dept1 = mapper.getDeptWithEmpById(2);
            System.out.println(dept1);
            System.out.println(dept1.getEmps());
            sqlSession.close();
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
        }
    }
}
```

**返回结果**

> DEBUG - ooo Using Connection [com.mysql.jdbc.JDBC4Connection@4cf4d528]
>
> DEBUG - ==> Preparing: SELECT md.id did, md.deptName deptName, me.id eid, me.last_name last_name, me.email email, me.gender gender FROM mybatis_department md LEFT JOIN mybatis_employee me ON md.id = me.dept_id WHERE md.id = ?
>
> DEBUG - ==> Parameters: 2(Integer)
>
> Department [id=2, deptName=测试部]
>
> [Employee [id=2, lastName=lisi, email=tang_greatman@qq.com, gender=2], Employee [id=5, lastName=huanhuan, email=tang_greatman@sina.com, gender=2], Employee [id=6, lastName=huanan, email=tang_man@sina.com, gender=2]]
>
> DEBUG - Resetting autocommit to true on JDBC Connection [com.mysql.jdbc.JDBC4Connection@4cf4d528]
>
> DEBUG - Closing JDBC Connection [com.mysql.jdbc.JDBC4Connection@4cf4d528]
>
> DEBUG - Returned connection 1291113768 to pool.

封装完毕
