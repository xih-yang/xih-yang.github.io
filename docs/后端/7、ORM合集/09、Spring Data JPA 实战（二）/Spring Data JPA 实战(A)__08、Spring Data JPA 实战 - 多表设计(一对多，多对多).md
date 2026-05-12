# 08、Spring Data JPA 实战 - 多表设计(一对多，多对多)
- 来源：https://ddkk.com/zhuanlan/orm/springdatajpa/6/8.html
- 分类：ORM框架
- 分组：Spring Data JPA 实战(A)
## 表之间的划分

数据库中多表之间存在着三种关系，如图所示

从图可以看出，系统设计的三种实体关系分别为：`多对多`、`一对多`和`一对一`关系。注意：一对多关系可以看为两种： 即`一对多`，`多对一`。所以说四种更精确。

## 分析步骤

在实际开发中，我们数据库的表难免会有相互的关联关系，在操作表的时候就有可能会涉及到多张表的操作。而在这种实现了ORM思想的框架中（如JPA），可以让我们通过操作实体类就实现对数据库表的操作。所以今天我们的学习重点是：掌握配置实体之间的关联关系。

**1、****第一步：首先确定两张表之间的关系**；

如果关系确定错了，后面做的所有操作就都不可能正确。

**1、****第二步：在数据库中实现两张表的关系**；

**2、****第三步：在实体类中描述出两个实体的关系**；

**3、****第四步：配置出实体类和数据库表的关系映射（重点）** ；

## 一对多

### 例子

我们采用的示例为客户和联系人。

客户：指的是一家公司，我们记为A。

联系人：指的是A公司中的员工。

在不考虑兼职的情况下，公司和员工的关系即为一对多。

### 表关系建立

在一对多关系中，我们习惯把`一的一方称之为主表`，把`多的一方称之为从表`。在数据库中建立一对多的关系，需要使用数据库的外键约束。

### 创建数据库表

```java
/*创建客户表*/
CREATE TABLE cst_customer (
    cust_id bigint(32) NOT NULL AUTO_INCREMENT COMMENT '客户编号(主键)',
    cust_name varchar(32) NOT NULL COMMENT '客户名称(公司名称)',
    cust_source varchar(32) DEFAULT NULL COMMENT '客户信息来源',
    cust_industry varchar(32) DEFAULT NULL COMMENT '客户所属行业',
    cust_level varchar(32) DEFAULT NULL COMMENT '客户级别',
    cust_address varchar(128) DEFAULT NULL COMMENT '客户联系地址',
    cust_phone varchar(64) DEFAULT NULL COMMENT '客户联系电话',
    PRIMARY KEY (cust_id)
) ENGINE=InnoDB AUTO_INCREMENT=94 DEFAULT CHARSET=utf8;
/*创建联系人表*/
CREATE TABLE cst_linkman (
    lkm_id bigint(32) NOT NULL AUTO_INCREMENT COMMENT '联系人编号(主键)',
    lkm_name varchar(16) DEFAULT NULL COMMENT '联系人姓名',
    lkm_gender char(1) DEFAULT NULL COMMENT '联系人性别',
    lkm_phone varchar(16) DEFAULT NULL COMMENT '联系人办公电话',
    lkm_mobile varchar(16) DEFAULT NULL COMMENT '联系人手机',
    lkm_email varchar(64) DEFAULT NULL COMMENT '联系人邮箱',
    lkm_position varchar(16) DEFAULT NULL COMMENT '联系人职位',
    lkm_memo varchar(512) DEFAULT NULL COMMENT '联系人备注',
    lkm_cust_id bigint(32) NOT NULL COMMENT '客户id(外键)',
    PRIMARY KEY (lkm_id),
    KEY FK_cst_linkman_lkm_cust_id (lkm_cust_id),
    CONSTRAINT FK_cst_linkman_lkm_cust_id FOREIGN KEY (lkm_cust_id) REFERENCES cst_customer (cust_id) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;
```

### 创建实体类映射

#### Customer#

```java
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @Description 用户实体类
 */
@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name="cst_customer")
public class Customer implements Serializable  {
    /**
     * 客户编号(主键)
     */
    @Id
    @GeneratedValue(strategy= GenerationType.IDENTITY) //自增主键，默认是Auto
    @Column(name="cust_id")  //如果可以直接映射，这个注解不需要写
    private Long custId;
    /**
     * 客户名称(公司名称)
     */
    @Column(name="cust_name")
    private String custName;
    /**
     * 客户信息来源
     */
    @Column(name="cust_source")
    private String custSource;
    /**
     * 客户所属行业
     */
    @Column(name="cust_industry")
    private String custIndustry;
    /**
     * 客户级别
     */
    @Column(name="cust_level")
    private String custLevel;
    /**
     * 客户联系地址
     */
    @Column(name="cust_address")
    private String custAddress;
    /**
     * 客户联系电话
     */
    @Column(name="cust_phone")
    private String custPhone;
    /**
     * 联系人集合
     *
     * 配置多表一对多关系
     *      声明关系
     * 在客户实体类上(一的一方)添加了外键配置，所以对于客户而言，也具备了维护外键的作用
     */
    @OneToMany(mappedBy = "customer",cascade=CascadeType.ALL,fetch=FetchType.LAZY)
    //级联保存、更新、删除、刷新;延迟加载。当删除用户，会级联删除该用户的所有文章
    //拥有mappedBy注解的实体类为关系被维护端
    //mappedBy="customer"中的customer是LinkMan中的customer属性
    private Set<LinkMan> linkMans=new HashSet<>();
    @Override
    public String toString() {
        return "Customer{" +
                "custId=" + custId +
                ", custName='" + custName + '\'' +
                ", custSource='" + custSource + '\'' +
                ", custIndustry='" + custIndustry + '\'' +
                ", custLevel='" + custLevel + '\'' +
                ", custAddress='" + custAddress + '\'' +
                ", custPhone='" + custPhone + '\'' +
                ", linkMans=" + linkMans +
                '}';
    }
}
```

#### LinkMan#

```java
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @Description 联系人实体类
 */
@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name="cst_linkman")
public class LinkMan implements Serializable  {
    /**
     * 联系人id
     */
    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    @Column(name="lkm_id")
    private Long lkmId;
    /**
     * 联系人姓名
     */
    @Column(name="lkm_name")
    private String lkmName;
    /**
     * 联系人性别
     */
    @Column(name="lkm_gender")
    private String lkmGender;
    /**
     * 联系人办公电话
     */
    @Column(name="lkm_phone")
    private String lkmPhone;
    /**
     * 联系人手机
     */
    @Column(name="lkm_mobile")
    private String lkmMobile;
    /**
     * 联系人邮箱
     */
    @Column(name="lkm_email")
    private String lkmEmail;
    /**
     * 联系人职位
     */
    @Column(name="lkm_position")
    private String lkmPosition;
    /**
     * 联系人备注
     */
    @Column(name="lkm_memo")
    private String lkmMemo;
    /**
     *客户
     *
     * 配置多表多对一关系
     *      1.声明关系
     *      2.配置外键(中间表)
     *
     */
    @ManyToOne(targetEntity = Customer.class,cascade=CascadeType.ALL)
    @JoinColumn(name="lkm_cust_id")
    private Customer customer;
    @Override
    public String toString() {
        return "LinkMan{" +
                "lkmId=" + lkmId +
                ", lkmName='" + lkmName + '\'' +
                ", lkmGender='" + lkmGender + '\'' +
                ", lkmPhone='" + lkmPhone + '\'' +
                ", lkmMobile='" + lkmMobile + '\'' +
                ", lkmEmail='" + lkmEmail + '\'' +
                ", lkmPosition='" + lkmPosition + '\'' +
                ", lkmMemo='" + lkmMemo + '\'' +
                '}';
    }
}
```

### 创建数据库操作类

```java
@Repository
public interface  CustomerRepository  extends JpaRepository<Customer,Long>, JpaSpecificationExecutor<Customer> {
}
```

```java
@Repository
public interface LinkManRepository extends JpaRepository<LinkMan,Long>, JpaSpecificationExecutor<LinkMan> {
}
```

### 注解说明

- @OneToMany:

作用：建立一对多的关系映射

属性：

```java
  targetEntityClass：指定多的多方的类的字节码
  mappedBy：指定从表实体类中引用主表对象的名称。
  cascade：指定要使用的级联操作
  fetch：指定是否采用延迟加载
  orphanRemoval：是否使用孤儿删除
```

- @ManyToOne

作用：建立多对一的关系

属性：

```java
targetEntityClass：指定一的一方实体类字节码
cascade：指定要使用的级联操作
fetch：指定是否采用延迟加载
optional：关联是否可选。如果设置为false，则必须始终存在非空关系。
```

- @JoinColumn

作用：用于定义主键字段和外键字段的对应关系。

属性：

```java
  name：指定外键字段的名称
  referencedColumnName：指定引用主表的主键字段名称
  unique：是否唯一。默认值不唯一
  nullable：是否允许为空。默认值允许。
  insertable：是否允许插入。默认值允许。
  updatable：是否允许更新。默认值允许。
  columnDefinition：列的定义信息。
```

### 操作

```java
@Test
@Transactional(rollbackFor = Exception.class)
@Rollback(false)
public void testSave(){
    //创建一个客户
    Customer customer=new Customer();
    customer.setCustName("百度");
    //创建一个联系人
    LinkMan linkMan=new LinkMan();
    linkMan.setLkmName("小李");
    //保存到客户集合中
    //customer.getLinkMans().add(linkMan);
    //保存客户到联系人
    linkMan.setCustomer(customer);
    //先插入客户信息再插入联系人信息
    this.customerRepository.save(customer);
    this.linkManRepository.save(linkMan);
}
```

### 删除

- 删除从表数据:可以随时任意删除
- 删除主表数据

有从表数据

1). 在默认情况下，它会把外键字段置为null，然后删除主表数据。如果在数据库的表 结构上，外键字段有非空约束，默认情况就会报错了。

2). 如果配置了放弃维护关联关系的权利，则不能删除（与外键字段是否允许为null， 没有关系）因为在删除时，它根本不会去更新从表的外键字段了。

3). 如果还想删除，使用级联删除引用

没有从表数据引用：随便删

### 级联操作

级联操作：指操作一个对象同时操作它的关联对象

使用方法：`只需要在操作主体的注解上配置cascade`

cascade:配置级联操作

- CascadeType.MERGE 级联更新
- CascadeType.PERSIST 级联保存：
- CascadeType.REFRESH 级联刷新：
- CascadeType.REMOVE 级联删除：
- CascadeType.ALL 包含所有

```java
@OneToMany(mappedBy = "customer",cascade=CascadeType.ALL,fetch=FetchType.LAZY)
private Set<LinkMan> linkMans=new HashSet<>();
```

### 级联删除

```java
@Test
@Transactional(rollbackFor = Exception.class)
@Rollback(false)
public void testRemove(){
    //获取数据
    Customer customer = this.customerRepository.getOne(28L);
    //从主表中删除数据
    this.customerRepository.delete(customer);
}
```

### 出现的一个错误

👉[解决办法:SpringDataJpa在一对多、多对多关系的级联操作时出现StackOverflowError(是真滴坑)](https://blog.csdn.net/qq_44766883/article/details/107126456)

## 多对多

### 例子

我们采用的示例为用户和角色

用户：指的是咱们班的每一个同学。

角色：指的是咱们班同学的身份信息。

比如A同学，它是我的学生，其中有个身份就是学生，还是家里的孩子，那么他还有个身份是子女。

同时B同学，它也具有学生和子女的身份。

那么任何一个同学都可能具有多个身份。同时学生这个身份可以被多个同学所具有。

所以我们说，用户和角色之间的关系是多对多。

### 表关系建立

多对多的表关系建立靠的是`中间表`，其中用户表和中间表的关系是一对多，角色表和中间表的关系也是一对多，如下图所示：

### 创建实体类

#### Role#

```java
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @Description 角色实体类
 */
@Entity
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
@Table(name="sys_role")
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="role_id")
    private Long roleId;
    @Column(name="role_name")
    private String roleName;
    /**
     * 配置多对多关系
     * 被动的一方放弃维护权
     */
    //    @ManyToMany(targetEntity = User.class,cascade = CascadeType.ALL)
    //    @JoinTable(name="sys_user_role",
    //            //当前对象在中间表的外键
    //            joinColumns = {@JoinColumn(name="sys_role_id",referencedColumnName = "role_id")},
    //            //对方对象在中间表的外键
    //            inverseJoinColumns = {@JoinColumn(name="sys_user_id",referencedColumnName = "user_id")})
    @ManyToMany(mappedBy = "roles",cascade = CascadeType.ALL)
    private Set<User> users=new HashSet<>();
    @Override
    public String toString() {
        return "Role{" +
            "roleId=" + roleId +
            ", roleName='" + roleName + '\'' +
            '}';
    }
}
```

#### User#

```java
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @Description 用户实体类
 */
@Entity
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
@Table(name="sys_user")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="user_id")
    private Long userId;
    @Column(name="user_name")
    private String userName;
    @Column(name="age")
    private Integer age;
    /**
     * 配置多对多关系
     */
    @ManyToMany(targetEntity = Role.class,cascade = CascadeType.ALL)
    @JoinTable(name="sys_user_role",
               //当前对象在中间表的外键
               joinColumns = {
     @JoinColumn(name="sys_user_id",referencedColumnName = "user_id")},
               //对方对象在中间表的外键
               inverseJoinColumns = {
     @JoinColumn(name="sys_role_id",referencedColumnName = "role_id")})
    private Set<Role> roles=new HashSet<>();
    @Override
    public String toString() {
        return "User{" +
            "userId=" + userId +
            ", userName='" + userName + '\'' +
            ", age=" + age +
            ", roles=" + roles +
            '}';
    }
}
```

### 创建数据库操作类

```java
@Repository
public interface RoleRepository extends JpaRepository<Role,Long>, JpaSpecificationExecutor<Role> {
}
```

```java
@Repository
public interface UserRepository extends JpaRepository<User,Long>, JpaSpecificationExecutor<User> {
}
```

### 注解说明

- @ManyToMany

作用：用于映射多对多关系

属性：

cascade：配置级联操作。

fetch：配置是否采用延迟加载。

targetEntity：配置目标的实体类。映射多对多的时候不用写。

- @JoinTable

作用：针对中间表的配置

属性：

name：配置中间表的名称

joinColumns：中间表的外键字段关联当前实体类所对应表的主键字段

inverseJoinColumn：中间表的外键字段关联对方表的主键字段

- @JoinColumn

作用：用于定义主键字段和外键字段的对应关系。

属性：

name：指定外键字段的名称

referencedColumnName：指定引用主表的主键字段名称

unique：是否唯一。默认值不唯一

nullable：是否允许为空。默认值允许。

insertable：是否允许插入。默认值允许。

updatable：是否允许更新。默认值允许。

columnDefinition：列的定义信息。

### 操作

```java
@Test
@Transactional(rollbackFor = Exception.class)
@Rollback(false)
public void testSave(){
    User user=new User();
    user.setUserName("小李");
    Role role=new Role();
    role.setRoleName("java程序员");
    //配置用户到角色关系，可以对中间表中的数据进行维护 1-1
    user.getRoles().add(role);
    //配置角色到用户关系，可以对中间表中的数据进行维护 1-1
    //        role.getUsers().add(user);
    this.userRepository.save(user);
    this.roleRepository.save(role);
}
```

### 注意

如果双向都设置关系，意味着双方都维护中间表，都会往中间表插入数据，中间表的2个字段又作为联合主键，所以报错，主键重复，解决保存失败的问题：只需要在任意一方放弃对中间表的维护权即可，`推荐在被动的一方放弃`。

将

```java
@ManyToMany(targetEntity = User.class,cascade = CascadeType.ALL)
@JoinTable(name="sys_user_role",
           //当前对象在中间表的外键
           joinColumns = {
     @JoinColumn(name="sys_role_id",referencedColumnName = "role_id")},
           //对方对象在中间表的外键
           inverseJoinColumns = {
     @JoinColumn(name="sys_user_id",referencedColumnName = "user_id")})
private Set<User> users=new HashSet<>();
```

改为:

```java
@ManyToMany(mappedBy = "roles",cascade = CascadeType.ALL)
private Set<User> users=new HashSet<>();
```

### 级联删除

```java
@Test
@Transactional(rollbackFor = Exception.class)
@Rollback(false)
public void testDelete(){
    this.userRepository.deleteById(1L);
}
```
