# 16、MyBatis - 多对一的处理
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/1/16.html
- 分类：ORM框架
- 分组：教程目录
现在我们就开始更加深入的学习了，今天我们要学习的是多对一的处理。

在正式开始之前我们需要做一些准备工作。

## 一、在数据库建立两张新的表并插入数据

```java
CREATE TABLE teacher (
  id INT(10) NOT NULL,
  name VARCHAR(30) DEFAULT NULL,
  PRIMARY KEY(id)
) ENGINE=INNODB DEFAULT CHARSET=utf8
INSERT INTO teacher(id, name) VALUES (1, '刘老师');
CREATE TABLE student (
  id INT(10) NOT NULL,
  name VARCHAR(30) DEFAULT NULL,
  tid INT(10) DEFAULT NULL,
  PRIMARY KEY (id),
  KEY fktid (tid),
  CONSTRAINT fktid FOREIGN KEY (tid) REFERENCES teacher (id)
)ENGINE=INNODB DEFAULT CHARSET=utf8
INSERT INTO student (id,name,tid) VALUES (1,'小赵','1');
INSERT INTO student (id,name,tid) VALUES (2,'小钱','1');
INSERT INTO student (id,name,tid) VALUES (3,'小孙','1');
INSERT INTO student (id,name,tid) VALUES (4,'小李','1');
INSERT INTO student (id,name,tid) VALUES (5,'小周','1');
```

上述SQL语句建立了一个teacher表，一个student表，student表的tid与teacher表的id相关联。

## 二、建立一个新的项目

我们建立一个全新的子项目

**1、** 建立MyBatis的核心配置文件mybatis-config.xml；

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE configuration
        PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-config.dtd">
<configuration>
    <properties resource="db.properties" />
    <settings>
        <setting name="logImpl" value="STDOUT_LOGGING"/>
    </settings>
    <typeAliases>
        <package name="com.jms.pojo"/>
    </typeAliases>
    <environments default="development">
        <environment id="development">
            <transactionManager type="JDBC"/>
            <dataSource type="POOLED">
                <property name="driver" value="${driver}"/>
                <property name="url" value="${url}"/>
                <property name="username" value="${username}"/>
                <property name="password" value="${password}"/>
            </dataSource>
        </environment>
    </environments>
</configuration>
```

**2、** 建立db.properties；

```java
driver=com.mysql.jdbc.Driver
url=jdbc:mysql://localhost:3306/MyBaties?useSSL=true&useUnicode=true&characterEncoding=UTF-8
username=root
password=123456
```

**3、** 建立MyBatisUtil工具类；

```java
package com.jms.utils;
import org.apache.ibatis.io.Resources;
import org.apache.ibatis.session.SqlSession;
import org.apache.ibatis.session.SqlSessionFactory;
import org.apache.ibatis.session.SqlSessionFactoryBuilder;
import java.io.IOException;
import java.io.InputStream;
//SqlSessionFactory-->SqlSession
public class MyBatisUtil {
    private static SqlSessionFactory sqlSessionFactory;
    //获取SqlSessionFactory对象
    static {
        try {
            String resource = "mybatis-config.xml";
            InputStream inputStream = Resources.getResourceAsStream(resource);
            sqlSessionFactory = new SqlSessionFactoryBuilder().build(inputStream);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
    //通过SqlSessionFactory获取SqlSession对象，其中包含了面向数据库执行执行SQL命令所需要的方法
    public static SqlSession getSqlSession() {
        return sqlSessionFactory.openSession(true);
    }
}
```

**4、** 建立实体类；

Student

```java
package com.jms.pojo;
public class Student {
    private int id;
    private String name;
    private Teacher teacher;
    public Student() {
    }
    public Student(int id, String name, Teacher teacher) {
        this.id = id;
        this.name = name;
        this.teacher = teacher;
    }
    public int getId() {
        return id;
    }
    public void setId(int id) {
        this.id = id;
    }
    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }
    public Teacher getTeacher() {
        return teacher;
    }
    public void setTeacher(Teacher teacher) {
        this.teacher = teacher;
    }
    @Override
    public String toString() {
        return "Student{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", teacher=" + teacher +
                '}';
    }
}
```

Teacher

```java
package com.jms.pojo;
public class Teacher {
    private int id;
    private String name;
    public Teacher(int id, String name) {
        this.id = id;
        this.name = name;
    }
    public Teacher() {
    }
    public int getId() {
        return id;
    }
    public void setId(int id) {
        this.id = id;
    }
    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }
    @Override
    public String toString() {
        return "Teacher{" +
                "id=" + id +
                ", name='" + name + '\'' +
                '}';
    }
}
```

**5、** 建立Mapper接口；

StudentMapper

TeacherMapper

**6、** 建立Mapper.xml配置文件；

StudentMapper.xml

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.jms.dao.StudentMapper">
</mapper>
```

TeacherMapper.xml

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.jms.dao.TeacherMapper">
</mapper>
```

**6、** 在核心配置文件mybatis-config.xml中建立映射；

```xml
<mappers>
    <mapper resource="com/jms/dao/TeacherMapper.xml"/>
    <mapper resource="com/jms/dao/StudentMapper.xml"/>
</mappers>
```

**7、** 测试；

1、在接口中写一个方法

```java
package com.jms.dao;
import com.jms.pojo.Teacher;
import org.apache.ibatis.annotations.Select;
import java.util.List;
public interface TeacherMapper {
    List<Teacher> getTeacherList();
}
```

2、在Mapper.xml文件中实现

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<!-- 命名空间namespace对应Mapper接口 -->
<mapper namespace="com.jms.dao.TeacherMapper">
    <select id="getTeacherList" resultType="teacher">
        select * from mybaties.teacher
    </select>
</mapper>
```

3、junit测试

```java
import com.jms.dao.TeacherMapper;
import com.jms.pojo.Teacher;
import com.jms.utils.MyBatisUtil;
import org.apache.ibatis.session.SqlSession;
import org.junit.Test;
import java.util.List;
public class MapperTest {
    @Test
    public void test() {
        SqlSession sqlSession = MyBatisUtil.getSqlSession();
        TeacherMapper teacherMapper = sqlSession.getMapper(TeacherMapper.class);
        List<Teacher> teacherList = teacherMapper.getTeacherList();
        for (Teacher teacher : teacherList) {
            System.out.println(teacher);
        }
　　　　　sqlSession.close();
    }
}
```

测试结果没有问题。

至此，我们的数据库和项目都搭建完成。

接下来就进行多对一处理的实现。

## 三、多对一处理的实现

首先我们要清楚我们要做什么？

我们要查询所有的student信息。查询所有student信息不是很简单吗？一般来说确实很简答，但是我们Student类中有一个属性是Teacher对象。Teacher对象还有着自己的id和name。所以我们要查的是student表中的id和name，以及它们的tid所对应的teacher表中的id和name。

我们先利用SQL来查询看看。

```java
select s.id,s.name,t.id,t.name
from student as s,teacher as t
where s.tid = t.id
```

上表即我们想要得到的结构。

那么在MyBatis中我们如何去实现呢？

我们有两种方法。

**1、** 按照结果嵌套处理；

顾名思义，就是先通过查询得到结果，把结果中的四个列对应给Student类的三个属性，最后两列对应给Teacher对象的两个属性。

由于student表和teacher中的id字段和name字段名字相同，所以我们在MyBatis中查询的时候应该给它起别名（不同的话就没有必要了）。

1、在StudentMapper接口中声明方法

```java
package com.jms.dao;
import com.jms.pojo.Student;
import java.util.List;
public interface StudentMapper {
    List<Student> getStudentList();
}
```

2、在StudentMapper.xml中实现接口中的方法

```xml
<!--按照结果嵌套处理-->
<resultMap id="StudentAndTeacher" type="Student">
    <result property="id" column="sid"/>
    <result property="name" column="sname"/>
    <!--复杂的属性要单独处理-->
    <association property="teacher" javaType="Teacher">
        <result property="id" column="tid"/>
        <result property="name" column="tname"/>
    </association>
</resultMap>
<select id="getStudentList" resultMap="StudentAndTeacher">
    select s.id as sid,s.name as sname,t.id as tid,t.name as tname
    from mybaties.student as s,mybaties.teacher as t
    where s.tid = t.id
</select>
```

我们看上面的配置，还是常规的select语句和结果映射，唯一有变化的就是结果映射中多了一个对于复杂属性的处理。

官方文档中是这样说明的：

**association – 一个复杂类型的关联；许多结果将包装成这种类型**

**嵌套结果映射 – 关联可以是 resultMap 元素，或是对其它结果映射的引用**

**javaType 一个 Java 类的全限定名，或一个类型别名（关于内置的类型别名，可以参考上面的表格）。 如果你映射到一个 JavaBean，MyBatis 通常可以推断类型。然而，如果你映射到的是 HashMap，那么你应该明确地指定 javaType 来保证行为与期望的相一致。**

3、junit测试

```java
import com.jms.dao.StudentMapper;
import com.jms.dao.TeacherMapper;
import com.jms.pojo.Student;
import com.jms.pojo.Teacher;
import com.jms.utils.MyBatisUtil;
import org.apache.ibatis.session.SqlSession;
import org.junit.Test;
import java.util.List;
public class MapperTest {
    @Test
    public void getStudents() {
        SqlSession sqlSession = MyBatisUtil.getSqlSession();
        StudentMapper studentMapper = sqlSession.getMapper(StudentMapper.class);
        List<Student> studentList = studentMapper.getStudentList();
        for (Student student : studentList) {
            System.out.println(student);
        }
　　　　　sqlSession.close();
    }
}
```

测试结果如下：

成功得到了想要的结果。

**2、** 按照查询进行嵌套处理；

顾名思义，就是查询中嵌套着查询。这个我们要实现，很明显我们需要先对student表进行查询，将结果中的tid作为第二个查询的条件来查询teacher表。

1、在StudentMapper接口声明方法

```java
List<Student> getStudentList2();
```

2、在StudentMapper.xml中实现接口中的方法

```xml
<resultMap id="StudentAndTeacher2" type="Student">
    <!--此处的id和name的映射是可以省略的，写出来只是为了方便理解-->
    <result property="id" column="id"/>
    <result property="name" column="name"/>
    <association property="teacher" column="tid" javaType="Teacher" select="getTeacher"/>
</resultMap>
<select id="getStudentList2" resultMap="StudentAndTeacher2">
    select * from mybaties.student
</select>
<select id="getTeacher" resultType="Teacher">
    select * from mybaties.teacher where id=#{tid}
</select>
```

上面的id和name在隐性映射中已经存在，可以不写这两句，写出来是为了方便理解。

这种方法相比第一种可能难理解一些，但也不是很难。将tid列与teacher属性进行对应，然后嵌套一个查询，这个查询返回的是一个Teacher类型，刚好把查询结果返给对应的teacher属性。

这里令我感到意外的是select的id，竟然还能作为被引用的对象，于是我看了一下官方文档的内容：

Select 元素的属性

属性
描述

id

在命名空间中唯一的标识符，可以被用来引用这条语句。

select的id在命名空间的标识符就是说去接口中找方法名，同样说到可以被引用，嗯，学习了。

3、junit测试

同样得到了结果。
