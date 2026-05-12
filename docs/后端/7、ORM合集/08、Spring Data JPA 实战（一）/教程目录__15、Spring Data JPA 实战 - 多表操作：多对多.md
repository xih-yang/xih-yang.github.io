# 15、Spring Data JPA 实战 - 多表操作：多对多
- 来源：https://ddkk.com/zhuanlan/orm/springdatajpa/5/15.html
- 分类：ORM框架
- 分组：教程目录
## 1. 环境搭建

我还是在之前的之前的工程文件里面进行操作，在这里核心配置文件还是之前的能够，pom坐标也没有变化，这一次将不会创建数据库表，通过jpa自动创建数据库表

### 1.1 创建实体类

#### 1.1.1 用户表

```java
package cn.yy.domain;
import javax.persistence.*;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2022/12/7
 */
@Entity
@Table(name = "sys_user")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
   private long userId;
    @Column(name = "user_name")
   private String userName;
    @Column(name = "age")
   private Integer age;
    public long getUserId() {
        return userId;
    }
    public void setUserId(long userId) {
        this.userId = userId;
    }
    public String getUserName() {
        return userName;
    }
    public void setUserName(String userName) {
        this.userName = userName;
    }
    public Integer getAge() {
        return age;
    }
    public void setAge(Integer age) {
        this.age = age;
    }
}
```

#### 1.1.2 角色表

```java
package cn.yy.domain;
import javax.persistence.*;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2022/12/7
 */
@Entity
@Table(name = "sys_role")
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "role_id")
    private long roleId;
    @Column(name = "role_name")
    private String roleName;
    public long getRoleId() {
        return roleId;
    }
    public void setRoleId(long roleId) {
        this.roleId = roleId;
    }
    @Override
    public String toString() {
        return "User{" +
                "roleId=" + roleId +
                ", roleName='" + roleName + '\'' +
                '}';
    }
    public String getRoleName() {
        return roleName;
    }
    public void setRoleName(String roleName) {
        this.roleName = roleName;
    }
}
```

### 1.2 创建Dao接口

#### 1.2.1 用户接口

```java
package cn.yy.dao;
import cn.yy.domain.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2022/12/5
 *
 *      符合SpringDataJpa的dao层接口规范
 *              JpaRepository<操作的实体类类型，实体类中主键属性的类型>
 *                  封装了基本CRUD操作”
 *              JpaSpecificationExecutor<操作的实体类类型>
 *                  封装了复杂查询(分页)
 */
public interface UserDao extends JpaRepository<User,Long>, JpaSpecificationExecutor<User> {
}
```

#### 1.2.1 角色接口

```java
package cn.yy.dao;
import cn.yy.domain.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2022/12/5
 *
 *      符合SpringDataJpa的dao层接口规范
 *              JpaRepository<操作的实体类类型，实体类中主键属性的类型>
 *                  封装了基本CRUD操作”
 *              JpaSpecificationExecutor<操作的实体类类型>
 *                  封装了复杂查询(分页)
 */
public interface RoleDao extends JpaRepository<Role,Long>, JpaSpecificationExecutor<Role> {
}
```

## 2. 配置多对多关系

### 2.1 配置角色到用户的多对多关系

在实体类User中进行配置

```java
/*
    配置用户到角色的多对多关系
        配置多对多的映射关系：
            1.声明表关系的配置
                targetEntity:代表对方的实体类字节码
            2.配置中间表(包含两个外键)
                @JoinTable
                    name :中间表的名称
                    joinColumns:配置当前对象在中间表的外键
                        @JoinColumn的数组
                            name:  外键名
                            referencedColunName:参照的主表的主键名|
                    inverseJoinColumns:配置对方对象在中间表的外键
 */
@ManyToMany(targetEntity = Role.class)
@JoinTable(name = "sys_user_role",
        //joinColumns,当前对象在中间表中的外键
        joinColumns = {
 @JoinColumn(name = "sys_user_id",referencedColumnName = "user_id")},
        //inverseJoinColumns,对方对象在中间表的外键
        inverseJoinColumns = {
 @JoinColumn(name = "sys_role_id",referencedColumnName = "role_id")}
)
private Set<Role> roles = new HashSet<>();
public Set<Role> getRoles() {
    return roles;
}
```

### 2.2 配置角色到用户的多对多关系

在实体类role里面进行配置

```java
/*
    配置用户到角色的多对多关系
        配置多对多的映射关系：
            1.声明表关系的配置
                targetEntity:代表对方的实体类字节码
            2.配置中间表(包含两个外键)
                @JoinTable
                    name :中间表的名称
                    joinColumns:配置当前对象在中间表的外键
                        @JoinColumn的数组
                            name:  外键名
                            referencedColunName:参照的主表的主键名|
                    inverseJoinColumns:配置对方对象在中间表的外键
 */
@ManyToMany(targetEntity = User.class)
@JoinTable(name = "sys_user_role",
        //joinColumns,当前对象在中间表中的外键
        joinColumns = {
 @JoinColumn(name = "sys_role_id",referencedColumnName = "role_id")},
        //inverseJoinColumns,对方对象在中间表的外键
        inverseJoinColumns = {
 @JoinColumn(name = "sys_user_id",referencedColumnName = "user_id")}
)
private Set<User> users = new HashSet<>();
public Set<User> getUsers() {
    return users;
}
```

### 2.3 多对多放弃维护权

因为如果用户和角色都可以对中间表进行维护，所以会引起主键冲突

`多对多放弃维护权：是被动的一方放弃维护权，因此本例中应该是角色放弃维护权（角色是被选择的）`

```java
@ManyToMany(mappedBy = "roles")
    private Set<User> users = new HashSet<>();
```

## 3. 测试

### 3.1 保存

测试类

```java
package cn.yy.test;
import cn.yy.dao.ManyCustomerDao;
import cn.yy.dao.ManyLinkManDao;
import cn.yy.dao.RoleDao;
import cn.yy.dao.UserDao;
import cn.yy.domain.Customer;
import cn.yy.domain.LinkMan;
import cn.yy.domain.Role;
import cn.yy.domain.User;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.annotation.Rollback;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import org.springframework.transaction.annotation.Transactional;
import sun.nio.cs.US_ASCII;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2022/12/5
 */
@RunWith(SpringJUnit4ClassRunner.class)//声明spring提供的单元测试环境
@ContextConfiguration(locations = "classpath:applicationContext.xml")//指定spring容器的配置信息
public class ManyToManyTest {
    @Autowired
    private UserDao userDao;
    @Autowired
    private RoleDao roleDao;
    /**
     * 保存一个用户，保存一个角色
     */
    @Test
    @Transactional
    @Rollback(false)
    public void testAdd(){
        User user = new User();
        user.setUserName("小王");
        Role role = new Role();
        role.setRoleName("工程师");
        //配置用户到角色的关系，因此可以对中间表中的数据进行维护
        user.getRoles().add(role);
        //配置角色到用户的关系，可以对中间表的数据进行维护
        role.getUsers().add(user);
        userDao.save(user);
        roleDao.save(role);
    }
}
```

运行结果：

### 3.2 级联操作

修改实体类User

```java
@ManyToMany(targetEntity = Role.class,cascade = CascadeType.ALL)
@JoinTable(name = "sys_user_role",
        //joinColumns,当前对象在中间表中的外键
        joinColumns = {
 @JoinColumn(name = "sys_user_id",referencedColumnName = "user_id")},
        //inverseJoinColumns,对方对象在中间表的外键
        inverseJoinColumns = {
 @JoinColumn(name = "sys_role_id",referencedColumnName = "role_id")}
)
private Set<Role> roles = new HashSet<>();
```

#### 3.2.1 级联添加

测试方法是在3.1中的测试类中

```java
/**
 * 测试级联添加（保存一个用户的同时保存用户的关联角色）
 */
@Test
@Transactional
@Rollback(false)
public void testAdd1(){
    User user = new User();
    user.setUserName("小王");
    Role role = new Role();
    role.setRoleName("工程师");
    //配置用户到角色的关系，因此可以对中间表中的数据进行维护
    user.getRoles().add(role);
    //配置角色到用户的关系，可以对中间表的数据进行维护
    role.getUsers().add(user);
    userDao.save(user);
}
```

运行结果：

#### 3.2.1 级联删除

测试方法是在3.1中的测试类中

```java
/**
 * 删除id为1的用户，同时删除他的关联内容
 */
@Test
@Transactional
@Rollback(false)
public void testDelete(){
    //查询id为1的用户
    User us = userDao.findOne(1l);
    //删除该用户
    userDao.delete(us);
}
```

运行结果：
