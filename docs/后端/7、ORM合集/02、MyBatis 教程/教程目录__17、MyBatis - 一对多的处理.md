# 17、MyBatis - 一对多的处理
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/1/17.html
- 分类：ORM框架
- 分组：教程目录
上一篇我们学习了多对一的处理，这次我们来学习一对多的处理。

一对多的处理与多对一的处理差别不大，只是有一些细微的地方需要注意。

我们还是先做准备工作，其他部分与多对一的准备工作相同，仅实体类构建需要做出改变。

## 一、修改实体类

Student类：

```java
package com.jms.pojo;
public class Student {
    private int id;
    private String name;
    private int tid;
    public Student() {
    }
    public Student(int id, String name, int tid) {
        this.id = id;
        this.name = name;
        this.tid = tid;
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
    public int getTid() {
        return tid;
    }
    public void setTid(int tid) {
        this.tid = tid;
    }
    @Override
    public String toString() {
        return "Student{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", tid=" + tid +
                '}';
    }
}
```

Teacher类：

```java
package com.jms.pojo;
import java.util.List;
public class Teacher {
    private int id;
    private String name;
    private List<Student> students;
    public Teacher() {
    }
    public Teacher(int id, String name, List<Student> students) {
        this.id = id;
        this.name = name;
        this.students = students;
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
    public List<Student> getStudents() {
        return students;
    }
    public void setStudents(List<Student> students) {
        this.students = students;
    }
    @Override
    public String toString() {
        return "Teacher{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", students=" + students +
                '}';
    }
}
```

## 二、一对多的实现

**1、** 按结果嵌套处理；

1、在TeacherMapper接口中声明方法

```java
Teacher getTeacher(int id);
```

2、在TeacherMapper.xml中实现接口的方法

```xml
<resultMap id="TeacherAndStudent" type="Teacher">
    <result property="id" column="tid"/>
    <result property="name" column="tname"/>
    <!--集合用这个collection，ofType表示集合泛型的类型-->
    <collection property="students" ofType="Student">
        <result property="id" column="sid"/>
        <result property="name" column="sname"/>
        <result property="tid" column="tid"/>
    </collection>
</resultMap>
<select id="getTeacher" parameterType="_int" resultMap="TeacherAndStudent">
    select t.id as tid,t.name as tname,s.id as sid,s.name as sname
    from mybaties.student as s,mybaties.teacher as t
    where t.id=s.tid and t.id=#{id}
</select>
```

可以看到多对一与一对多的实现大同小异，不同的地方就是多对一中的association标签变成了collection，我们还是看官方文档对coolection的说明：

**collection – 一个复杂类型的集合**

**　　嵌套结果映射 – 集合可以是 resultMap 元素，或是对其它结果映射的引用**

所以collection用于集合，ofType表示集合中泛型的类型。在官方文档中，多对一代表关联，一对多代表集合。

3、junit测试

```java
@Test
public void getTeacherTest() {
    SqlSession sqlSession = MyBatisUtil.getSqlSession();
    TeacherMapper teacherMapper = sqlSession.getMapper(TeacherMapper.class);
    Teacher teacher = teacherMapper.getTeacher(1);
    System.out.println(teacher);
　　　　 sqlSession.close();
}
```

测试结果：

没有问题。

**2、** 按查询嵌套处理；

1、在TeacherMapper接口中声明方法

```java
Teacher getTeacher2(int id);
```

2、在TeacherMapper.xml中实现接口的方法

```xml
<resultMap id="TeacherAndStudent2" type="Teacher">
    <result property="id" column="id"/>
    <collection property="students" column="id" javaType="List" ofType="Student" select="getStudent"/>
</resultMap>
<select id="getTeacher2" parameterType="_int" resultMap="TeacherAndStudent2">
    select * from mybaties.teacher where id=#{id}
</select>
<select id="getStudent" resultType="Student">
    select * from mybaties.student where tid=#{id}
</select>
```

大同小异。

需要注意的是，这里这句映射是必要的，因为查询到的id列还被映射到了students集合，如果不进行映射，会出现Teacher的id为0的情况。

3、junit测试

```java
@Test
public void getTeacherTest2() {
    SqlSession sqlSession = MyBatisUtil.getSqlSession();
    TeacherMapper teacherMapper = sqlSession.getMapper(TeacherMapper.class);
    Teacher teacher = teacherMapper.getTeacher2(1);
    System.out.println(teacher);
　　　　 sqlSession.close();
}
```

测试结果：

没有问题。

（本文仅作个人学习用，如有纰漏敬请指正）
