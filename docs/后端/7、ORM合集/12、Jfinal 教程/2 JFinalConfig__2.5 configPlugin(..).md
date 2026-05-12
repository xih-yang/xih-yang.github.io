# 2.5 configPlugin(..)
- 来源：https://ddkk.com/zhuanlan/orm/jfinal/16.html
- 分类：ORM框架
- 分组：2 JFinalConfig
此方法用来配置JFinal的Plugin，如下代码配置了Druid数据库连接池插件与ActiveRecord数据库访问插件。通过以下的配置，可以在应用中使用ActiveRecord非常方便地操作数据库。

```java
public void configPlugin(Plugins me) {
    DruidPlugin dp = new DruidPlugin(jdbcUrl, userName, password);
    me.add(dp);
    ActiveRecordPlugin arp = new ActiveRecordPlugin(dp);
    arp.addMapping("user", User.class);
    me.add(arp);
}
```

JFinal插件架构是其主要扩展方式之一，可以方便地创建插件并应用到项目中去。

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> JFinal 官方 | https://jfinal.com
