# 5.2 ActiveRecordPlugin
- 来源：https://ddkk.com/zhuanlan/orm/jfinal/42.html
- 分类：ORM框架
- 分组：5 ActiveRecord
ActiveRecord是作为JFinal的Plugin而存在的，所以使用时需要在JFinalConfig中配置ActiveRecordPlugin。

以下是Plugin配置示例代码：

```java
public class DemoConfig extends JFinalConfig {
  public void configPlugin(Plugins me) {
  DruidPlugin dp = new DruidPlugin("jdbc:mysql://localhost/db_name", "userName", "password");
    me.add(dp);
    ActiveRecordPlugin arp = new ActiveRecordPlugin(dp);
    me.add(arp);
    arp.addMapping("user", User.class);
    arp.addMapping("article", "article_id", Article.class);
  }
}
```

以上代码配置了两个插件：DruidPlugin与ActiveRecordPlugin，前者是druid数据源插件，后者是ActiveRecrod支持插件。ActiveReceord中定义了addMapping(String tableName, Class modelClass>)方法，该方法建立了数据库表名到Model的映射关系。

另外，以上代码中arp.addMapping("user", User.class)，表的主键名为默认为 "id"，如果主键名称为 "user_id" 则需要手动指定，如：arp.addMapping("user", "user_id", User.class)。

**重要**：以上的 arp.addMapping(...) 映射配置，可以让 jfinal 生成器自动化完成，不再需要手动添加这类配置，具体用法见文档：[https://www.jfinal.com/doc/5-4](https://www.jfinal.com/doc/5-4)

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> JFinal 官方 | https://jfinal.com
