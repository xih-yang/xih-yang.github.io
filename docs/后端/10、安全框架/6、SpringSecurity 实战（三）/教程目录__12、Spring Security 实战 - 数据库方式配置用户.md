# 12、Spring Security 实战 - 数据库方式配置用户
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/9/12.html
- 分类：安全框架
- 分组：教程目录
## 前言

之前已经在数据库中创建好了相应的表，下面代码实现。

## 实体类

这里就直接通过代码生成器进行生成实体类。代码生成器如何使用在[前面](https://blog.csdn.net/csdn_20210509/article/details/116568369)介绍过，这里不再进行介绍。

### 依赖

```java
<dependency>
    <groupId>com.alibaba</groupId>
    <artifactId>druid-spring-boot-starter</artifactId>
    <version>1.1.22</version>
</dependency>
<dependency>
    <groupId>com.baomidou</groupId>
    <artifactId>mybatis-plus-boot-starter</artifactId>
    <version>3.4.0</version>
</dependency>
<dependency>
    <groupId>com.baomidou</groupId>
    <artifactId>mybatis-plus-generator</artifactId>
    <version>3.4.0</version>
</dependency>
<dependency>
    <groupId>org.apache.velocity</groupId>
    <artifactId>velocity-engine-core</artifactId>
    <version>2.2</version>
</dependency>
<dependency>
    <groupId>com.google.guava</groupId>
    <artifactId>guava</artifactId>
    <version>30.1-jre</version>
</dependency>
```

将生成的**SysUser**实现**UserDetails**

```java
@Data
@EqualsAndHashCode(callSuper = false)
@ApiModel(value="SysUser对象", description="系统用户")
public class SysUser implements Serializable, UserDetails {
    private static final long serialVersionUID = 1L;
    @ApiModelProperty(value = "主键id")
    private String id;
    @ApiModelProperty(value = "昵称")
    private String nickName;
    @ApiModelProperty(value = "手机号")
    private String mobile;
    @ApiModelProperty(value = "用户名")
    private String username;
    @ApiModelProperty(value = "密码")
    private String password;
    private String userFace;
    @ApiModelProperty(value = "是否禁用，0：否，1：是")
    @TableField("is_disabled")
    private Boolean disabled;
    @ApiModelProperty(value = "是否锁定，0：否，1：是")
    @TableField("is_locked")
    private Boolean locked;
    @ApiModelProperty(value = "是否过期，0：否，1：是")
    @TableField("is_expired")
    private Boolean expired;
    @ApiModelProperty(value = "凭证是否过期，0：否，1是")
    @TableField("is_credentials_expired")
    private Boolean credentialsExpired;
    @ApiModelProperty(value = "创建时间")
    @TableField(fill = FieldFill.INSERT)
    private Date createTime;
    @ApiModelProperty(value = "更新时间")
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private Date updateTime;
    @ApiModelProperty(value = "是否删除，0：未删除，1：删除")
    @TableField("is_deleted")
    @TableLogic
    private Boolean deleted;
    @TableField(exist = false)
    private List<SysRole> roles;
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        List<SimpleGrantedAuthority> authorities = new ArrayList<>(roles.size());
        for (SysRole role : roles) {
            for (SysMenu sysMenu : role.getMenus()) {
                authorities.add(new SimpleGrantedAuthority(sysMenu.getUrl()));
            }
        }
        return authorities;
    }
    @Override
    public boolean isAccountNonExpired() {
        return !this.expired;
    }
    @Override
    public boolean isAccountNonLocked() {
        return !this.locked;
    }
    @Override
    public boolean isCredentialsNonExpired() {
        return !this.credentialsExpired;
    }
    @Override
    public boolean isEnabled() {
        return !this.disabled;
    }
}
```

新建**DefaultUserDetailsService**实现**UserDetailsService**

```java
@Service
public class DefaultUserDetailsService implements UserDetailsService {
    @Autowired
    private SysUserService sysUserService;
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        SysUser sysUser = sysUserService.findUserMenuByUsername(username);
        if (sysUser == null) {
            throw new UsernameNotFoundException("用户名或密码错误");
        }
        return sysUser;
    }
}
```

在生成的**SysUserService**接口中添加查询用户方法

```java
public interface SysUserService extends IService<SysUser> {
    /**
     * 通过用户名获取用户信息（包含角色权限）
     *
     * @param username username
     * @return 用户信息
     */
    SysUser findUserMenuByUsername(String username);
}
```

在**SysUserService**的实现类中实现相应方法

```java
@Service
public class SysUserServiceImpl extends ServiceImpl<SysUserMapper, SysUser> implements SysUserService {
    @Override
    public SysUser findUserMenuByUsername(String username) {
        if (StringUtils.isBlank(username)){
            return null;
        }
        return baseMapper.selectUserMenuByUsername(username);
    }
}
```

通过**SysUserMapper**去查询数据库

```java
public interface SysUserMapper extends BaseMapper<SysUser> {
    /**
     * 通过用户名获取用户信息（包含角色权限）
     *
     * @param username username
     * @return 用户信息
     */
    SysUser selectUserMenuByUsername(@Param("username") String username);
}
```

**SysUserMapper.xml**

```java
<resultMap id="User_Menu" type="com.example.security.model.SysUser">
    <id column="id" property="id"/>
    <result column="create_time" property="createTime"/>
    <result column="update_time" property="updateTime"/>
    <result column="nick_name" property="nickName"/>
    <result column="mobile" property="mobile"/>
    <result column="username" property="username"/>
    <result column="password" property="password"/>
    <result column="user_face" property="userFace"/>
    <result column="is_disabled" property="disabled"/>
    <result column="is_locked" property="locked"/>
    <result column="is_expired" property="expired"/>
    <result column="is_credentials_expired" property="credentialsExpired"/>
    <result column="is_deleted" property="deleted"/>
    <collection property="roles" ofType="com.example.security.model.SysRole">
        <id column="r_id" property="id"/>
        <result column="r_create_time" property="createTime"/>
        <result column="r_update_time" property="updateTime"/>
        <result column="name_en" property="nameEn"/>
        <result column="name_zh" property="nameZh"/>
        <result column="remark" property="remark"/>
        <result column="r_is_deleted" property="deleted"/>
        <collection property="menus" ofType="com.example.security.model.SysMenu">
            <id column="m_id" property="id"/>
            <result column="m_create_time" property="createTime"/>
            <result column="m_update_time" property="updateTime"/>
            <result column="url" property="url"/>
            <result column="path" property="path"/>
            <result column="component" property="component"/>
            <result column="name" property="name"/>
            <result column="icon" property="icon"/>
            <result column="type" property="type"/>
            <result column="parent_id" property="parentId"/>
            <result column="m_is_deleted" property="deleted"/>
        </collection>
    </collection>
</resultMap>
<select id="selectUserMenuByUsername" resultMap="User_Menu">
    SELECT u.id,u.create_time, u.update_time, u.nick_name, u.mobile, u.username, u.password, u.user_face, u.is_disabled,
    u.is_locked, u.is_expired, u.is_credentials_expired, u.is_deleted,
    r.id r_id, r.create_time r_create_time, r.update_time r_update_time, r.name_en, r.name_zh, r.remark, r.is_deleted r_is_deleted,
    m.id m_id, m.create_time m_create_time, m.update_time m_update_time, m.url, m.path, m.component, m.name, m.icon, m.type, m.parent_id, m.is_deleted m_is_deleted
    FROM sys_user u
    LEFT JOIN sys_user_role ur ON u.id = ur.user_id
    LEFT JOIN sys_role r ON ur.role_id = r.id
    LEFT JOIN sys_role_menu rm ON r.id = rm.role_id
    LEFT JOIN sys_menu m ON rm.menu_id = m.id
    WHERE u.username ={username}
</select>
```

## 修改配置类

添加**MybatisPlusConfig**

```java
@Configuration
@MapperScan(basePackages = "com.example.security.mapper")
@EnableTransactionManagement
public class MybatisPlusConfig {
    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor mybatisPlusInterceptor = new MybatisPlusInterceptor();
        PaginationInnerInterceptor innerInterceptor = new PaginationInnerInterceptor(DbType.MYSQL);
        innerInterceptor.setMaxLimit(-1L);
        mybatisPlusInterceptor.addInnerInterceptor(innerInterceptor);
        mybatisPlusInterceptor.addInnerInterceptor(new OptimisticLockerInnerInterceptor());
        return mybatisPlusInterceptor;
    }
}
```

修改**SpringSecurityConfig**

```java
@Autowired
DefaultUserDetailsService defaultUserDetailsService;
```

方便后期查阅，这里注释掉之前代码

```java
@Override
protected void configure(AuthenticationManagerBuilder auth) throws Exception {
//        auth.inMemoryAuthentication()
//                .withUser("user")
//                .password(passwordEncoder().encode("123"))
//                .authorities("user");
//        auth.inMemoryAuthentication()
//                .withUser("admin")
//                .password(passwordEncoder().encode("123"))
//                .authorities("admin");
    auth.userDetailsService(defaultUserDetailsService);
}
```

配置权限

```java
http.authorizeRequests()
.antMatchers("/sys/user/list").hasAuthority("/sys/user/list")
.antMatchers("/sys/user/query").hasAuthority("/sys/user/query")
.anyRequest().authenticated();
```

修改**Controller**

```java
@GetMapping("/sys/user/list")
public String user(){
    return "user";
}
@GetMapping("/sys/user/query")
public String admin(){
    return "admin";
}
```

## 验证

user用户只有list权限，admin拥有所有权限
