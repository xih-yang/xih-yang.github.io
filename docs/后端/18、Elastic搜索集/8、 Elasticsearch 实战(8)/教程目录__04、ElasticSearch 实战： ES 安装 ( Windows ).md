# 04、ElasticSearch 实战： ES 安装 ( Windows )
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/8/4.html
- 分类：搜索引擎
- 分组：教程目录
上一章节中我们下载了 Elasticsearch 的最新版本，也安装和配置了 Java 环境。接下来，我们将尝试在 Windows 系统上安装 Elasticsearch

Windows 上安装 Elasticsearch 的过程非常简单

**1、** 下载完成后，选中elasticsearch-6.3.0.zip；

**2、** 点右键，选择解压到当前目录，不用管当前目录是哪个，先解压；

解压完成后显示如下

**3、** 然后将解压后的目录elasticsearch-6.3.0移动到你的开发环境目录，比如d:/devops目录；

**4、** 打开命令行提示符或者WindowsPowerShell；

如果你的电脑是 Window 8 或以上版本，在左下脚的搜索框里输入 Power shell 就可以看到 Windows PowerShell ，点击它打开 PowerShell

如果你的电脑是 Window 8 以下版本，则点击开始菜单，选择 **程序 -> 所有程序 -> 附件** 点击命令行提示符

**5、** 接下来先输入d:\进入d:盘目录，然后输入cddevops\elasticsearch-6.3.0\bin进入elasticsearch-6.3.0目录下的bin目录；

**6、** 接下来输入elasticsearch.bat--version查看是否有版本输出；

我们可以看到当前版本为 6.3.0 ，刚好是我们下载的版本，所以，配置正确

## 首次运行

还是在刚刚那个 PowerShell 中，输入 elasticsearch.bat 就会使用 elasticsearch-6.3.0\config 下的 elasticsearch.yml 配置文件来启动项目

在经过一系列的初始化之后，就会启动成功

## 检查是否成功启动

当启动成功后，就可以通过浏览器访问 [http://localhost:9200/](http://localhost:9200/) 来查看是否成功启动

可以看到 version 键下有当前 Elasticsearch 的相关信息，比如版本号为 6.3.0

## 停止

如果想要停止 elasticsearch 可以直接按下 CTRL + C 组合键，就可以停止服务了
