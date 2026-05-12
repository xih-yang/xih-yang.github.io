# 11、MyBatis 实战 - 之MyBatis多对一映射查询
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/6/11.html
- 分类：ORM框架
- 分组：教程目录
## 一、场景描述

**有两张表：**

```java
学生表 t_stu 和  班级表 t_clazz，学生表的cid和班级表的cid关联，
表示一个班级有多个学生
```

以学生表 t_stu为主表，即“多”，以班级表t_clazz为副表，即“一”，我们下面通过mybatis高级映射实现多对一的情况

## 二、实现多对一查询的三种方式

### 准备工作

**两个类**

```java
学生类 Stu ：多对一，学生表为主表，Stu类里面需要加上班级属性
```

```java
public class Stu {
    private Integer sid;
    private String name;
    private Clazz clazz;
    ......
}
```

```java
班级类 Clazz 
```

```java
public class Clazz {
    private Integer cid;
    private String name;
......
}
```

### 方式一、级联属性映射查询

```java
StuMapper 接口
```

```java
public interface StuMapper {
    public Stu selectBySid(Integer sid);
}
```

```java
StuMapper.xml文件
```

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.powernode.mybatis.mapper.StuMapper">
    <!--方式一：级联映射-->
    <resultMap id="stuMap" type="Stu">
        <id property="sid" column="sid"/>
        <result property="name" column="name"/>
        <result property="clazz.cid" column="cid"/>
        <result property="clazz.name" column="name"/>
    </resultMap>
    <select id="selectBySid" resultMap="stuMap">
        select s.sid,s.name,c.cid,c.name from t_stu s left join t_clazz c on s.cid = c.cid
        where s.sid ={sid}
    </select>
</mapper>
```

```java
测试类跑一下
```

```java
	@Test
    public void testAdvanceMapping(){
        SqlSession sqlSession = SqlSessionUtil.openSqlSession();
        StuMapper mapper = sqlSession.getMapper(StuMapper.class);
        Stu stu = mapper.selectBySid(1);
        System.out.println(stu.toString());
    }
```

```java
运行结果
```

```java
11:23:30.891 default [main] DEBUG c.p.m.mapper.StuMapper.selectBySid - ==>  Preparing: select s.sid,s.name,c.cid,c.name from t_stu s left join t_clazz c on s.cid = c.cid where s.sid = ?
11:23:30.982 default [main] DEBUG c.p.m.mapper.StuMapper.selectBySid - ==> Parameters: 1(Integer)
11:23:31.050 default [main] DEBUG c.p.m.mapper.StuMapper.selectBySid - <==      Total: 1
Stu{
     sid=1, name='张三', clazz=Clazz{
     cid=1000, name='张三'}}
```

### 方式二、使用association属性 进行关联查询

```java
StuMapper 接口
```

```java
public interface StuMapper {
    public Stu selectAssociationBySid(Integer sid);
}
```

```java
StuMapper.xml文件
```

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.powernode.mybatis.mapper.StuMapper">
    <resultMap id="stuAssociationMap" type="Stu">
        <id property="sid" column="sid"/>
        <result property="name" column="name"/>
        <association property="clazz" javaType="Clazz">
            <id property="cid" column="cid"/>
            <result property="name" column="name"/>
        </association>
    </resultMap>
    <select id="selectAssociationBySid" resultMap="stuAssociationMap">
        select s.sid,s.name,c.cid,c.name 
        from t_stu s 
        left join t_clazz c 
        on s.cid = c.cid
        where s.sid ={sid}
    </select>
</mapper>
```

```java
测试类跑一下
```

```java
	@Test
    public void testAdvanceMappingAssociation(){
        SqlSession sqlSession = SqlSessionUtil.openSqlSession();
        StuMapper mapper = sqlSession.getMapper(StuMapper.class);
        Stu stu = mapper.selectAssociationBySid(1);
        System.out.println(stu.toString());
    }
```

```java
运行结果
```

```java
11:26:38.082 default [main] DEBUG c.p.m.m.S.selectAssociationBySid - ==>  Preparing: select s.sid,s.name,c.cid,c.name from t_stu s left join t_clazz c on s.cid = c.cid where s.sid = ?
11:26:38.128 default [main] DEBUG c.p.m.m.S.selectAssociationBySid - ==> Parameters: 1(Integer)
11:26:38.171 default [main] DEBUG c.p.m.m.S.selectAssociationBySid - <==      Total: 1
Stu{
     sid=1, name='张三', clazz=Clazz{
     cid=1000, name='张三'}}
```

### 方式三、分步查询

```java
StuMapper 接口
```

```java
public interface StuMapper {
    public Stu selectBySidStep1(Integer sid);
}
```

```java
ClazzMapper接口
```

```java
public interface ClazzMapper {
    public Clazz selectByCidStep2(Integer cid);
}
```

```java
StuMapper.xml文件
```

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.powernode.mybatis.mapper.StuMapper">
    <!--分步骤查询-->
    <resultMap id="selectBySidStepMap" type="Stu">
        <id property="sid" column="sid"/>
        <result property="name" column="name"/>
        <association property="clazz"
                     select="com.powernode.mybatis.mapper.ClazzMapper.selectByCidStep2"
                     column="cid"
        />
    </resultMap>
    <select id="selectBySidStep1" resultMap="selectBySidStepMap">
        select s.sid,s.name,s.cid from t_stu s
        where s.sid ={sid}
    </select>
</mapper>
```

```java
ClazzMapper.xml文件
```

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.powernode.mybatis.mapper.ClazzMapper">
    <select id="selectByCidStep2" resultType="Clazz">
        select * from t_clazz where cid ={cid}
    </select>
</mapper>
```

```java
测试类跑一下
```

```java
	@Test
    public void testAdvanceMappingStep(){
        SqlSession sqlSession = SqlSessionUtil.openSqlSession();
        StuMapper mapper = sqlSession.getMapper(StuMapper.class);
        Stu stu = mapper.selectBySidStep1(1);
        System.out.println(stu.getName());
        System.out.println(stu.getClazz());
    }
```

```java
运行结果
```

```java
11:33:51.221 default [main] DEBUG c.p.m.m.StuMapper.selectBySidStep1 - ==>  Preparing: select s.sid,s.name,s.cid from t_stu s where s.sid = ?
11:33:51.294 default [main] DEBUG c.p.m.m.StuMapper.selectBySidStep1 - ==> Parameters: 1(Integer)
11:33:51.419 default [main] DEBUG c.p.m.m.StuMapper.selectBySidStep1 - <==      Total: 1
11:33:51.426 default [main] DEBUG c.p.m.m.ClazzMapper.selectByCidStep2 - ==>  Preparing: select * from t_clazz where cid = ?
11:33:51.426 default [main] DEBUG c.p.m.m.ClazzMapper.selectByCidStep2 - ==> Parameters: 1000(Integer)
11:33:51.441 default [main] DEBUG c.p.m.m.ClazzMapper.selectByCidStep2 - <==      Total: 1
Stu{
     sid=1, name='张三', clazz=Clazz{
     cid=1000, name='高三一班'}}
```
